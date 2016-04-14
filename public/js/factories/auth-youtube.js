(function() {

    angular.module('amdusias')
        .factory('AuthYoutube', ['$http', '$log', function AuthYoutube($http, $log) {

            var apiToken = null;

            return {
                getApiToken: getApiToken
            };

            // fetch the youtube API token if we don't have one already
            function getApiToken() {

                if (!apiToken) {
                    console.log("Fetching Youtube API token...");
                    $http.get('/api/googlekey/', {})
                        .success(function(data) {
                            if (data.length === 0) {
                                $log.error("No key was found.");
                                apiToken = null;
                                return;
                            }
                            apiToken = null;
                            apiToken = data.googleApiKey;
                        })
                        .error(function(error) {
                            $log.error('Error retrieving google api key: ' + JSON.stringify(error));
                        });
                } else {
                    return apiToken;
                }

            }

        }]);

})();
