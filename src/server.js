
var async = require('async'),
    _ = require('underscore'),

    express = require('express'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server, {log: false}),

    HitsHandler = require('./hitsHandler'),
    handler = new HitsHandler();
  
/** Website's location */
app.use(express.static(__dirname + '/../public'));

handler.fetchCounters(function() {
  /** On new connection, just send the full stats */
  io.sockets.on('connection', function (socket) {
    handler.getFullStats(function(err, stats) { socket.emit('stats', stats); });
  });

  /** On hit, broadcast the stats for that particular counter */
  handler.onHit(function(err, stats) { io.sockets.emit('stats', stats); });
}); 

/** Listen for connections */
server.listen(process.env.PORT || 4320);

