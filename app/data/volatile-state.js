/*
 * This is the volatile server state module -- it is used to store
 * song synchronization, dj and game state.
 */
var exports = module.exports = {};

var User = require('../models/user');
var Playlist = require('../models/playlist');
var Song = require('../models/song');

// settings for interval based jobs
var pruneInactiveClientFrequency = (1 * 1000); // 1 sec
var updateInternalServerStateFrequency = (5 * 1000); // 5 sec

// NOTE: exports and state initializers at end of file //
/********************************** DJ *********************************/
var DJ = function(username, playlist) {
    if (!username || !playlist) {
        throw "username || playlist not passed to DJ class";
    }
    this.username = username;
    this.activePlaylist = playlist;
    this.isPlaying = false;
    this.songIndex = 0;
};

// this updates the date for the last song played
DJ.prototype.updateSongLastPlayed = function(songId) {};

// this sets the active playlist for a dj
DJ.prototype.setActivePlaylist = function(playlistId) {
    this.activePlaylist = playlistId;
};

// this plays the next song
DJ.prototype.playSong = function() {
    this.playNextSong();
};

// this gets the next song for a DJ
DJ.prototype.playNextSong = function() {
    var songIndex = this.songIndex;

    // return an error if playlist is not set
    if (!this.activePlaylist) {
        console.log("The playlist for " + this.username + "is null.");
        return;
    }

    // filter these by last played date
    Playlist.
    find({
        'username': this.username
    }).
    where('_id').equals(this.activePlaylist).
    populate('songs', 'videoname videoid thumbnail secvidlen position', null, {
        sort: {
            position: -1
        }
    }).
    exec(function(err, details) {

        console.log("~>" + this.username + " is playing the next video!");
        var songCount = details[0].songs.length;
        var index = songIndex % songCount;
        var videoid = details[0].songs[index].videoid;
        var vidLength = details[0].songs[index].secvidlen;
        console.log("Changing video to:" + videoid);
        _internalServerState.currentPlayingVideo = videoid;
        _internalServerState.currentVideoProgress = 0;
        _internalServerState.currentVideoLength = vidLength;
    });

    this.songIndex++;
};

// this stops the currently playing song
DJ.prototype.stopSong = function() {
    // do something to stop the song
};

DJ.prototype.getUsername = function() {
        return this.username;
};
    /****************************** DJ QUEUE *********************************/
    // this class represents a queue of djs
var DJQueue = function() {
    this.queue = [];
    this.djIndex = 0;
};

DJQueue.prototype.currentPlayingUser = function() {
        if (this.queue.length < 1)
            return -1;
        var index = this.djIndex % this.queue.length;
        var username = this.queue[index].getUsername();
        return username;
};

DJQueue.prototype.add = function(dj) {
    // check dj doesn't already exist
    var username = dj.getUsername();
    if (username && this.getIndex(username) < 0) {
        this.queue.push(dj);
    }
};

// get index of dj based on username
DJQueue.prototype.getIndex = function(username) {
    return this.queue.map(function(dj) {
        return dj.username;
    }).indexOf(username);
};

DJQueue.prototype.correctUser = function(username) {
    if (username === this.currentPlayingUser()) {
        return 1;
    }
    return 0;
};

// removes a dj from the queue based on username
DJQueue.prototype.remove = function(username) {
    // remove the dj from the queue
    var djIndex = this.getIndex(username);

    if (djIndex < 0) {
        return;
    }

    // remove the dj from the queue
    this.queue.splice(djIndex, 1);

    // if I am playing now, play the next dj
    if (username === this.currentPlayingUser())
        this.playNextDj();
};

// allows a dj to skip the current song
DJQueue.prototype.skip = function(username) {
    this.playNextDj();
};

// get next DJ
DJQueue.prototype.playNextDj = function() {
    if (this.queue.length === 0) {
        console.log("playNextDj: No DJs in queue.");
        return -1;
    }

    var index = ++this.djIndex % this.queue.length;
    var dj = this.queue[index];
    dj.playSong();
};

DJQueue.prototype.printDebug = function() {
    console.log("------------------------------------------");
    console.log("DJ Queue Debug Info");
    console.log("------------------------------------------");
    console.log("queue length........:\t" + this.queue.length);
    console.log("DJ index............:\t" + this.djIndex);
    console.log("------------------------------------------");
};


// a class to represent a connected client
var Client = function() {
    // this datatype is used in the client too, when changing this class
    // you _MUST_ update the version in public/js/factories/game-state.js
    // and make sure that the features/versions match.
    this.version = 1;
    this.username = null;
    this.guid = null;
    this.avModel = null;
    this.isDancing = false;
    this.videoId = null;
    this.videoProgress = 0;
    this.isVideoPlaying = false;
    this.isVideoError = false;
    this.lastActive = 0;
    this.stateTainted = false; // XXX may use these later for
    this.danceTainted = false; // taint analysis
    this.localPosition = {
        x: 0,
        y: 0
    };
    this.worldPosition = { // translated by FloorPositionMatrix
        x: 0,
        y: 0,
        z: 0
    };
};

Client.prototype.init = function(clientState) {

    if (!this.isClientStateValid(clientState)) {
        return -1;
    }
    console.log("XXXX Client INIT: " + JSON.stringify(clientState));
    // set the proper fields
    this.guid = clientState.guid.toString();
    this.avModel = clientState.avmodel;
    this.username = clientState.username; // from JWT
    this.videoId = clientState.videoId;
    this.videoProgress = clientState.videoProgress;
    this.isVideoPlaying = clientState.isVideoPlaying;
    this.isVideoError = clientState.isVideoError;
    this.updateLastSeen();

    return 1;
};

Client.prototype.updateState = function(clientState) {

    if (!this.isClientStateValid(clientState)) {
        return -1;
    }

    this.videoId = clientState.videoId;
    this.videoProgress = clientState.videoProgress;
    this.isVideoPlaying = clientState.isVideoPlaying;
    this.isVideoError = clientState.isVideoError;
    this.updateLastSeen();

    return 1;
};

Client.prototype.isClientStateValid = function(clientState) {

    // all of these fields must be set
    if (!clientState.hasOwnProperty('username')) {
        console.log("No username field in client state!");
        return false;
    }

    if (!clientState.hasOwnProperty('guid')) {
        console.log("No guid field in client state!");
        return false;
    }

    if (!clientState.hasOwnProperty('avmodel')) {
        console.log("No avmodel field in client state!");
        return false;
    }

    if (!clientState.hasOwnProperty('videoId')) {
        console.log("No videoId field in client state!");
        return false;
    }

    if (!clientState.hasOwnProperty('videoProgress')) {
        console.log("No videoProgress field in client state!");
        return false;
    }

    if (!clientState.hasOwnProperty('isVideoPlaying')) {
        console.log("No isVideoPlaying field in client state!");
        return false;
    }

    if (!clientState.hasOwnProperty('isVideoError')) {
        console.log("No isVideoError field in client state!");
        return false;
    }

    return true;
};

Client.prototype.printDebug = function() {
    console.log("------------------------------------------");
    console.log("Internal Client State Debug Info");
    console.log("------------------------------------------");
    console.log("guid................:\t" + this.guid);
    console.log("username............:\t" + this.username);
    console.log("videoId.............:\t" + this.videoId);
    console.log("videoProgress.......:\t" + this.videoProgress);
    console.log("isVideoPlaying......:\t" + this.isVideoPlaying);
    console.log("isVideoError........:\t" + this.isVideoError);
    console.log("lastActive..........:\t" + this.lastActive);
    console.log("isDancing...........:\t" + this.dancing);
    console.log("position............:\t" + this.position);
    console.log("------------------------------------------");
};

Client.prototype.setStateTainted = function() {
    this.stateTainted = true;
};

Client.prototype.setDanceTainted = function() {
    this.danceTainted = true;
};

Client.prototype.untaintState = function() {
    this.stateTainted = false;
};

Client.prototype.untaintDance = function() {
    this.danceTainted = false;
};

Client.prototype.isStateTainted = function() {
    return this.stateTainted;
};

Client.prototype.isDanceTainted = function() {
    return this.danceTainted;
};

Client.prototype.getGuid = function() {
    return this.guid;
};

Client.prototype.setModel = function(model) {
    this.avModel = model;
    this.setStateTainted();
};

Client.prototype.getModel = function() {
    return this.model;
};

Client.prototype.standOnTile = function(tile) {
    // tile is an array containing x, y coords
    this.worldPosition.x = tile[0];
    this.worldPosition.y = tile[1];
    this.worldPosition.z = 1;
};

Client.prototype.getTilePosition = function() {
    return this.worldPosition;
};

Client.prototype.toggleDance = function() {
    this.isDancing = !this.isDancing;
    this.setDanceTainted();
};

Client.prototype.getUsername = function() {
    return this.username;
};

// video state
Client.prototype.videoPlaying = function() {
    return this.isVideoPlaying;
};

Client.prototype.lastSeen = function() {
    return this.lastActive;
};

Client.prototype.updateLastSeen = function() {
    var d = new Date();
    this.lastActive = d.getTime();
};

Client.prototype.videoError = function() {
    return this.isVideoError;
};

Client.prototype.setVideoProgress = function(progress) {
    this.videoProgress = progress;
};

Client.prototype.videoProgress = function() {
    return this.videoProgress;
};

Client.prototype.setvideoId = function(videoid) {
    this.videoId = videoid;
};

Client.prototype.isPlayingThisVideo = function(videoid) {
    return this.videoId === videoid;
};

Client.prototype.hasPlayedPast = function(len) {
    return this.videoProgress > len;
};

Client.prototype.jsonDanceState = function() {
    var jsonState = {};
    jsonState.g = this.guid;
    jsonState.d = (this.isDancing ? "1" : "0");

    this.untaintDance();

    return jsonState;
};

Client.prototype.jsonModelState = function() {
    var jsonState = {};
    jsonState.g = this.guid;
    jsonState.m = this.avModel;
    jsonState.p = this.getTilePosition();

    this.untaintState();

    return jsonState;
};

Client.prototype.jsonLevelState = function() {
    var jsonState = {};

    jsonState.g = this.guid;
    jsonState.m = this.avModel;
    jsonState.p = this.getTilePosition();
    jsonState.d = (this.isDancing ? "1" : "0");

    return jsonState;
};

/*********************** internal server state  *************************/
/* volatile internal server state */
var InternalServerState = function() {
    this.minNextVideoInterval = 10000;
    this.thresholdLastPingMs = 10 * 1000;
    this.thresholdVideoForce = 0.6;
    this.clientsNotPlaying = 0;
    this.clientsPlaying = 0;
    this.clientsPlayedPast = 0;
    this.clientsWithErrors = 0;
    this.activeClients = 0;
    this.clientList = [];
    this.currentPlayingVideo = "";
    this.currentVideoProgress = 0;
    this.currentVideoLength = 0;
    this.lastTimeNextVidCalled = 0;
    this.tainted = false;
    this.writingGameState = false; // avoid sync of partial write
    this.floorWidth = 20;
    this.floorHeight = 20;
    this.floorMatrix = new FloorPositionMatrix(this.floorHeight, this.floorWidth);
};

// non video state (avatars, dancing etc)
// check if the player, identified by guid, already exists
// in the playerStates array
// XXX XXX XXX XXX XXX XXX XXX XXX XXX XXX XXX XXX XXX XXX XXX XXX
/* access the client array -v

InternalServerState.prototype.playerAlreadyExists = function ( guid )
{
  if ( this.playerStates.hasOwnProperty( guid ) )
    return true;

  return false;
}

InternalServerState.prototype.addAvatar = function ( avatar )
{
  this.playerStates[avatar.getGuid()] = avatar;
  this.isTainted();
}

InternalServerState.prototype.toggleDance  = function ( guid )
{
  if ( ! this.playerStates.hasOwnProperty( guid ) )
    return;

  this.playerStates[guid].toggleDance();
}

InternalServerState.prototype.changeModel  = function ( guid, newModel )
{
  if ( ! this.playerStates.hasOwnProperty( guid ) )
    return;

  this.playerStates[guid].setModel( newModel );

  this.isTainted();
}

InternalServerState.prototype.getGameDancingState = function ( )
{
  var taintedDancers = [];

  for (var guid in this.playerStates)
  {
    if ( this.playerStates[guid].isDanceTainted() )
    {
        taintedDancers.push( this.playerStates[guid].jsonDanceState() );
    }
  }

  return taintedDancers;
}

InternalServerState.prototype.getGameModelState = function ( )
{
  var taintedPlayerModels = [];

  for (var guid in this.playerStates)
  {
    if ( this.playerStates[guid].isStateTainted() )
    {
        taintedPlayerModels.push( this.playerStates[guid].jsonModelState() );
    }
  }

  return taintedPlayerModels;
}
*/

InternalServerState.prototype.getLevelState = function() {
    var allplayerData = [];

    for (var i = 0; i < this.clientList.length; i++) {
        allplayerData.push(this.clientList[i].jsonLevelState());
    }

    return allplayerData;
};

InternalServerState.prototype.debugPrint = function() {
    console.log("this.playerStates...........:" + JSON.stringify(this.playerStates));
};

// video state
InternalServerState.prototype.resetClientsPlayingCounters = function() {
    this.clientsNotPlaying = 0;
    this.clientsPlaying = 0;
    this.clientsPlayedPast = 0;
    this.clientsWithErrors = 0;
};

InternalServerState.prototype.resetVideoState = function() {
    this.currentPlayingVideo = "STOP";
    this.currentVideoProgress = 0;
    this.currentVideoLength = 0;
};

InternalServerState.prototype.getVideoState = function() {

    var videoState = {
        videoId: this.currentPlayingVideo,
        videoProgress: this.currentVideoProgress
    };
    return videoState;
};

InternalServerState.prototype.fetchClientByGuid = function(guid) {
    var index = this.clientList.map(function(client) {
        return client.getGuid();
    }).indexOf(guid.toString());

    // nothing was found, pass this down
    if (index < 0)
        return index;

    return this.clientList[index];
};

// if the client is valid, and ahead of our state, sync the server to it
InternalServerState.prototype.updateCurrentVideoProgressFrom = function(client) {
    var eligible = client.videoPlaying();
    var playingCurrent = client.isPlayingThisVideo(this.currentPlayingVideo);
    var hasValidVideoTime = client.videoProgress < this.currentVideoLength;

    if (eligible && playingCurrent && hasValidVideoTime) {
        if (client.videoProgress > this.currentVideoProgress) {
            this.currentVideoProgress = client.videoProgress;
        }
    }
};

InternalServerState.prototype.findAndUpdateClient = function(clientState) {
    // get this client guid from the state
    var client = this.fetchClientByGuid(clientState.guid);

    // if no client is found, assume it is new and add it
    if (client < 0) {
        var newClient = new Client();
        if (newClient.init(clientState) > 0) {
            var tile = this.floorMatrix.allocateTile();
            newClient.standOnTile(tile);
            this.clientList.push(newClient);
            this.activeClients = this.clientList.length;
            return 0;
        }
        return -1;
    }

    // the client already exists, lets update the state
    if (client.updateState(clientState) < 0)
        return -1;

    // update the internal video progress state from the client
    // this helps us to take measures and help prevent drift/descync
    this.updateCurrentVideoProgressFrom(client);

    // print some debug info for dev
    // client.printDebug();
};

// get a state json from a client and update the internal state based on it
InternalServerState.prototype.updateClientsVideoState = function(clientState, username) {
    if (!username) {
        console.log("updateClientsVideoState () No username supplied in request.");
        return;
    }

    if (!clientState) {
        console.log("updateClientsVideoState () No clientState supplied in request.");
        return;
    }

    // XXX Optimize this, avoid making a query if the clientstate already exists.
    // so that I can preserve the reference to inside of the mongoose callback
    var myThis = this;
    User.find({}).
    where('username').equals(username).
    select('_id avmodel').
    exec(function(err, results) {

        if (err) {
            console.log("updateClientsVideoState () Error Obtaining user guid!");
            return;
        }

        if (!results) {
            console.log("updateClientsVideoState () unable to get guid from user!");
            return;
        }

        var guid = results[0]._id;
        var avmodel = results[0].avmodel;

        clientState.guid = guid;
        clientState.avmodel = avmodel;
        clientState.username = username;

        myThis.findAndUpdateClient(clientState);
    });
};

// update the level state sent from the client
InternalServerState.prototype.updateClientsLevelState = function(clientState, username) {
    // currently, this does nothing -- but we might want to add the ability
    // for clients to walk around the level at a later date.
};

InternalServerState.prototype.getClientAtIndex = function(index) {
    return this.clientList[index];
};

InternalServerState.prototype.rmClientAtIndex = function(index) {
    this.clientList.splice(index, 1);
    this.activeClients = this.clientList.length;
};

InternalServerState.prototype.clientCount = function() {
    return this.clientList.length;
};

InternalServerState.prototype.enoughTimeSinceLastCheck = function() {
    var currentTime = new Date().getTime();
    var timeElapsed = currentTime - this.lastTimeNextVidCalled;
    if (timeElapsed > this.minNextVideoInterval) {
        console.log("timeelapser: " + timeElapsed + "currentTime:" + currentTime + "minNext: " + this.minNextVideoInterval);
        this.lastTimeNextVidCalled = new Date().getTime();
        return true;
    }
    return false;
};

InternalServerState.prototype.isItTimeForNewVideo = function() {
    if (this.activeClients > 0) {
        if (this.nobodyIsPlayingVideo())
            return true;
        if (this.thresholdClientsDone())
            return true;
    }
    return false;
};

InternalServerState.prototype.thresholdClientsDone = function() {
    return (this.clientsPlayedPast / this.activeClients > this.videoForceThreshold);
};

InternalServerState.prototype.nobodyIsPlayingVideo = function() {
    return this.activeClients === this.clientsNotPlaying;
};

InternalServerState.prototype.pruneInactiveClients = function() {
    for (var i = 0; i < this.clientList.length; i++) {
        if (this.clientIsDead(i)) {
            this.rmClientAtIndex(i);
        }
    }
};

InternalServerState.prototype.clientIsDead = function(index) {
    var date = new Date();
    var currentTime = date.getTime();
    var clientLastPinged = currentTime - this.getClientAtIndex(index).lastSeen();
    return (clientLastPinged > this.thresholdLastPingMs);
};

InternalServerState.prototype.updateClientMetrics = function() {
    this.resetClientsPlayingCounters();

    for (var i = 0; i < this.clientCount(); i++) {
        var client = this.getClientAtIndex(i);

        if (client.videoPlaying()) {
            this.clientsPlaying++;
        } else {
            this.clientsNotPlaying++;
        }

        if (client.videoError()) {
            this.clientsWithErrors++;
        }

        //Update latest video progress
        if (client.isPlayingThisVideo(this.currentPlayingVideo)) {
            if (client.hasPlayedPast(this.currentVideoLength)) {
                this.clientsPlayedPast++;
            }
        }
    }
};

InternalServerState.prototype.printState = function() {
    console.log("------------------------------------------");
    console.log("Internal State Debug Info");
    console.log("------------------------------------------");
    console.log("thresholdLastPingMs.:\t" + this.thresholdLastPingMs);
    console.log("thresholdVideoForce.:\t" + this.thresholdVideoForce);
    console.log("clientsNotPlaying...:\t" + this.clientsNotPlaying);
    console.log("clientsPlaying......:\t" + this.clientsPlaying);
    console.log("clientsPlayedPast...:\t" + this.clientsPlayedPast);
    console.log("clientsWithErrors...:\t" + this.clientsWithErrors);
    console.log("activeClients.......:\t" + this.activeClients);
    console.log("clientList(len).....:\t" + this.clientList.length);
    console.log("currentPlayingVideo.:\t" + this.currentPlayingVideo);
    console.log("currentVideoLength..:\t" + this.currentVideoLength);
    console.log("currentVideoProgress:\t" + this.currentVideoProgress);
    console.log("writingGameState....:\t" + this.writingGameState);
    console.log("------------------------------------------");
};

/****************************************************************************/
/* this is a matrix of possible floor positions for avatars. if a tile is
   populated it is set to 1. when the player is removed the tile is cleared
*/
var FloorPositionMatrix = function(height, width) {
    if (!height || !width || height !== width) {
        throw "Only square floors are supported!";
    }
    this.height = height;
    this.width = width;
    this.emptyTiles = [];
    this.init();
};

FloorPositionMatrix.prototype.init = function() {
    for (var h = 0; h < this.height; h++) {
        for (var w = 0; w < this.width; w++) {
            this.emptyTiles.push([h, w]);
        }
    }
};

FloorPositionMatrix.prototype.getRandomArbitrary = function(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
};

FloorPositionMatrix.prototype.allocateTile = function() {
    if (this.emptyTiles.length === 0) {
        throw "No tiles left for avatar!";
    }

    var index = this.getRandomArbitrary(0, this.emptyTiles.length);
    var tile = this.emptyTiles[index];

    this.emptyTiles.splice(index, 1);

    console.log("Floor matrix allocated tile: " + JSON.stringify(tile));

    return tile; // translate
};

// (h)eight and (w)idth comes from player x, y
FloorPositionMatrix.prototype.reclaimTile = function(h, w) {
    // h*height+w will give the index into the empty tiles
    // array when the matrix is square.
    var index = h * (this.height + w);
    this.emptyTiles.splice(index, 0, [h, w]);
};

// helper method to translate local to global coords
FloorPositionMatrix.prototype.translate = function() {
    // add me
};

FloorPositionMatrix.prototype.printTiles = function() {
    console.log("Free Tiles: " + JSON.stringify(this.emptyTiles));
};

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++/
/************************** Setup And External ***************************
 *************************************************************************/



// the volatile server state
var _internalServerState = new InternalServerState();

// a queue to store our djs
var _DJQueue = new DJQueue();


/************************** Interval Functions ***************************
 *************************************************************************/
// this syncs the server state every N milliseconds
var intvlServerState = setInterval(function() {
        updateInternalServerState();
    },
    updateInternalServerStateFrequency);

function updateInternalServerState() {
    _internalServerState.resetClientsPlayingCounters();
    _internalServerState.updateClientMetrics();
    _internalServerState.printState();

    // is it time to send the next video?
    if (_internalServerState.isItTimeForNewVideo()) {
        if (_internalServerState.enoughTimeSinceLastCheck()) {
            _DJQueue.playNextDj();
        }
    }
}

// this prunes the client list amd removes inactive clients
var intvlpruneClients = setInterval(function() {
        pruneInactiveClients();
    },
    pruneInactiveClientFrequency);

function pruneInactiveClients() {
    _internalServerState.pruneInactiveClients();
}

/*+++++++++++++++++++++++++++ External Methods ++++++++++++++++++++++++++++++
 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/

/************************** DJ CONTROL **************************************/
/****************** called from dj-queue.js *********************************/
exports.DJadd = function(username, playlist) {
    // XXX do nothing if this dj AND playlist already exist
    var dj = new DJ(username, playlist);
    _DJQueue.add(dj);
    _DJQueue.printDebug();
};

// called from dj-queue - removes a dj from a queue
exports.DJrm = function(username) {
    if (!_DJQueue.correctUser(username)) {
        return;
    }
    _internalServerState.resetVideoState();
    _DJQueue.remove(username);
    _DJQueue.printDebug();
};

// called from dj-queue - stops currently playing song
exports.DJskip = function(username) {
    if (!_DJQueue.correctUser(username)) {
        return;
    }
    _internalServerState.resetVideoState();
    _DJQueue.skip(username);
};

/************************ Game State Methods  ********************************/
/****************** called from gamestate-api.js ****************************/
exports.changeModel = function(username, newModelName) {
    User.find({}).
    where('username').equals(username).
    select('_id').
    exec(function(err, results) {

        if (err) {
            console.log("changeModel() Error Obtaining user guid!");
            return;
        }

        if (!results) {
            console.log("changeModel() unable to get guid from user!");
        }

        var userguid = results[0]._id;

        if (!_internalGameState.playerAlreadyExists(userguid)) {
            console.log("changeModel() This user is not joined to the dancefloor.");
            return;
        }

        _internalGameState.changeModel(userguid, newModelName);
        _internalGameState.debugPrint();
    });
};

// Rate limit this
exports.toggleDance = function(username) {
    User.find({}).
    where('username').equals(username).
    select('_id').
    exec(function(err, results) {

        if (err) {
            console.log("toggleDance() Error Obtaining user guid!");
            return;
        }

        if (!results) {
            console.log("toggleDance() unable to get guid from user!");
        }

        var userguid = results[0]._id;


        if (!_internalGameState.playerAlreadyExists(userguid)) {
            console.log("toggleDance() This user is not joined to the dancefloor.");
            return;
        }

        _internalGameState.toggleDance(userguid);
        _internalGameState.debugPrint();
    });
};

/************************ State Sync Methods  *******************************/
// called in sockets.js, used to sync clients with the latest video
exports.getVideoState = function() {
    return _internalServerState.getVideoState();
};

exports.getLevelState = function() {
    return _internalServerState.getLevelState();
};

// this adds clients if they are new
// removes if they don't respond for N seconds
exports.updateClientsVideoState = function(clientState, username) {
    return _internalServerState.updateClientsVideoState(clientState, username);
};

exports.updateClientsLevelState = function(clientState, username) {
    // does nothing
    return _internalServerState.updateClientsLevelState(clientState, username);
};

/************************************************************************
 ************************************************************************/
