/*
 * This is the volatile server state module -- it is used to store
 * song synchronization, dj and game state.
 */
var exports = module.exports = {};

var Playlist = require('../models/playlist');
var Song     = require('../models/song');

// settings for interval based jobs
var pruneInactiveClientFrequency       = (1 * 1000); // 1 sec
var updateInternalServerStateFrequency = (5 * 1000); // 5 sec

// NOTE: exports and state initializers at end of file //
/********************************** DJ *********************************/
var DJ = function (username, playlist)
{
  if (!username || !playlist)
  {
    throw "username || playlist not passed to DJ class";
  }
  this.username       = username;
  this.userid         = null; // not used yet
  this.activePlaylist = playlist;
  this.isPlaying      = false;
  this.songIndex      = 0;
};

// this updates the date for the last song played
DJ.prototype.updateSongLastPlayed = function(songId)
{
};

// this sets the active playlist for a dj
DJ.prototype.setActivePlaylist = function (playlistId)
{
  this.activePlaylist = playlistId;
}

// this plays the next song
DJ.prototype.playSong = function ()
{
    var song = this.playNextSong();
}

// this gets the next song for a DJ
DJ.prototype.playNextSong = function ()
{

  var songIndex = this.songIndex;

  // return an error if playlist is not set
  if (!this.activePlaylist)
  {
    console.log("The playllist for " +  this.username + "is null.");
    return;
  }

  // filter these by last played date
  Playlist.
    find({'username': this.username}).
    where('_id').equals(this.activePlaylist).
    populate('songs', 'videoname videoid thumbnail').
    exec(function(err, details)
    {

      console.log("~>" + this.username + " is playing the next video!");
      var songCount = details[0].songs.length;
      var index = songIndex % songCount;
      var videoid   = details[0].songs[index].videoid;

      console.log("Changing video to:" + videoid);
      _internalServerState.currentPlayingVideo = videoid;
      _internalServerState.currentVideoProgress = 0;
    });

    this.songIndex++;
}

// this stops the currently playing song
DJ.prototype.stopSong = function ()
{
  // do something to stop the song
}

/****************************** DJ QUEUE *********************************/
// this class represents a queue of djs
var DJQueue = function ()
{
  this.queue        = [];
  this.djIndex      = 0;
};

// takes dj adds it to the queue
DJQueue.prototype.add = function (dj)
{
  this.queue.push(dj);
}

// get index of dj based on username
DJQueue.prototype.getIndex = function (username)
{
  return this.queue.map( function(dj) {
                      return dj.username;
                    }).indexOf(username);
}

// removes a dj from the queue based on username
DJQueue.prototype.remove = function (username)
{
  // remove the dj from the queue
  var djIndex = this.getIndex(username);

  // remove the dj from the queue
  if (djIndex > -1)
  {
    this.queue[djIndex].stopSong();
    this.queue.splice(djIndex, 1);
  }
}

// allows a dj to skip the current song
DJQueue.prototype.skip= function (username)
 {
    var djIndex = this.getIndex(username);
    if (djIndex > -1)
    {
      this.queue[djIndex].stopSong();
    }
}

// get next DJ
DJQueue.prototype.playNextDj = function ()
{
  if (this.queue.length === 0)
  {
    console.log("playNextDj: No DJs in queue.");
    return;
  }

  var index = ++this.djIndex % this.queue.length;
  var dj = this.queue[index];
  dj.playSong();
}

DJQueue.prototype.printDebug = function ()
{
    console.log("------------------------------------------");
    console.log("DJ Queue Debug Info");
    console.log("------------------------------------------");
    console.log("queue length........:\t" + this.queue.length);
    console.log("DJ index............:\t" + this.djIndex);
    console.log("------------------------------------------");
}

/*********************** client synchronization  *************************/
var Position = function (x, y, z)
{
    this.x = 0;
    this.y = 0;
    this.z = 0;
};
Position.prototype.x = function ()
{
  return this.x;
}
Position.prototype.y = function ()
{
  return this.y;
}
Position.prototype.z = function ()
{
  return this.y;
}
Position.prototype.get = function ()
{
  return [this.x, this.y, this.z];
}
Position.prototype.set = function (x, y, z)
{
  this.x = x;
  this.y = y;
  this.z = z;
}
Position.prototype.setx = function (x)
{
  this.x = x;
}
Position.prototype.sety = function (y)
{
  this.y = y;
}
Position.prototype.setz = function (z)
{
  this.z = z;
}

// a class to represent a connected client
var Client = function ()
{
    this.username          = null;
    this.guid              = null;
    this.videoId           = null;
    this.videoProgress     = 0;
    this.isVideoPlaying    = false;
    this.isVideoError      = false;
    this.lastActive        = 0;
    this.dancing           = false;
    this.model             = null;
    this.pos               = new Position (0,0,0);
}

Client.prototype.init = function (clientState)
{

  if ( !this.isClientStateValid(clientState) )
  {
    return -1;
  }

  // set the proper fields
  this.guid           = clientState.guid;
  this.username       = clientState.username; // from JWT
  this.videoId        = clientState.videoId;
  this.videoProgress  = clientState.videoProgress;
  this.isVideoPlaying = clientState.isVideoPlaying;
  this.isVideoError   = clientState.isVideoError;
  this.updateLastSeen();

  return 1;
}

Client.prototype.printDebug = function ()
{
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
}

Client.prototype.getGuid = function ()
{
    return this.guid;
}

Client.prototype.setModel = function (id)
{
    this.model = id;
}

Client.prototype.getModel = function ()
{
    this.model;
}

Client.prototype.isDancing = function ()
{
    return this.dancing;
}

Client.prototype.setDancing = function (dancing)
{
    this.dancing = dancing;
}

Client.prototype.setPosition = function (pos)
{
    this.position = new Position(pos.x, pos.y, pos.z);
}

Client.prototype.getPosition = function ()
{
    return this.position;
}

Client.prototype.getUsername = function ()
{
    return this.username;
}

Client.prototype.updateState = function (clientState) {

  if ( !this.isClientStateValid(clientState) )
  {
    return -1;
  }

  this.videoId        = clientState.videoId;
  this.videoProgress  = clientState.videoProgress;
  this.isVideoPlaying = clientState.isVideoPlaying;
  this.isVideoError   = clientState.isVideoError;
  this.updateLastSeen();

  return 1;
}

Client.prototype.isClientStateValid = function (clientState)
{

  // all of these fields must be set
  if (!clientState.hasOwnProperty('username'))
  {
    console.log("No username field in client state!");
    return false;
  }

  if (!clientState.hasOwnProperty('guid'))
  {
    console.log("No guid field in client state!");
    return false;
  }

  if (!clientState.hasOwnProperty('videoId'))
  {
    console.log("No videoId field in client state!");
    return false;
  }

  if (!clientState.hasOwnProperty('videoProgress'))
  {
    console.log("No videoProgress field in client state!");
    return false;
  }

  if (!clientState.hasOwnProperty('isVideoPlaying'))
  {
    console.log("No isVideoPlaying field in client state!");
    return false;
  }

  if (!clientState.hasOwnProperty('isVideoError'))
  {
    console.log("No isVideoError field in client state!");
    return false;
  }

  return true;
}

Client.prototype.videoPlaying = function ()
{
  return this.isVideoPlaying;
}

Client.prototype.lastSeen = function ()
{
  return this.lastActive;
}

Client.prototype.updateLastSeen = function ()
{
  var d = new Date();
  this.lastActive = d.getTime();
}

Client.prototype.videoError = function ()
{
  return this.isVideoError;
}

Client.prototype.setVideoProgress = function (progress)
{
  this.videoProgress = progress;
}

Client.prototype.videoProgress = function ()
{
  return this.videoProgress;
}

Client.prototype.setvideoId = function (videoid)
{
  this.videoId = videoid;
}

Client.prototype.isPlayingThisVideo = function (videoid)
{
  return this.videoId === videoid;
}

Client.prototype.hasPlayedPast = function (len)
{
  return this.videoProgress > len;
}

/*********************** internal server state  *************************/
/* volatile internal server state */
var InternalServerState = function ()
{
  this.minNextVideoInterval  = 10000;
  this.thresholdLastPingMs   = 10 * 1000;
  this.thresholdVideoForce   = 0.6;
  this.clientsNotPlaying     = 0;
  this.clientsPlaying        = 0;
  this.clientsPlayedPast     = 0;
  this.clientsWithErrors     = 0;
  this.activeClients         = 0;
  this.clientList            = new Array();
  this.currentPlayingVideo   = "";
  this.currentVideoProgress  = 0;
  this.currentVideoLength    = 0;
  this.lastTimeNextVidCalled = 0;
  this.gameState             = {};
  this.writingGameState      = false; // avoid sync of partial write
};

// non video state (avatars, dancing etc)
InternalServerState.prototype.updateGameState = function ()
{
    var gameState = { playerState: [] };
    var i;
    for (i = 0; i < this.clientList.length; i++)
    {
      var state = {};
      state['username'] = this.clientList[i].getUsername();
      state['model']    = this.clientList[i].getModel();
      state['position'] = this.clientList[i].getPosition();
      state['dancing']  = this.clientList[i].isDancing();
      gameState.playerState.push(state);
    }

    // mock lock avoid reads of partial writes
    this.writingGameState = true;
    this.gameState = state;
    this.writingGameState = false;
}

InternalServerState.prototype.getGameState = function ()
{
    if (this.writingGameState)
      return -1;

    return this.gameState;
}

InternalServerState.prototype.resetClientsPlayingCounters = function ()
{
  this.clientsNotPlaying = 0;
  this.clientsPlaying    = 0;
  this.clientsPlayedPast = 0;
  this.clientsWithErrors = 0;
};

InternalServerState.prototype.getVideoState = function ()
{
  var videoState = {
    videoId : this.currentPlayingVideo,
    startSeconds : 0
  }
  return videoState;
}

InternalServerState.prototype.fetchClientByGuid = function (guid)
{
    var index = this.clientList.map( function(client) {
                        return client.getGuid();
                      }).indexOf(guid);

    // nothing was found, pass this down
    if (index < 0)
      return index;

    return this.clientList[index];
}

// if the client is valid, and ahead of our state, sync the server to it
InternalServerState.prototype.updateCurrentVideoProgressFrom = function (client)
{
    var eligible = client.videoPlaying;
    var playingCurrent = client.isPlayingThisVideo (this.currentPlayingVideo);
    var hasValidVideoTime = client.videoProgress < this.currentVideoLength;
    if (eligible && playingCurrent && hasValidVideoTime)
    {
      if (client.videoProgress > this.currentVideoProgress) {
        this.currentVideoProgress = client.videoProgress;
      }
    }
}

// get a state json from a client and update the internal state based on it
InternalServerState.prototype.updateClientsState = function (clientState)
{
  var client = this.fetchClientByGuid (clientState.guid);

  // if no client is found, assume it is new
  if (client < 0 )
  {
      var newClient = new Client ();
      if ( newClient.init(clientState) > 0 )
      {
         this.clientList.push(newClient);
         this.activeClients = this.clientList.length;
         return 0;
      }
      return -1;
  }

  // the client already exists, lets update the state
  if ( client.updateState(clientState) < 0 )
    return -1;

  // update the internal video progress state from the client
  this.updateCurrentVideoProgressFrom (client);

  // print some debug info for dev
  // client.printDebug();
};

InternalServerState.prototype.getClientAtIndex = function (index)
{
  return this.clientList[index];
};

InternalServerState.prototype.rmClientAtIndex = function (index)
{
  this.clientList.splice(index, 1);
  this.activeClients = this.clientList.length;
};

InternalServerState.prototype.clientCount = function ()
{
  return this.clientList.length;
};

InternalServerState.prototype.enoughTimeSinceLastCheck = function ()
{
  var currentTime = new Date().getTime();
  var timeElapsed = currentTime - this.lastTimeNextVidCalled;
  if ( timeElapsed > this.minNextVideoInterval)
  {
    console.log("timeelapser: " + timeElapsed + "currentTime:" + currentTime + "minNext: " + this.minNextVideoInterval);
    this.lastTimeNextVidCalled = new Date().getTime();
    return true;
  }
  return false;
};

InternalServerState.prototype.isItTimeForNewVideo = function ()
{
  if ( this.activeClients > 0 )
  {
    if ( this.nobodyIsPlayingVideo() )
      return true;
    if ( this.thresholdClientsDone() )
      return true;
  }
  return false;
};

InternalServerState.prototype.thresholdClientsDone = function ()
{
  return (this.clientsPlayedPast/this.activeClients > this.videoForceThreshold);
}

InternalServerState.prototype.nobodyIsPlayingVideo = function ()
{
  return this.activeClients === this.clientsNotPlaying;
}

InternalServerState.prototype.pruneInactiveClients = function ()
{
  for ( var i=0; i < this.clientList.length; i++ )
  {
    if ( this.clientIsDead(i) )
    {
      this.rmClientAtIndex(i);
    }
  }
}

InternalServerState.prototype.clientIsDead = function (index) {
  var date = new Date();
  var currentTime = date.getTime();
  var clientLastPinged = currentTime - this.getClientAtIndex(index).lastSeen();
  return ( clientLastPinged > this.thresholdLastPingMs);
}

InternalServerState.prototype.updateClientMetrics = function ()
{
  this.resetClientsPlayingCounters();

  for ( var i = 0; i < this.clientCount(); i++ )
  {
    var client = this.getClientAtIndex(i);

    if ( client.videoPlaying() )
    {
      this.clientsPlaying++;
    }
    else
    {
      this.clientsNotPlaying++;
    }

    if ( client.videoError() )
    {
      this.clientsWithErrors++;
    }

    //Update latest video progress
    if ( client.isPlayingThisVideo (this.currentPlayingVideo) )
    {
      if ( client.hasPlayedPast (this.currentVideoLength) )
      {
        this.clientsPlayedPast++;
      }
    }
  }
};

InternalServerState.prototype.printState = function ()
{
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
  console.log("writingGameState....:\t" + this.writingGameState);
  console.log("------------------------------------------");
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++/
/************************** Setup And External ***************************
 *************************************************************************/
//var testDj = new DjState("demo");
//testDj.setActivePlaylist("56bad652dadf239a122d3b83")

// the volatile server state
var _internalServerState = new InternalServerState ();

// a queue to store our djs
var _DJQueue = new DJQueue ();

/************************** Interval Functions ***************************
 *************************************************************************/
// this syncs the server state every N milliseconds
var intvlServerState = setInterval(function(){updateInternalServerState()},
                                       updateInternalServerStateFrequency);

function updateInternalServerState ()
{

  _internalServerState.resetClientsPlayingCounters();
  _internalServerState.updateClientMetrics();
  _internalServerState.printState();

  // is it time to send the next video?
  if ( _internalServerState.isItTimeForNewVideo() )
  {
    if ( _internalServerState.enoughTimeSinceLastCheck() )
    {
      _DJQueue.playNextDj();
    }
  }
}

// this prunes the client list amd removes inactive clients
var intvlpruneClients = setInterval(function(){pruneInactiveClients()},
                                    pruneInactiveClientFrequency);
function pruneInactiveClients()
{
  _internalServerState.pruneInactiveClients();
}

/************************** External Methods ****************************
 ************************************************************************/
// called from dj-queue - creates a dj and adds it to the queue
exports.addDJ = function (username, playlist)
{
  var dj = new DJ (username, playlist);
  _DJQueue.add (dj);
  _DJQueue.printDebug();
};

// called from dj-queue - removes a dj from a queue
exports.rmDJ = function (username)
{
  _DJQueue.remove (username);
  _DJQueue.printDebug();
}

// called from dj-queue - stops currently playing song
exports.djSkipSong = function (username)
{
  _DJQueue.skip (username);
}

// called in sockets.js, used to sync clients with the latest video
exports.getVideoState = function ()
 {
   return _internalServerState.getVideoState();
};

exports.updateClientsState = function (clientState)
 {
   return _internalServerState.updateClientsState (clientState);
};

// get the most up to date gamestate
exports.getGameState = function () {
  var gameState = {};
/*  do XXX This seems to have a bug that deadlocks the server
  {
    gameState = _internalServerState.getGameState();
  } while (gameState != -1);
  return gameState;*/
}

/************************************************************************
 ************************************************************************/
