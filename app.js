// general requires
var express = require('express');
var http    = require('http');
var user    = require('./app/helpers/user');

// create the app
var app = express();

var expressJwt  = require('express-jwt');
var jwt         = require('jsonwebtoken');
var socketioJwt = require('socketio-jwt');
var bodyParser  = require('body-parser');

var morgan      = require('morgan');
var mongoose    = require('mongoose');
var config      = require('./app/config/settings');

// connect to our mongoDB database
mongoose.connect(config.dbUrl);

// parse json data coming from client
app.use(bodyParser.json());

// set up the public directory
app.use(express.static(__dirname + '/public'));

// set up console logging
app.use(morgan('dev'));

// setup jwt
app.use(expressJwt({ secret: config.jwtSecret }).unless({path: ['/login']}));

// root route
var root = require('./app/routes/root');
app.use('/', user.authenticate, root);

// API routes
var playlists = require('./app/routes/playlist-api');
app.use('/api/playlist', user.checkAuthenticated, playlists);

var googleKey = require('./app/routes/google-key');
app.use('/api/googlekey', user.checkAuthenticated, googleKey);

// start the server
var httpServer = http.Server(app);
httpServer.listen(3000, function (){
    console.log("server listening on port", config.listenPort);
});

// websockets
//XXX Move this into its own file
io = require('socket.io').listen(httpServer);

//JWT authentication for websockets.
io.use(socketioJwt.authorize({
  secret: config.jwtSecret,
  handshake: true
}));

io.on('connection', function(socket) {
    console.log("Socket connected...");

    socket.on('something', function () {
      console.log("MESSAGE")
    });

    socket.on('test', function() {
        //this socket is authenticated, we are good to handle more events from it.
        console.log('hello! ', socket.decoded_token.username);
    });

});
