(function() {
  angular.module('amdusias')
  .factory('AuthTokenFactory', [ '$window', '$log', '$rootScope', '$timeout', function AuthTokenFactory ($window, $log, $rootScope, $timeout) {

      var tokenKey = 'auth-token';
      var store    = $window.localStorage;
      var token    = null;

      return {
        getToken: getToken,
        setToken: setToken,
        isLoggedIn: isLoggedIn,
        broadCastAuthSuccess: broadCastAuthSuccess
      };

      function broadCastAuthSuccess() {
        // broadcast that there is successful authentication
        // to cause the websocket to resolve
        $timeout( function() {
          console.log("broadcasting auth...");
          $rootScope.$broadcast('authenticated');
        }, 1000);
      }

      // make sure our current token, if any, is still valid
      function isLoggedIn () {
       token = getToken ();
        if (token) {
          currentTime = (new Date).getTime() / 1000;
          tokenTime = angular.fromJson(atob(token.split('.')[1])).exp;
          $log.info("Token Time:"+ tokenTime);
          $log.info("Current Time:"+ currentTime);
          if ( tokenTime > currentTime )
          {
            $log.info("VALID TOKEN");
            broadCastAuthSuccess();
            return true;
          }
        }
        $log.info("INVALID TOKEN");
        return false;
      }

      function getToken () {
        return store.getItem(tokenKey);
      }

      function setToken (token) {
        if (token) {
          broadCastAuthSuccess();
          store.setItem (tokenKey, token);
        } else {
          store.removeItem (tokenKey);
        }
      }

    }]);
})();
