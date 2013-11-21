
var async = require('async'),
    _ = require('underscore'),
    fs = require('fs'),

    express = require('express'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server, {log: false}),

    HitsHandler = require('./hitsHandler'),
    // Init handler
    // Parameter: polling interval in ms
    handler = new HitsHandler(5000);
  
/** Website's location */
app.use(express.static(__dirname + '/../public'));


var readWidget = async.memoize(function(callback) {
  fs.readFile(__dirname + '/../widget/widget.js', {encoding: 'utf-8'}, callback);
});

/** Widget code! */
app.get("/widget.js", function(req, res) {
  readWidget(function(err, js) {
    res.set("Content-Type", "text/javascript");
    res.send(js.replace("%socket_address%", "/")
               .replace("%container_id%", req.query.container)
               .replace("%wanted_keys%", req.query.keys || ""));  
  }); 
});

/** Start listening on Redis channels */
handler.start();

/** Broadcast fresh stats to clients every sec */
io.sockets.on('connection', function(socket) {
  /* Client has possibility to notify
   * the server about specific keys it's
   * interested in */
  socket.on('stats', function(keys) {
    socket.keys = keys && keys.split(',');
  });

  var onStats = function(stats) {
    stats = !socket.keys ? stats : _.pick.apply(_, [stats].concat(socket.keys));
    socket.emit('stats', stats);
  };

  handler.on('stats', onStats);
  socket.on('disconnect', function() { handler.removeListener('stats', onStats); });
});

/** Listen for connections */
server.listen(process.env.PORT || 3000, function() {
  console.log("Server listening on port", process.env.PORT || 3000);
});

