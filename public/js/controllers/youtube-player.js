(function() {

  angular.module('amdusias')
  .controller('YoutubePlayerController', function($interval, $scope, $log, SocketFactory, AuthTokenFactory) {

    $scope.theVideo = 'he2a4xK8ctk';

    var videos = ["he2a4xK8ctk","aP3gzee1cps","ZjFOE8alUWE"];
    var index  = 0;

    var localVideoState = {
      guid : guid(),
      videoId : null,
      startSeconds : 0,
      videoPlaying : false
    }

    var videoSyncMsInterval = 1000;

    // disable the video controls
    // start the video automatically
    // start: 10
    $scope.playerVars = {
        controls: 0,
        autoplay: 1
    };

    // handle youtube player events
    $scope.$on('youtube.player.ended', function ($event, player) {

      localVideoState.videoPlaying = false;

      $scope.theVideo = videos[index++ % videos.length];
      player.playVideo();
      console.log("player time:" + player.getCurrentTime);

    });

    $scope.$on('youtube.player.error', function ($event, player) {
      localVideoState.videoPlaying = false; //XXX : maybe track player errors
    });

    $scope.$on('youtube.player.playing', function ($event, player) {
      localVideoState.videoPlaying = true;
    });

    $scope.$on('youtube.player.ready', function ($event, player) {
      $interval(function(){myVideoSyncCallback(player)}, videoSyncMsInterval);
    });

    // utilities
    function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
    }

    function myVideoSyncCallback() {
      localVideoState.startSeconds = player.getCurrentTime;
    }

    // sockets
    // XXX : will need to integrate this
    // Get the video state structure from the server to maintain client
    // consistency
    socket.on('ping', function(state) {
        conditionallyPlayVideo(state);
        socket.emit('pong', localVideoState);
    });

    // XXX update this to integrate the video loader code
    function conditionallyPlayVideo(remoteState) {

      if(!remoteState) {
        console.log("RemoteState is null.");
        return -1;
      }

      if(!localVideoState.videoPlaying &&
         localVideoState.videoId !== remoteState.videoId) {

        localVideoState.videoId = remoteState.videoId;
        localVideoState.startSeconds = remoteState.startSeconds;

        /* will need to call the angular directive stuff here
        player.loadVideoById({'videoId': localVideoState.videoId,
                              'startSeconds': localVideoState.startSeconds});
        */

        localVideoState.videoPlaying = true;

      }
    }
    
  });

})();
