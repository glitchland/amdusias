(function() {

  angular.module('amdusias')
  .controller('YoutubePlayerController', [ '$interval', '$log', '$rootScope', '$scope', 'AuthTokenFactory', 'SocketFactory',
  function ($interval, $log, $rootScope, $scope, AuthTokenFactory, SocketFactory) {

    var vidPlaceHolder = getYoutubeUrlForVidTime("-----------", 0);
    var jwt = null;
    var index  = 0;
    var getVideoCurrentTimeCBInterval = null;
    var getVideoCurrentTimeCBMsDelay  = 1000;

    $scope.socketConnected = false;

    $scope.dynamic = {
      vars: {
        controls: 0,
        autoplay: 1
      },
      url: vidPlaceHolder,
      change: function (videoId, timeOffset) {
        var videoUrl = getYoutubeUrlForVidTime(videoId, timeOffset);
        $log.info("Changing video to:" + videoUrl);
        $scope.dynamic.url = videoUrl;
        $scope.localVideoState.startSeconds = 0;
      }
    };

    $scope.localVideoState = {
      guid : guid(),
      videoId : null,
      startSeconds : 0,
      videoPlaying : false,
      videoError   : false
    };

    // initialize socket factory
    var tokenFinder = $interval(function() {
      $log.info("Youtube player getToken firing...");
      if(!jwt) {
        $log.info("Youtube player attempting to get token...");
        jwt = AuthTokenFactory.getToken();
      }else{
        $log.info("Youtube player got token... initializing socket.");
        $log.info("Youtube player jwt:" + jwt);
        $scope.stopTokenFinder();
        SocketFactory.init(jwt);
        SocketFactory.on('connect', function () {
           $log.info("Youtube player the socket is connected...");
           $scope.socketConnected = true;
           SocketFactory.on('video-sync-request', $scope.videoSyncResponse);
        });
      }
    }, 3000);

    // once we have a valid token, stop the token finder
    $scope.stopTokenFinder = function() {
      if (angular.isDefined(tokenFinder)) {
        $interval.cancel(tokenFinder);
        tokenFinder = undefined;
      }
    };

    // handle youtube player events
    $scope.$on('youtube.player.ended', function ($event, player) {
      $scope.localVideoState.videoPlaying = false;
    });

    $scope.$on('youtube.player.queued', function ($event, player) {
      $log.info("Youtube player is queued");
    });

    $scope.$on('youtube.player.error', function ($event, player) {
      $log.info("youtube.player.error");
      $scope.localVideoState.videoPlaying = false; //XXX : maybe track player errors
      $scope.localVideoState.videoError   = true;
    });

    $scope.$on('youtube.player.playing', function ($event, player) {
      $log.info("youtube.player.playing");
      $scope.localVideoState.videoPlaying = true;
      $scope.localVideoState.videoError   = false;
      player.playVideo();
    });

    // when the player is ready, start recording the current time
    $scope.$on('youtube.player.ready', function ($event, player) {
      $log.info("youtube.player.ready");

      $interval.cancel(getVideoCurrentTimeCBInterval);
      getVideoCurrentTimeCBInterval = $interval(function () {
        $scope.getVideoCurrentTimeCB(player);
      }, getVideoCurrentTimeCBMsDelay);

      $scope.localVideoState.videoError   = false;
    });

    // this gets the current video time and stores it locally
    $scope.getVideoCurrentTimeCB = function (player) {
      $scope.localVideoState.startSeconds = player.getCurrentTime();
      $log.info("myVideoSyncCallback.startSeconds : " + $scope.localVideoState.startSeconds);
    }

    // based on the response from the server, play the video
    $scope.videoSyncResponse = function (remoteState) {
      $log.info("Got video-sync-request, sending video-sync-response");
      $scope.conditionallyPlayVideo(remoteState);
      SocketFactory.emit("video-sync-response", $scope.localVideoState);
    };

    // play the video if it meets the conditions to play
    $scope.conditionallyPlayVideo = function (remoteState) {
      $log.info("Handling video-sync-request...");

      if(!remoteState) {
        $log.info("RemoteState is null.");
        return -1;
      }

      $log.info("localVideoState.videoId:"+$scope.localVideoState.videoId);
      $log.info("remoteState.videoId:"+remoteState.videoId);
      $log.info("remoteState.startSeconds:"+remoteState.startSeconds);

      if(!$scope.localVideoState.videoPlaying &&
          $scope.localVideoState.videoId !== remoteState.videoId) {

        $scope.localVideoState.videoId = remoteState.videoId;
        $scope.localVideoState.startSeconds = remoteState.startSeconds;

        $scope.dynamic.change($scope.localVideoState.videoId,
                              $scope.localVideoState.startSeconds);

        // we set the video playing local state here to prevent race
        $scope.localVideoState.videoPlaying = true;
      }
    };

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

    function getYoutubeUrlForVidTime(videoId, time) {
      return "https://www.youtube.com/watch?v="+videoId+"#t="+time+"s";
    }

  }]);

})();
