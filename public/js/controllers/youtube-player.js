(function() {

  angular.module('amdusias')
  .controller('YoutubePlayerController', [ '$interval', '$log', '$rootScope', '$scope', 'AuthTokenFactory', 'SocketFactory',
  function ($interval, $log, $rootScope, $scope, AuthTokenFactory, SocketFactory) {

    var vidPlaceHolder = getYoutubeUrlForVidTime("61lkqSFJPbs", 0);
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
      }
    };

    var jwt = null;
    //var videos = ["pmxYePDPV6M","Pwrhzfsq8t4","c5X4-pCDy94"];
    var index  = 0;

    $scope.localVideoState = {
      guid : guid(),
      videoId : null,
      startSeconds : 0,
      videoPlaying : false,
      videoError   : false
    };

    var videoSyncMsInterval = 1000;

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
      //$scope.theVideo = videos[index++ % videos.length];
      //player.playVideo();
      //console.log("player time:" + player.getCurrentTime);
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
    });

    // XXX might be a bug where a new player is created each time
    // so start seconds is not updated
    $scope.$on('youtube.player.ready', function ($event, player) {
      $log.info("youtube.player.ready");
      $interval(function(){$scope.myVideoSyncCallback(player)}, videoSyncMsInterval);
      $scope.localVideoState.videoError   = false;
    });

    $scope.myVideoSyncCallback = function (player) {
      $scope.localVideoState.startSeconds = player.getCurrentTime();
    }

    // based on the response from the server, play the video
    $scope.videoSyncResponse = function (remoteState) {
      $log.info("Got video-sync-request, sending video-sync-response");
      $scope.conditionallyPlayVideo(remoteState);
      SocketFactory.emit("video-sync-response", $scope.localVideoState);
    };

    $scope.conditionallyPlayVideo = function (remoteState) {
      $log.info("Handling video-sync-request...");

      if(!remoteState) {
        $log.info("RemoteState is null.");
        return -1;
      }
      //SocketFactory.emit("pong", $scope.localVideoState);

      if(!$scope.localVideoState.videoPlaying &&
         $scope.localVideoState.videoId !== remoteState.videoId) {
        $log.info("localVideoState.videoId:"+$scope.localVideoState.videoId);
        $log.info("remoteState.videoId:"+remoteState.videoId);

        $scope.localVideoState.videoId = remoteState.videoId;
        $scope.localVideoState.startSeconds = remoteState.startSeconds;

        /* will need to call the angular directive stuff here
        player.loadVideoById({'videoId': localVideoState.videoId,
                              'startSeconds': localVideoState.startSeconds});
        */
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
