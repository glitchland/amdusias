(function() {

angular.module('amdusias')
.factory('AuthInterceptor', function AuthInterceptor(AuthTokenFactory) {

    return {
      request: addAuthToken
    };

    function addAuthToken(config) {

      //If this is a request to the google apis service, don't add our
      //JWT auth headers, or google thinks we are trying OAuth.
      if (config.url.search(/googleapis/) > 0) {
          return config;
      }

      var token = AuthTokenFactory.getToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = 'Bearer ' + token;
      }
      return config;
    }

  });

})();
