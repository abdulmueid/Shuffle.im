
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Shuffle'
  });
});

app.listen(8000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var io = require('socket.io');
var looking = ""; 
var usercount = 0; 
var socket = io.listen(app); 
socket.set('transports', [/*'websocket', 'flashsocket', */'htmlfile', 'xhr-polling', 'jsonp-polling']);
socket.set('log level', 1);
socket.set('browser client minification', true);
socket.set('heartbeat timeout', 5);
socket.set('heartbeat interval', 8);
function isConnected(client) {
    if (client.id == socket.sockets.socket(client.partner).partner) {
        return true;
    } else {
        return false;
    }
}
socket.sockets.on('connection', function(client) {
    
    client.on('iamconnected', function() {
        client.partner = "";
        usercount += 1;
        client.emit('usercount', usercount);
        client.broadcast.emit('usercount', usercount);
    });
    client.on('disconnect',function(){
        usercount -= 1;
        if(usercount < 0) {
            usercount = 0;
        }
        if(looking == client.id) {
            looking = "";
        }
        if(isConnected(client)) {
            socket.sockets.socket(client.partner).emit('message', {type:'announce', msg: 'Stranger has left the conversation.'});
            socket.sockets.socket(client.partner).emit('message', {type:'announce', msg: 'Click on the connect button to start chatting'});
            socket.sockets.socket(client.partner).partner = "";
            socket.sockets.socket(client.partner).emit("partner-left", "true");
        }
        client.broadcast.emit('usercount', usercount);
        delete client.namespace.sockets[client.id];
    });
    client.on('startchat',function(){
        if(client.partner != "") { return true;}
        if(looking == "") {
            looking = client.id;
            client.emit('message', {type:'announce', msg: 'Looking for a stranger...'});
        } else {
            client.partner = looking;
            looking = "";
            socket.sockets.socket(client.partner).partner = client.id;
            client.emit("partner-joined", "true");
            socket.sockets.socket(client.partner).emit("partner-joined", "true");
            client.emit('message', {type:'announce', msg: 'You are now chatting to a stranger!<br />Watch out for Wizards, Bears and Pokemons :)'});
            socket.sockets.socket(client.partner).emit('message', {type:'announce', msg: 'You are now chatting to a stranger!<br />Watch out for Wizards, Bears and Pokemons :)'});
        }
    });
    client.on('leavechat',function(){
        if (isConnected(client)) {
            socket.sockets.socket(client.partner).partner = "";
            socket.sockets.socket(client.partner).emit('message', {type:'announce', msg: 'Stranger has left the conversation.'});
            socket.sockets.socket(client.partner).emit('message', {type:'announce', msg: 'Click on the connect button to start chatting'});
            socket.sockets.socket(client.partner).emit("partner-left", "true");
        }
        client.partner = "";
    });
    client.on('message',function(msg){
        msg = msg.replace(/</g, "&lt;");
        msg = msg.replace(/>/g, "&gt;");
        if (isConnected(client)) {
            socket.sockets.socket(client.partner).emit('message', {type:'normal', msg: msg});
        }
    });
    client.on('typing',function(){
        if (isConnected(client)) {
            socket.sockets.socket(client.partner).emit("typing","true");
        }
    });
    client.on('stoptyping',function(){
        if (isConnected(client)) {
            socket.sockets.socket(client.partner).emit("stoptyping","true");
        }
    });
});
