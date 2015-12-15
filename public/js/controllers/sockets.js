(function() {

//Scokets
angular.module('amdusias')
.controller('SocketsController', function($scope, $log, SocketFactory, AuthTokenFactory) {

  $scope.hello= function() {
      $scope.message = 'hello there';
  };

  var jwt;
  var initialized = false;
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
         initialized = true;
      });
    }
  }
  var getTokenInterval = setInterval(getToken, 3000);

  $scope.sendWithSocket = function(msg) {
    if(initialized) {
      $log.info("Emitting:" + msg);
      SocketFactory.emit("something", msg);
    } else {
      $log.info("Socket not initilized.");
    }
  };

 });

})();
