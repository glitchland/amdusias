var socketioJwt = require('socketio-jwt');
var socketio    = require('socket.io');
var config      = require('../config/settings');

module.exports.listen = function(app) {

  io = socketio.listen(app);

  // JWT authentication for websockets
  io.use(socketioJwt.authorize({
    secret: config.jwtSecret,
    handshake: true
  }));

  io.on('connection', function(socket) {
      console.log("Socket connected...");

      socket.on('chat', function (message) {
        var msg = {
          user : socket.decoded_token.username,
          data : message
        };
        console.log("Emitting:" + msg);
        socket.emit('chat', msg);
      });

      socket.on('test', function() {
          //this socket is authenticated, we are good to handle more events from it.
          console.log('hello! ', socket.decoded_token.username);
      });
  });

  return io;

}
