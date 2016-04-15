(function() {

    angular.module('amdusias')
        .controller('ThreeWebUIController', ['$scope', '$interval', '$http', '$log', '$rootScope', 'SocketFactory', 'SceneManager',
            function($scope, $interval, $http, $log, $rootScope, SocketFactory, SceneManager) {

                var jwt = null;
                $scope.socketConnected = false;
                $scope.selectedAvatar = null;
                $scope.avatars = [{
                    "name": "kakula"
                }, {
                    "name": "mozter"
                }, {
                    "name": "spock"
                }];

                // socket is connected
                $rootScope.$on('threeui-sock-connect', function() {
                    $log.info("threeui websocket socket is connected...");
                    $scope.socketConnected = true;
                    //SocketFactory.on('gs-dance-sync', $scope.handleDanceStateSync );
                    //SocketFactory.on('gs-model-sync', $scope.handleModelStateSync );
                    SocketFactory.on('ls-sync-ping', $scope.handleLevelStateSync);
                });

                // socket is disconnected
                $rootScope.$on('threeui-sock-disconnect', function() {
                    $log.info("threeui websocket socket is disconnected..");
                    $scope.socketConnected = false;
                });

                // when we get a ping from the server, update the scene
                $scope.handleLevelStateSync = function(remoteState) {
                    SceneManager.updateSceneFromRemoteState(remoteState);
                };

                // do something when the dropdown is changed
                $scope.changedValue = function(avatar) {
                    console.log("AVATAR CHANGED: " + JSON.stringify(avatar));
                    $rootScope.$emit('three-view-change-avatar', avatar.name);
                };

                $scope.toggleDance = function() {
                    $rootScope.$emit('three-view-dance', "");
                };

            }
        ]);

})();
