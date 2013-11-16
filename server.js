
var express = require('express'),
    http = require('http'),

    app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

app.use(express.static('public'));

server.listen(process.env.PORT || 4320);

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});


