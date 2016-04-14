(function() {

    //Scokets
    angular.module('amdusias')
        .controller('ChatController', ['$scope', '$log', '$rootScope', 'SocketFactory', function($scope, $log, $rootScope, SocketFactory) {

            var jwt;
            var vm = this;
            vm.messages = [];
            $scope.socketConnected = false;

            $scope.hello = function() {
                $scope.message = 'hello there';
            };

            // socket is connected
            $rootScope.$on('chat-sock-connect', function() {
                $log.info("ChatController socket connected..");
                $scope.socketConnected = true;
                SocketFactory.on("chat", $scope.recieveMessage);
            });

            // socket is disconnected
            $rootScope.$on('chat-sock-disconnect', function() {
                $log.info("ChatController socket disconnected..");
                $scope.socketConnected = false;
            });

            // chat functions
            $scope.sendMessage = function() {
                if ($scope.socketConnected) {
                    $log.info("Emitting:" + $scope.messageText);
                    SocketFactory.emit("chat", $scope.messageText);
                    $scope.messageText = "";
                } else {
                    $log.info("Socket not initilized.");
                }
            };

            $scope.recieveMessage = function(message) {
                // xxx: add username and date/time
                var now = new Date();
                var msg = {
                    date: now,
                    data: message.data,
                    user: message.user
                };
                console.log("Received:" + message);
                vm.messages.push(msg);
            };

        }]);

})();
