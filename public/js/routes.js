(function() {

  angular.module('amdusias')
  .config(['$routeProvider', function ($routeProvider) {

    $routeProvider
        .when('/main', {
            templateUrl: '/views/main.html'
        })

        .when('/youtube', {
            templateUrl: '/views/youtube.html'
        })

        .when('/login', {
            controller: 'LoginController',
            templateUrl: '/views/login.html'
        })

        .when('/', {
          redirectTo: '/login'
        })

        .otherwise({ redirectTo: '/' });

  }]);

})();
