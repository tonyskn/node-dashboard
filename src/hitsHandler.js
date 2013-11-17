
var redis = require('redis'),
    dgram = require('dgram'),
    async = require('async'),
    _ = require('underscore'),
    TimeSeries = require('redis-timeseries'),

    redisPort = process.env.REDIS_PORT || 6379,
    redisHost = process.env.REDIS_HOTS || 'localhost',
    client = redis.createClient(redisPort, redisHost),
    ts = new TimeSeries(client, "stats"); 

/** Define supported granularities */
ts.granularities = {
  'last_minute' : { ttl: ts.minutes(1), duration: ts.seconds(1) },
  'last_hour' : { ttl: ts.hours(1), duration: ts.minutes(1) },
  'last_day'  : { ttl: ts.days(1), duration: ts.hours(0.5) },
  'last_week' : { ttl: ts.days(7), duration: ts.hours(4) }
};

var HitsHandler = module.exports = function(interval) {
  /* internal cache for the list of known counters */
  /* it will updated each time a hit is received */
  this.counters = [];
  /* polling interval in ms */
  this.interval = interval || 1000;
};

/** Make HitsHandler extend EventEmitter */
HitsHandler.prototype = Object.create(require('events').EventEmitter.prototype);

/** Fetch list of known counters from redis */
HitsHandler.prototype.fetchCounters = function(callback) {
  var self = this;

  client.smembers("stats", function(err, results) {
    self.counters = results;
    callback(err);
  });

  return this;
};

/** Remove a specific counter from redis */
HitsHandler.prototype.removeCounter = function(counter, callback) {
  var self = this;

  client.srem("stats", counter, function(err) {
    self.counters = _.without(self.counters, counter);
    callback(err);
  });

  return this;
};

/** Get full granularity stats for the given key */
HitsHandler.prototype.getStatsForKey = function(key, callback) {
  var self = this;

  async.map(Object.keys(ts.granularities),
            function(gran, step) {
              var size = ts.granularities[gran].ttl / ts.granularities[gran].duration;
              ts.getHits(key, gran, size, function(err, stats) {
                // redis-timeseries yields timestamps in secs
                // convert them to values in ms before yielding them client-side
                step(err, stats.map(function(s) { return [s[0]*1000, s[1]]; }));
              });
            }, function(err, data) {
              var result = _.object( Object.keys(ts.granularities), data );
              callback(err, result);
            });

  return this;
};

/** Get full stats for all counters */
HitsHandler.prototype.getFullStats = function(callback) {
  var self = this;

  async.map(this.counters, this.getStatsForKey, function(err, results) {
    callback(err, _.object(self.counters, results));
  });
  
  return this;
};

/** Record hit in Redis */
HitsHandler.prototype.onHit = function(counterName, timestamp) {
  var self = this; 

  timestamp = timestamp || Math.floor(Date.now() / 1000);

  /** If this counter is new, add it
   * to the list of known counters */
  if (!_.contains(self.counters, counterName)) {
    client.sadd("stats", counterName, function() {
      self.counters.push(counterName);
    });
  }

  /* Record hit */
  ts.recordHit(counterName, +timestamp).exec();

  return this;
};

/** Start the polling loop */
HitsHandler.prototype.startPolling = function() {
  var self = this;

  setInterval(function() {
    if (self.listeners('stats').length > 0) {
      self.getFullStats(function(err, stats) {
        if (!err) {
          self.emit('stats', stats);
        }
      });
    }
  }, self.interval);

  return this;
};

/** Main loop.
 * Listen on Redis channels and for
 * UDP broadcast events */
HitsHandler.prototype.start = function() {
  var self = this;

  self.fetchCounters(self.startPolling.bind(self));

  /** Listen on redis 'hits:*' channels for timestamps */
  var redisHitsHandler = redis.createClient(redisPort, redisHost);
  redisHitsHandler.on('psubscribe', function() {
    redisHitsHandler.on('pmessage', function(pattern, channel, timestamp) {
      self.onHit(channel.split(':')[1], timestamp);
    });
  });
  redisHitsHandler.psubscribe('hits:*');

  /** Listen for UDP broadcast messages and record event hit */
  var udp = dgram.createSocket('udp4');
  udp.on('message', function(msg, remote) {
    var content = JSON.parse(msg.toString('utf8', 0, remote.size));
    self.onHit(content.eventName);
  });
  udp.bind(process.env.UDP_PORT || 12342, '0.0.0.0');
};

