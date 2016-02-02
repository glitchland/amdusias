(function() {

  angular.module('amdusias')
  .controller('YoutubePlayerController', [ '$interval', '$log', '$rootScope', '$scope', 'AuthTokenFactory', 'SocketFactory' , function ($interval, $log, $rootScope, $scope, AuthTokenFactory, SocketFactory) {

    $scope.theVideo = 'pmxYePDPV6M';
    $scope.socketConnected = false;
    //$scope.localVideoState =

    $log.info("Youtube Player controller running..");

    var jwt = null;
    var videos = ["pmxYePDPV6M","Pwrhzfsq8t4","c5X4-pCDy94"];
    var index  = 0;

    $scope.localVideoState = {
      guid : guid(),
      videoId : null,
      startSeconds : 0,
      videoPlaying : false
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
           SocketFactory.on('ping', $scope.pong);
        });
      }
    }, 3000);

    $scope.stopTokenFinder = function() {
      if (angular.isDefined(tokenFinder)) {
        $interval.cancel(tokenFinder);
        tokenFinder = undefined;
      }
    };

    /*
    $log.info("Youtube player controller");

    $log.info("Youtube player controller requesting socket");
    socket.then(function(socket) {
        $log.info("Got chat socket:" + JSON.stringify(socket));
        socket.emit('test');
        $scope.initialized = true;
        socket.on("chat", $scope.recieveMessage);
    });
*/
    /*
    socket.then(function(socket) {
        $log.info("Got video sync socket:" + JSON.stringify(socket));
      //  $scope.initialized = true;
        socket.on("ping", $scope.conditionallyPlayVideo);
    });
*/


    // disable the video controls
    // start the video automatically
    // start: 10
    $scope.playerVars = {
        controls: 0,
        autoplay: 1
    };

    // handle youtube player events
    $scope.$on('youtube.player.ended', function ($event, player) {
      $scope.localVideoState.videoPlaying = false;

      $scope.theVideo = videos[index++ % videos.length];
      player.playVideo();
      console.log("player time:" + player.getCurrentTime);
    });

    $scope.$on('youtube.player.error', function ($event, player) {
      $scope.localVideoState.videoPlaying = false; //XXX : maybe track player errors
    });

    $scope.$on('youtube.player.playing', function ($event, player) {
      $scope.localVideoState.videoPlaying = true;
    });

    $scope.$on('youtube.player.ready', function ($event, player) {
      //$interval(function(){myVideoSyncCallback(player)}, videoSyncMsInterval);
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
      $scope.localVideoState.startSeconds = player.getCurrentTime;
    }

    // sockets
    // XXX : will need to integrate this
    // Get the video state structure from the server to maintain client
    // consistency
    //socket.then(function(socket) {
    //  socket.on('ping', function(state) {
    //      $log.info("Got ping...");
    //      conditionallyPlayVideo(state);
    //      socket.emit('pong', localVideoState);
    //  });
    //});



    //socket.then( function(socket) {
    //  $log.info("Got ping...");
    //  $scope.$on('socket:ping', function (ev, data) {
    //    $log.info("Handling ping...");
    //    conditionallyPlayVideo(data);
        //socket.emit('pong', localVideoState);
        //$scope.theData = data;
    //  });
    //});

    // XXX update this to integrate the video loader code
    $scope.pong = function(state) {
      $log.info("Got ping...Sending pong..");
      //  $scope.conditionallyPlayVideo(state);
      SocketFactory.emit("pong", "ZZZZZ");//$scope.localVideoState);
    };

    $scope.conditionallyPlayVideo = function (remoteState) {
      $log.info("Handling ping...");

      if(!remoteState) {
        $log.info("RemoteState is null.");
        return -1;
      }
      SocketFactory.emit("pong", $scope.localVideoState);

      if(!$scope.localVideoState.videoPlaying &&
         $scope.localVideoState.videoId !== remoteState.videoId) {

        $scope.localVideoState.videoId = remoteState.videoId;
        $scope.localVideoState.startSeconds = remoteState.startSeconds;

        /* will need to call the angular directive stuff here
        player.loadVideoById({'videoId': localVideoState.videoId,
                              'startSeconds': localVideoState.startSeconds});
        */
        $scope.localVideoState.videoPlaying = true;

      }
    };

  }]);

})();
