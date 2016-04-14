(function() {
    angular.module('amdusias')
        .controller('LoginController', ['$http', '$log', '$scope', '$rootScope', '$location', 'AuthTokenFactory',
            function($http, $log, $scope, $rootScope, $location, AuthTokenFactory) {

                // handle logins
                $scope.login = function() {
                    $scope.dataLoading = true;

                    var jsonBody = {
                        username: $scope.username,
                        password: $scope.password
                    };

                    $http.post('/login', jsonBody).success(function(response) {
                            $scope.dataLoading = false;
                            if (!response.token) {
                                handleError("Username or password is incorrect.");
                            } else {
                                AuthTokenFactory.setToken($scope.username, response.token);
                                $location.path('/main');
                            }
                        })
                        .error(function(response) {
                            handleError(response);
                        });

                };

                $scope.logout = function() {
                    auth.user = null;
                    AuthTokenFactory.setToken();
                };

                function handleError(response) {
                    $scope.error = response;
                    $scope.dataLoading = false;
                    return;
                }

            }
        ]);

})();
