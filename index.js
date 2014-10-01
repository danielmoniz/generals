var finalhandler = require('finalhandler');
var http = require('http');
var express = require('express');
var app = express();
var serve_static = require('serve-static');

var server = http.createServer(app);


app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))
app.use(express.static('public/'));

var io = require('socket.io').listen(server);
require('./chat/chat-listeners.js')(io);
require('./chat/game-listeners')(io);

server.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});
