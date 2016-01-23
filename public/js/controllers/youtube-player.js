(function() {

  angular.module('amdusias')
  .controller('YoutubePlayerController', function($scope, $log, SocketFactory, AuthTokenFactory) {
//video-id="theBestVideo"
    $scope.theVideo = 'he2a4xK8ctk';

    var videos = ["he2a4xK8ctk","aP3gzee1cps","ZjFOE8alUWE"];
    var index  = 0;
    $scope.playerVars = {
        controls: 0,
        autoplay: 1,
        start: 10
    };

    $scope.$on('youtube.player.ended', function ($event, player) {
      $scope.theVideo = videos[index++ % videos.length];
      player.playVideo();
      console.log("player time:" + player.getCurrentTime);
    });

    $scope.$on('youtube.player.ready', function ($event, player) {
    //  $scope.theVideo = videos[index++ % videos.length];
    //  player.playVideo();
    });
  /*
    var player;
    var socket = io();
    var getVideoIntervalId = null;
    var videoSyncIntervalID = null;
    var currentVideoId = null;

    //Make the state global
    var localVideoState = {
      guid : guid(),
      videoId : null,
      startSeconds : 0,
      videoPlaying : false
    }

    //https://developers.google.com/youtube/player_parameters?hl=en
    window.onYouTubePlayerAPIReady = function() {

        player = new YT.Player('player', {
          autoplay: '1',
          controls: '0',
          playsinline: '1',
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
          }
        });

        videoSyncIntervalID = window.setInterval(myVideoSyncCallback, 1000);
    }

    function onPlayerReady() {

    }

    function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
    }

    // when video ends
    function onPlayerStateChange(event) {
      switch (event.data) {
        case YT.PlayerState.UNSTARTED:
          console.log('unstarted');
          break;
        case YT.PlayerState.ENDED:
          console.log('ended');
          localVideoState.videoPlaying = false;
          break;
        case YT.PlayerState.PLAYING:
          localVideoState.videoPlaying = true;
          console.log('playing');
          break;
        case YT.PlayerState.PAUSED:
          console.log('paused');
          break;
        case YT.PlayerState.BUFFERING:
          console.log('buffering');
          break;
        case YT.PlayerState.CUED:
          console.log('video cued');
          break;
      }
    }

    function onPlayerPlaybackQualityChange(playbackQuality) {
     console.log('playback quality changed to ' + playbackQuality.data);
    }

    function onPlayerPlaybackRateChange(playbackRate) {
     console.log('playback rate changed to ' + playbackRate.data);
    }

    function onPlayerError(e) {
     console.log('An error occurred: ' + e.data);
     localVideoState.videoPlaying = false;
    }

    function onPlayerApiChange() {
     console.log('The player API changed');
    }

    function myVideoSyncCallback() {
      localVideoState.startSeconds = player.getCurrentTime();
    }

    //Sockets
    socket.on('ping', function(state) {
        conditionallyPlayVideo(state);
        socket.emit('pong', localVideoState);
    });

    function conditionallyPlayVideo(remoteState) {

      if(!remoteState) {
        console.log("RemoteState is null.");
        return -1;
      }

      if(!localVideoState.videoPlaying &&
         localVideoState.videoId !== remoteState.videoId) {

        localVideoState.videoId = remoteState.videoId;
        localVideoState.startSeconds = remoteState.startSeconds;

        player.loadVideoById({'videoId': localVideoState.videoId,
                              'startSeconds': localVideoState.startSeconds});

        localVideoState.videoPlaying = true;

      }
    }
*/
  });

})();
