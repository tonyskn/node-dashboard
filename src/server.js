
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

/** API endpoint to delete a stats key */
app.delete('/stats/:key', function(req, res) {
  handler.removeCounter(req.params.key, function(err) {
    res.send("Deteted!");
  });
});
 
/** Start listening on Redis channels */
handler.start();

/** Broadcast fresh stats to clients every sec */
setInterval(function() {
  handler.getFullStats(function(_, stats) {
    io.sockets.emit('stats', stats);
  });
}, 1000);

/** Listen for connections */
server.listen(process.env.PORT || 4320);

