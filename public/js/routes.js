(function() {

  angular.module('amdusias')
  .config(['$routeProvider', function ($routeProvider) {

    $routeProvider
        .when('/login', {
            controller: 'LoginController',
            templateUrl: '/views/login.html'
        })

        .when('/', {
            //controller: 'HomeController', //XXX : refactor this
            templateUrl: '/views/main.html'
        })
        
        .otherwise({ redirectTo: '/#/login' });

  }]);

})();
