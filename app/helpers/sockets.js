var socketioJwt = require('socketio-jwt');
var socketio    = require('socket.io');
var config      = require('../config/settings');
var serverState = require('../data/volatile-state.js');

module.exports.listen = function(app) {

  var pingClientInterval    = 5 * 1000;
  var syncGameStateInterval = 10 * 1000;
  var currentVideoId        = "";

  io = socketio.listen(app);

  // JWT authentication for websockets
  io.use(socketioJwt.authorize({
    secret: config.jwtSecret,
    handshake: true
  }));

  io.on('connection', function(socket)
  {
      console.log("Socket connected:");

      /* chat functionality */
      socket.on('chat', function (message) {
        var msg = {
          user : socket.decoded_token.username,
          data : message
        };
        console.log("Emitting:" + msg);
        io.emit('chat', msg);
      });

      // send a broadcast ping every N milliseconds
      var itvlGetClientState = setInterval(function(){pingClients()},
                                           pingClientInterval);
      function pingClients() {
        var serverVideoState = serverState.getVideoState();
        //console.log('Sending ping with video state:' + JSON.stringify(serverVideoState));
        io.emit('videostate-sync-request', serverVideoState);
      }

      // this is a one way fixed interval game state synchronization message
      var itvlSyncGameState = setInterval(function(){syncGameState()},
                                          syncGameStateInterval);
      function syncGameState()
      {
        var gameState = serverState.getGameState();
        //console.log('Sending gamestate:' + JSON.stringify(gameState));
        io.emit('gamestate-sync-message', gameState);
      }

      /* game synchronization */
      /* This handler collects video_pong messages from connected clients
       * it uses them to update the internal server state.
       */
      socket.on('videostate-sync-response', function (clientState)
      {
        //console.log("Got client video-sync, with state:" + JSON.stringify(clientState));
        // add the username to the clientState
        clientState['username'] = socket.decoded_token.username;
        serverState.updateClientsState (clientState);
      });

      /* XXX testing */
      socket.on('test', function() {
          //this socket is authenticated, we are good to handle more events from it.
          console.log('hello! ', socket.decoded_token.username);
      });

  });

  return io;
}
