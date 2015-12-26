(function() {

angular.module('amdusias')
.factory('SocketFactory', ['$rootScope', function ($rootScope) {

    var socket = null;
    var initialized = false;

    return {

        // initialize the socket
        init: function (token) {
          console.log("Init creating socket...");
          socket = io.connect('', {'query': 'token=' + token });
          initialized = true;
        },

        // a function to intercept socket 'on' events
        on: function (eventName, callback) {
              if(!initialized) {
                console.log("on: Socket is not initialized yet.");
                return;
              }
              console.log("on: " + eventName);
              function wrapper() {
                  var args = arguments;
                  console.log(args);
                  $rootScope.$apply(function () {
                      callback.apply(socket, args);
                  });
              }
              socket.on(eventName, wrapper);
              return function () {
                  socket.removeListener(eventName, wrapper);
              };
          },

        //A function to intercept socket 'emit' events
        emit: function (eventName, data, callback) {

                if(!initialized) {
                  console.log("emit: Socket is not initialized yet.");
                  return;
                }

                socket.emit(eventName, data, function () {

                  console.log("Emitting " + eventName);
                  console.log("Emitting " + data);

                  var args = arguments;
                  $rootScope.$apply(function () {
                    if(callback) {
                      console.log("In callback..");
                      callback.apply(socket, args);
                    }
                  });

                });

              }
    };

  }]);

})();
