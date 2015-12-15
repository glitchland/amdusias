(function() {

  angular.module('amdusias')
  .factory('UserFactory', function LoginFactory($http, AuthTokenFactory, $q) {

      return {
        getUser: getUser,
        login: login,
        logout: logout
      };

      //XXX: This is a test function, it should be removed before release.
      function getUser() {
        var token = AuthTokenFactory.getToken();
        if (token) {
          return $http.get('/me');
        } else {
          return $q.reject({ data: 'Client has no authentication token.' });
        }
      }

      function login(username, password) {
        var loginInfo = {
          username: username,
          password: password
        };
        return $http.post('/login', loginInfo).then( function(response) {
          AuthTokenFactory.setToken(response.data.token);
          return response;
        });
      }

      function logout() {
        AuthTokenFactory.setToken();
      }
    });

})();
