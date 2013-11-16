
var redis = require('redis').createClient(),
    key = process.argv[2],
    i = 0;

redis.on("error", function(err) { console.log("Error: ", err); });

var randomDelay = function() {
  return Math.floor( Math.random() * 15 * 1000 );
};

// Just hit the 'messages' counter and wait between
// 0, 10 secs before trying again
setTimeout(function hit() {
  var currentTime = Math.floor(Date.now() / 1000);

  redis.publish('hits:'+key, currentTime, function() {
    console.log("Recorded hit ["+key+"]", ++i, new Date(currentTime));
    setTimeout(hit, randomDelay());
  });
}, randomDelay());

