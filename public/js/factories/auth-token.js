(function() {
    angular.module('amdusias')
        .factory('AuthTokenFactory', ['$window', '$log', '$rootScope', '$timeout', function AuthTokenFactory($window, $log, $rootScope, $timeout) {

            var tokenKey = 'auth-token';
            var store = $window.localStorage;
            var bcAuthInterval = 1000;
            var token = null;
            var username = null;

            return {
                getToken: getToken,
                getUsername: getUsername,
                setToken: setToken,
                isLoggedIn: isLoggedIn,
                broadcastAuthSuccess: broadcastAuthSuccess
            };

            function broadcastAuthSuccess() {
                // broadcast that there is successful authentication
                // to cause the websocket to resolve
                $timeout(function() {
                    console.log("broadcastAuthSuccess: broadcasting");
                    $rootScope.$broadcast('authenticated');
                }, bcAuthInterval);

            }

            // make sure our current token, if any, is still valid
            function isLoggedIn() {
                token = getToken();
                if (token) {
                    currentTime = (new Date()).getTime() / 1000;
                    tokenTime = angular.fromJson(atob(token.split('.')[1])).exp;
                    $log.info("Token Time:" + tokenTime);
                    $log.info("Current Time:" + currentTime);
                    if (tokenTime > currentTime) {
                        $log.info("VALID TOKEN");
                        broadcastAuthSuccess();
                        return true;
                    }
                }
                $log.info("INVALID TOKEN");
                return false;
            }

            function getToken() {
                return store.getItem(tokenKey);
            }

            function getUsername() {
                return username;
            }

            function setToken(username, token) {
                if (token) {
                    broadcastAuthSuccess();
                    store.setItem(tokenKey, token);
                    username = username;
                } else {
                    store.removeItem(tokenKey);
                    username = null;
                }
            }

        }]);
})();
