(function() {
  //XXX: https://github.com/cornflourblue/angular-authentication-example/blob/master/scripts/app.js

  angular.module('amdusias')
  .controller('LoginController',
      ['$http', '$log', '$scope', '$rootScope', '$location', 'AuthTokenFactory',
      function ($http, $log, $scope, $rootScope, $location, AuthTokenFactory) {

        $scope.login = function () {
          $scope.dataLoading = true;

          var jsonBody = {
            username: $scope.username,
            password: $scope.password
          };

          $http.post('/login', jsonBody).success ( function(response) {
            $scope.dataLoading = false;
            console.log("Response:" + JSON.stringify(response));
            if(!response.token) {
               handleError("Username or password is incorrect.");
            } else {
              AuthTokenFactory.setToken(response.token);
              $location.path('/main');
            }
          })
          .error( function(response) {
            handleError(response);
          });

        };

       $scope.logout = function () {
         auth.user = null;
         AuthTokenFactory.setToken();
       }

       // UTIL FUNCTIONS
       function handleError(response) {
         $log.info("handleError RESPONSE" + JSON.stringify(response));
         $scope.error       = response;
         $scope.dataLoading = false;
         return;
       }

   }]);

})();
