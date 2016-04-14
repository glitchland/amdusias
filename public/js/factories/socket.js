(function() {

    angular.module('amdusias')
        .factory('SocketFactory', ['$log', '$rootScope', '$timeout', 'AuthTokenFactory', function($log, $rootScope, $timeout, AuthTokenFactory) {

            var socket = null;
            var initialized = false;

            // listen for the authenticated event emitted on the rootScope of
            // the Angular app. Once the event is fired, create the socket and resolve
            // the promise.

            // XXX XXX
            // Also create a socket for three-webui and youtube sync
            $rootScope.$on('authenticated', function() {
                $log.info("SocketFactory got authenticated..");
                $log.info("SocketFactory initializing socket");
                token = AuthTokenFactory.getToken();
                socket = io.connect('', {
                    'query': 'token=' + token
                });
                initialized = true;

                $timeout(function() {
                    console.log("SocketFactory broadcasting connected...");
                    // only controllers that are in scope will get this
                    // the youtube controller is not in scope because it is
                    // rendered in an iframe. we have to use a different solution
                    // there
                    $rootScope.$broadcast('chat-sock-connect');
                    $rootScope.$broadcast('threeui-sock-connect');
                }, 3000);
            });

            return {

                // this can be called to inialize the socket manually
                init: function(token) {
                    console.log("Init creating socket...");
                    socket = io.connect('', {
                        'query': 'token=' + token
                    });
                    initialized = true;
                },

                // answer if socket is connected
                isConnected: function() {
                    $log.info("Is socket initialized:" + initialized);
                    return initialized;
                },

                // a function to intercept socket 'on' events
                on: function(eventName, callback) {
                    if (!initialized) {
                        console.log("on: Socket is not initialized yet.");
                        return;
                    }
                    // console.log("on: " + eventName + "callback: " + callback);
                    function wrapper() {
                        var args = arguments;
                        console.log(args);
                        $rootScope.$apply(function() {
                            callback.apply(socket, args);
                        });
                    }
                    socket.on(eventName, wrapper);
                    return function() {
                        socket.removeListener(eventName, wrapper);
                    };
                },

                //A function to intercept socket 'emit' events
                emit: function(eventName, data, callback) {

                    if (!initialized) {
                        console.log("emit: Socket is not initialized yet.");
                        return;
                    }

                    socket.emit(eventName, data, function() {

                        //console.log("Emitting " + eventName);
                        //console.log("Emitting " + data);

                        var args = arguments;
                        $rootScope.$apply(function() {
                            if (callback) {
                                callback.apply(socket, args);
                            }
                        });

                    });

                }
            };

        }]);

})();
