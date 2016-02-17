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
        $scope.localVideoState.videoProgress = 0;
      }
    };

    $scope.localVideoState = {
      guid           : guid(),
      videoId        : null,
      videoProgress  : 0,
      isVideoPlaying : false,
      isVideoError   : false
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
           SocketFactory.on('videostate-sync-request', $scope.videoSyncResponse);
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
      $scope.localVideoState.isVideoPlaying = false;
    });

    $scope.$on('youtube.player.queued', function ($event, player) {
      $log.info("Youtube player is queued");
    });

    $scope.$on('youtube.player.error', function ($event, player) {
      $log.info("youtube.player.error");
      $scope.localVideoState.isVideoPlaying = false; //XXX : maybe track player errors
      $scope.localVideoState.isVideoError   = true;
    });

    $scope.$on('youtube.player.playing', function ($event, player) {
      $log.info("youtube.player.playing");
      $scope.localVideoState.isVideoPlaying = true;
      $scope.localVideoState.isVideoError   = false;
      player.playVideo();
    });

    // when the player is ready, start recording the current time
    $scope.$on('youtube.player.ready', function ($event, player) {
      $log.info("youtube.player.ready");

      $interval.cancel(getVideoCurrentTimeCBInterval);
      getVideoCurrentTimeCBInterval = $interval(function () {
        $scope.getVideoCurrentTimeCB(player);
      }, getVideoCurrentTimeCBMsDelay);

      $scope.localVideoState.isVideoError  = false;
    });

    // this gets the current video time and stores it locally
    $scope.getVideoCurrentTimeCB = function (player) {
      $scope.localVideoState.videoProgress = player.getCurrentTime();
      $log.info("myVideoSyncCallback.startSeconds : " + $scope.localVideoState.videoProgress);
    }

    // based on the response from the server, play the video
    $scope.videoSyncResponse = function (remoteState) {
      $log.info("Got video-sync-request, sending video-sync-response");
      $scope.conditionallyPlayVideo(remoteState);
      SocketFactory.emit("videostate-sync-response", $scope.localVideoState);
    };

    // play the video if it meets the conditions to play
    $scope.conditionallyPlayVideo = function (remoteState) {
      $log.info("Handling videostate-sync-request...");

      if(!remoteState) {
        $log.info("RemoteState is null.");
        return -1;
      }

      $log.info("localVideoState.videoId:"+$scope.localVideoState.videoId);
      $log.info("remoteState.videoid:"+remoteState.videoId);
      $log.info("remoteState.videoProgress:"+remoteState.videoProgress);

      if(!$scope.localVideoState.isVideoPlaying &&
          $scope.localVideoState.videoId !== remoteState.videoId) {

        $scope.localVideoState.videoId = remoteState.videoId;
        $scope.localVideoState.videoProgress = remoteState.videoProgress;

        $scope.dynamic.change($scope.localVideoState.videoId,
                              $scope.localVideoState.videoProgress);

        // we set the video playing local state here to prevent race
        $scope.localVideoState.isVideoPlaying = true;
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
