(function() {

//Scokets
angular.module('amdusias')
.controller('ChatController', function($scope, $log, SocketFactory, AuthTokenFactory) {

  var jwt;
  var vm = this;
  vm.messages    = [];
  $scope.initialized = false;

  $scope.hello= function() {
      $scope.message = 'hello there';
  };

  // initialize socket factory
  var getToken = function() {
    $log.info("getToken firing...");
    if(!jwt) {
      $log.info("Attempting to get token...");
      jwt = AuthTokenFactory.getToken();
    }else{
      $log.info("Got token... Initializing socket.");
      $log.info("jwt:" + jwt);
      clearInterval(getTokenInterval);
      SocketFactory.init(jwt);
      SocketFactory.on('connect', function () {
         $log.info("The socket is connected...");
         SocketFactory.emit('test');
         $scope.initialized = true;
         SocketFactory.on("chat", $scope.recieveMessage);
      });
    }
  }
  var getTokenInterval = setInterval(getToken, 3000);

  // chat functions
  $scope.sendMessage = function() {
    if($scope.initialized) {
      $log.info("Emitting:" + $scope.messageText);
      SocketFactory.emit("chat", $scope.messageText);
      $scope.messageText = "";
    } else {
      $log.info("Socket not initilized.");
    }
  }

 $scope.recieveMessage = function (message) {
    // xxx: add username and date/time
    var now = new Date();
    var msg = { date : now,
                data : message.data,
                user : message.user
              };
    console.log("Received:" + message);
    vm.messages.push(msg);
 };

 });

})();
