
var http = require('http');
var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000))
console.log(__dirname);
//app.use(express.static(__dirname + '/public'))
app.use(express.static('public'));
app.use('/terrain', express.static('public/terrain_builder.html'));

/*
app.all('*', function(req, res, next) {
  next();
});
*/

var contentType = { "Content-Type": "text/html" };

app.get('/about', function(req, res) {
  res.writeHead(200, contentType);
  res.end("About page");
});

/*
app.get('*', function(req, res) {
  res.writeHead(404, contentType);
  res.end("404");
});
*/

var server = http.createServer(app);

var io = require('socket.io').listen(server);
require('./chat/chat-listeners.js')(io);
require('./chat/game-listeners')(io);

server.listen(app.get('port'));
console.log("Server running at http://localhost:" + app.get('port') + "/");

/*
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
*/
