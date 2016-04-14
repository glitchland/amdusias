var socketioJwt = require('socketio-jwt');
var socketio = require('socket.io');
var config = require('../config/settings');
var _internalServerState = require('../data/volatile-state.js');

module.exports.listen = function(app) {

    var pingClientInterval = 5 * 1000;
    var syncLevelStateInterval = 10 * 1000;
    var syncVideoStateInterval = 15 * 1000;
    var currentVideoId = "";

    io = socketio.listen(app);

    // JWT authentication for websockets
    io.use(socketioJwt.authorize({
        secret: config.jwtSecret,
        handshake: true
    }));

    io.on('connection', function(socket) {
        console.log("Socket connected:");

        /* chat functionality */
        socket.on('chat', function(message) {
            var msg = {
                user: socket.decoded_token.username,
                data: message
            };
            console.log("Emitting:" + msg);
            io.emit('chat', msg);
        });

        // send a broadcast ping every N milliseconds
        var itvlGetClientVideoState = setInterval(function() {
                videoPingClients();
            },
            syncVideoStateInterval);

        var itvlGetClientLevelState = setInterval(function() {
                levelPingClients();
            },
            syncLevelStateInterval);

        function videoPingClients() {
            var serverVideoState = _internalServerState.getVideoState();
            io.emit('vs-sync-ping', serverVideoState);
        }

        function levelPingClients() {
            var serverLevelState = _internalServerState.getLevelState();
            io.emit('ls-sync-ping', serverLevelState);
        }

        /*----------------------------------------------------------------------*/
        // this is a response from clients to the vs-sync-ping
        // it is used by the server to add and remove clients
        socket.on('vs-sync-pong', function(clientState) {
            _internalServerState.updateClientsVideoState(clientState, socket.decoded_token.username);
        });

        // this is a response from clients to the ls-sync-pong
        socket.on('ls-sync-pong', function(clientState) {
            // this does nothing for now, the level sync is one way
            // but I've wired it up in case we ever want to navigate
            // around the level
            //_internalServerState.updateClientsLevelState ( clientState,  socket.decoded_token.username );
        });

        /* XXX testing */
        socket.on('test', function() {
            //this socket is authenticated, we are good to handle more events from it.
            console.log('hello! ', socket.decoded_token.username);
        });

    });

    return io;
};
