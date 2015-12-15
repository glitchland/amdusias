(function() {
  angular.module('amdusias')
  .factory('AuthTokenFactory', function AuthTokenFactory($window) {

      var tokenKey = 'auth-token';
      var store = $window.localStorage;
      return {
        getToken: getToken,
        setToken: setToken
      };

      function getToken() {
        return store.getItem(tokenKey);
      }

      function setToken(token) {
        if (token) {
          store.setItem(tokenKey, token);
        } else {
          store.removeItem(tokenKey);
        }
      }

    });
})();
