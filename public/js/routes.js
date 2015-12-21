(function() {

  angular.module('amdusias')
  .config(['$routeProvider', function ($routeProvider) {

    $routeProvider
        .when('/main', {
            //controller: 'HomeController', //XXX : refactor this
            templateUrl: '/views/main.html'
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
