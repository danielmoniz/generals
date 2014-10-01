//var finalhandler = require('finalhandler');
var http = require('http');
var express = require('express');
var app = express();
var serve_static = require('serve-static');


app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))
app.use(express.static('public/'));

var io = require('socket.io')(app);
require('./chat/chat-listeners.js')(io);
require('./chat/game-listeners')(io);

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});
