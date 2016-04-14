(function() {

    angular.module('amdusias')
        .controller('ThreeWebUIController', ['$scope', '$interval', '$http', '$log', '$rootScope', 'SocketFactory', 'RenderCharacters',
            function($scope, $interval, $http, $log, $rootScope, SocketFactory, RenderCharacters) {

                var jwt = null;
                $scope.socketConnected = false;
                $scope.selectedAvatar = null;
                $scope.avatars = [{
                    "name": "Kakula"
                }, {
                    "name": "Mozter"
                }, {
                    "name": "Spock"
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

                $scope.handleLevelStateSync = function(remoteState) {
                    $log.info("ls-sync: " + JSON.stringify(remoteState));
                    SceneManager.updateSceneFromRemoteState(remoteState);
                };


                // handle websockets get-my-gamestate
                /*
                    $scope.toggleDance = function() {
                      if ($scope.isAvatarDancing)
                      {
                        $scope.isAvatarDancing = false;
                      }
                      else
                      {
                        $scope.isAvatarDancing = true;
                      }
                      $log.info("Toggle Dance: " + $scope.isAvatarDancing);
                    };

                    // check if gamestate has changed
                    $rootScope.$emit('game-state-changed', GlobalGameState.toJSON);
                */
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
