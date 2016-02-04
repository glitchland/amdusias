var exports = module.exports = {};

var internalState = {
  queue : {},
  counter : 0,
  activeClients: 0,
  videoPlayingClients: 0,
  videoNotPlayingClients: 0,
  videoErrorClients: 0,
  videoId:  null,
  startSeconds: 0
};

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

//Keep the current state of videos, maybe put this into a file so it is shared
var videoState = {
  videoId : null,
  startSeconds : 0
}

/* methods */
exports.addDj = function(dj, playlist) {
    state.queue[dj] = playlist;
};

exports.rmDj = function(dj) {
  if(state.queue.hasOwnProperty(dj)) {
    delete state.queue[dj];
  }
};

exports.getState = function () {
  return state;
};

exports.printState = function () {
  console.log(state);
};

exports.getVideoState = function () {
  return videoState;
};

exports.updateClientsState = function (clientVideoState) {

  var clientIndex = getClientIndex(clientVideoState);

  var d = new Date();
  clients[clientIndex] = clientVideoState;
  clients[clientIndex].lastActive = d.getTime();

  console.log("connectedClients[clientIndex].guid: " + clients[clientIndex].guid);
  console.log("connectedClients[clientIndex].videoId: " + clients[clientIndex].videoId);
  console.log("connectedClients[clientIndex].startSeconds: " + clients[clientIndex].startSeconds);
  console.log("connectedClients[clientIndex].videoPlaying: " + clients[clientIndex].videoPlaying);
  console.log("connectedClients[clientIndex].videoError: " + clients[clientIndex].videoError);
  console.log("connectedClients[clientIndex].lastActive:" + clients[clientIndex].lastActive);

};

/*Updates lastactive for guid, as searching*/
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

/*
 *https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_Objects
 */
function User(id, video, waiting, model, dance, pos, dj, lastPing) {
  this.id       = id;
  this.video    = video;
  this.waiting  = waiting;
  this.model    = model;
  this.dance    = dance;
  this.pos      = pos;
  this.dj       = dj;
  this.lastPing = lastPing;
}

/* this prunes the client list of inactive clients */
var pruneInactiveClientsInterval = setInterval(function(){pruneClients()},
                                               pruneClientInterval);
function pruneClients() {
   var threshold = 10 * 1000;
   var date = new Date();
   var currentTime = date.getTime();

   for(var i=0; i < clients.length; i++) {
     if ((currentTime - clients[i].lastActive) > threshold ) {
       clients.splice(i, 1);
     }
   }
   internalState.activeClients = clients.length;
}

/* this syncs the server state every N milliseconds*/
var syncServerStateInterval = setInterval(function(){syncServerState()},
                                          syncInternalStateInterval);
function syncServerState() {
  internalState.videoPlayingClients    = 0;
  internalState.videoNotPlayingClients = 0;

  // iterate over the clients
  for(var i=0; i < clients.length; i++) {

    if(clients[i].videoPlaying) {
      internalState.videoPlayingClients++;
    }else{
      internalState.videoNotPlayingClients++;
    }

    //XXX do something with this metric
    if(clients[i].videoError) {
      internalState.videoErrorClients++;
    }

    //Update latest video progress
    if(clients[i].videoId === internalState.videoId &&
       clients[i].startSeconds > internalState.startSeconds) {
       internalState.startSeconds = clients[i].startSeconds;
       videoState.startSeconds = internalState.startSeconds; //XXX Seems superfluous
    }

  }

  console.log("internalState.activeClients: " + internalState.activeClients);
  console.log("internalState.videoPlayingClients: " + internalState.videoPlayingClients);
  console.log("internalState.videoNotPlayingClients: " + internalState.videoNotPlayingClients);
  console.log("internalState.videoId: " + internalState.videoId);
  console.log("internalState.startSeconds:" + internalState.startSeconds);

  //Time to send next video??
  if(internalState.activeClients > 0 &&
     internalState.activeClients === internalState.videoNotPlayingClients) {

    var currentTime = new Date().getTime();

    if ( (currentTime - lastTimeNextVideoCalled) > 10000) {

      lastTimeNextVideoCalled = new Date().getTime();

      console.log("NEXT VIDEO!!!");
      //If interval has gone by, then send the next video.
      videoState.videoId = videoIds[videoIndex++ % videoIds.length];
      console.log(videoState.videoId);
      internalState.videoId = videoState.videoId; //XXX REFACTOR
      videoState.startSeconds = 0;
    }
  }
}

/*
function updateVideoRequestMessage() {

    console.log("updateVideoRequestMessage");
    videoMsg.videoId = videoIds[videoIndex % videoIds.length];
    serverState.videoId = videoMsg.videoId; //XXX REFACTOR
    videoMsg.startSeconds = serverState.startSeconds;

}
*/
