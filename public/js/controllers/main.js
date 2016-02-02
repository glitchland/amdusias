(function() {

    angular.module('amdusias')
    .controller('MainController', [ '$timeout', '$rootScope', '$location', 'AuthTokenFactory', function( $timeout, $rootScope, $location, AuthTokenFactory) {

      // if the jwt token is expired or not present redirect to login
      if( !AuthTokenFactory.isLoggedIn() ) {
          $location.path('/login');
      } else {
      }

    }]);

})();
