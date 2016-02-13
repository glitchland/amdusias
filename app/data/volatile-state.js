var exports = module.exports = {};

var Playlist = require('../models/playlist');
var Song     = require('../models/song');

/* settings for waiting ratio */
var pruneClientInterval = 1000 * 1;
var syncInternalStateInterval = 5000;
var maxRatioUntilNextVideo = 0.6;      //2 thirds
var videoIndex = 0;
var lastTimeNextVideoCalled = 0;

var clients = new Array();

/* temporary video IDs for development */
var videoIds = ["dsOooSvbvNA", "KlrwYZ6rVOk", "w_J27GxPNM0",
                "qgoJn5SUa_4", "FfXPcrqVO8Q", "RxdEy5WeO9A",
                "VV1PDjSCJY8"];

/* keep the current state of videos, maybe put this into
   a file so it is shared */
var videoState = {
  videoId : null,
  startSeconds : 0
}

exports.getState = function () {
  return state;
};

exports.printState = function () {
  console.log(state);
};

exports.getVideoState = function () {
  return videoState;
};

/********************************** DJ *********************************/

var Dj = function (username) {
  this.username       = username;
  this.userid         = null;
  this.activePlaylist = null;
  this.isPlaying      = false;
  this.songIndex      = 0;
};

// this updates the date for the last song played
Dj.prototype.updateSongLastPlayed = function(songId) {
};

// this sets the active playlist for a dj
Dj.prototype.setActivePlaylist = function (playlistId) {
  this.activePlaylist = playlistId;
}

// this plays the next song
Dj.prototype.playSong = function () {
    var song = this.playNextSong();
}

// this gets the next song for a DJ
Dj.prototype.playNextSong = function () {

  var songIndex = this.songIndex;

  // return an error if playlist is not set
  if (!this.activePlaylist) {
    console.log("The playllist for " +  this.username + "is null.");
    return;
  }

  // filter these by last played date
  Playlist.
    find({'username': this.username}).
    where('_id').equals(this.activePlaylist).
    populate('songs', 'videoname videoid thumbnail').
    exec(function(err, details) {

      console.log("~>" + this.username + "is playing the next video!");
      var songCount = Object.keys(details[0].songs).length;
      var videoid   = details[0].songs[songIndex % songCount].videoid;
      console.log("index:"+ songIndex + " songCount:" + songCount + " videoid:" + videoid);
      //If interval has gone by, then send the next video.
      videoState.videoId = videoid;
      console.log("Changing video to:" + videoState.videoId);
      internalState.videoId = videoState.videoId; //XXX REFACTOR
      videoState.startSeconds = 0;
    });

    this.songIndex++;
}

// this stops the currently playing song
Dj.prototype.stopSong = function () {
  // do something to stop the song
}

/****************************** DJ QUEUE *********************************/
// this class represents a queue of djs
var DjQueue = function () {
  this.queue        = [];
  this.djIndex     = 0;
};

// takes dj adds it to the queue
DjQueue.prototype.add = function (dj) {
  this.queue.push(dj);
}

// get index of dj based on userid
DjQueue.prototype.getIndex = function (userid) {
  return this.queue.map( function(dj) {
                      return dj.userid;
                    }).indexOf(userid);
}

// removes a dj from the queue based on userid
DjQueue.prototype.remove = function (userid) {
  // remove the dj from the queue
  var djIndex = this.getIndex(userid);

  // remove the dj from the queue
  if (djIndex > -1) {
    this.queue[djIndex].stopSong();
    this.queue.splice(djIndex, 1);
  }
}

// allows a dj to skip the current song
DjQueue.prototype.skip= function (userid) {
    var djIndex = this.getIndex(userid);
    if (djIndex > -1) {
      this.queue[djIndex].stopSong();
    }
}

// get next DJ
DjQueue.prototype.playNextDj = function () {
  var dj = this.queue[++this.djIndex % this.queue.length];
  dj.playSong();
}

/*********************** client synchronization  *************************/

// a class to represent a connected client
var Client = function () {
    this.guid              = null;
    this.videoId           = null;
    this.videoProgress     = 0; //startSeconds
    this.isVideoPlaying    = false;
    this.isVideoError      = false;
    this.lastActive        = 0;
}

Client.prototype.videoPlaying = function () {
  return this.isVideoPlaying;
}

Client.prototype.lastSeen = function () {
  return this.lastActive;
}

Client.prototype.setLastSeen = function (time) {
  this.lastActive = time;
}

Client.prototype.videoError = function () {
  return this.isVideoError;
}

Client.prototype.setVideoProgress = function (progress) {
  this.videoProgress = progress;
}

Client.prototype.setvideoId = function (videoid) {
  this.videoId = videoid;
}

Client.prototype.isPlayingThisVideo = function (videoid) {
  return this.videoId === videoid;
}

Client.prototype.hasPlayedPast = function (len) {
  return this.videoProgress > len;
}

exports.updateClientsState = function (clientVideoState) {
  var clientIndex = getClientIndex(clientVideoState);

  var d = new Date();
  clients[clientIndex] = clientVideoState;
  clients[clientIndex].lastActive = d.getTime();

  console.log("connectedClients["+clientIndex+"].guid: " + clients[clientIndex].guid);
  console.log("connectedClients["+clientIndex+"].videoId: " + clients[clientIndex].videoId);
  console.log("connectedClients["+clientIndex+"].startSeconds: " + clients[clientIndex].startSeconds);
  console.log("connectedClients["+clientIndex+"].videoPlaying: " + clients[clientIndex].videoPlaying);
  console.log("connectedClients["+clientIndex+"].videoError: " + clients[clientIndex].videoError);
  console.log("connectedClients["+clientIndex+"].lastActive:" + clients[clientIndex].lastActive);
};

// updates last-active for guid
function getClientIndex (clientVideoState) {

  for(var i=0; i < clients.length; i++) {

    console.log("doesClientExist client.guid: "         + clients[i].guid);
    console.log("doesClientExist client.videoId: "      + clients[i].videoId);
    console.log("doesClientExist client.startSeconds: " + clients[i].startSeconds);
    console.log("doesClientExist client.videoPlaying: " + clients[i].videoPlaying);
    console.log("doesClientExist client.lastActive: "   + clients[i].lastActive);

    if(clients[i].guid === clientVideoState.guid) {
      return i;
    }

  }
  clients.push(clientVideoState);
  return ++i;
}

/* volatile internal server state */
var _InternalServerState = function ()
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
  this.currentVideoLength    = 0;
  this.lastTimeNextVidCalled = 0;
};

_InternalState.prototype.resetClientsPlayingCounters = function ()
{
  this.clientsNotPlaying = 0;
  this.clientsPlaying    = 0;
  this.clientsPlayedPast = 0;
};

_InternalState.prototype.getClientAtIndex = function (i)
{
  return this.clientList[i];
};

_InternalState.prototype.rmClientAtIndex = function (i)
{
  this.clientList.splice(i, 1);
  this.activeClients = this.clientList.length;
};

_InternalState.prototype.clientCount = function ()
{
  return this.clientList.length;
};

_InternalState.prototype.enoughTimeSinceLastCheck = function ()
{
  var currentTime = new Date().getTime();
  var timeElapsed = currentTime - this.lastTimeNextVidCalled;
  if ( timeElapsed > this.minNextVideoInterval)
  {
    this.lastTimeNextVidCalled = new Date().getTime();
    return true;
  }
  return false;
};

_InternalState.prototype.isItTimeForNewVideo = function ()
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

_InternalState.prototype.thresholdClientsDone = function ()
{
  return (this.clientsPlayedPast/this.activeClients > this.videoForceThreshold);
}

_InternalState.prototype.nobodyIsPlayingVideo = function ()
{
  return this.activeClients === this.clientsNotPlaying;
}

_InternalState.prototype.pruneInactiveClients = function ()
{
  for ( var i=0; i < this.clientList.length; i++ )
  {
    if ( this.clientIsDead(i) )
    {
      this.rmClientAtIndex(i);
    }
  }
}

_InternalState.prototype.clientIsDead = function (index) {
  var date = new Date();
  var currentTime = date.getTime();
  var clientLastPinged = currentTime - this.getClientAtIndex(i).lastSeen();
  return ( clientLastPinged > this.thresholdLastPingMs);
}

_InternalState.prototype.updateClientMetrics = function ()
{

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
        // XXX remove these
        //internalState.startSeconds = clients[i].startSeconds;
        //videoState.startSeconds = internalState.startSeconds;
      }
    }
  }
};

_InternalState.prototype.printState = function ()
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
  console.log("------------------------------------------");
}

var _internalState = new _InternalState ();

/************************** Interval Functions ***************************/
/* this syncs the server state every N milliseconds*/
var intvlServerState = setInterval(function(){updateInternalServerState()},
                                       updateInternalServerStateFrequency);

function updateInternalServerState ()
{

  _internalState.resetClientsPlayingCounters();
  _internalState.updateClientMetrics();
  _internalState.printState();

  // is it time to send the next video?
  if ( _internalState.isItTimeForNewVideo() )
  {
    if ( _internalState.enoughTimeSinceLastCheck() )
      testDj.getNextSong();

  }
}

/* this prunes the client list of inactive clients */
var intvlpruneClients = setInterval(function(){pruneInactiveClients()},
                                    pruneInactiveClientInterval);
function pruneInactiveClients()
{
  _internalState.pruneInactiveClients();
}

/************************************************************************/

/* XXX Temporary location for some test code to create DJ object       **/
var testDj = new DjState("demo");
testDj.setActivePlaylist("56bad652dadf239a122d3b83")
