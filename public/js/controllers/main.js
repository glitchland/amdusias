(function() {

    angular.module('amdusias')
        .controller('MainController', ['$timeout', '$rootScope', '$location', '$http', '$log', 'AuthTokenFactory', function($timeout, $rootScope, $location, $http, $log, AuthTokenFactory) {

            // if the jwt token is expired or not present redirect to login
            if (!AuthTokenFactory.isLoggedIn()) {
                $location.path('/login');
            } else {}

        }]);
})();
