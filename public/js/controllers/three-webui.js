(function() {

  angular.module('amdusias')
  .controller('ThreeWebUIController', ['$scope', '$interval', '$http', '$log', function($scope, $interval, $http, $log) {

    $scope.selectedAvatar = null;
    $scope.avatars        = [
      {
        "name": "Kakula"
      },
      {
        "name": "Mozter"
      },
      {
        "name": "Spock"
      }
    ];

    // do something when the dropdown is changed
    $scope.changedValue = function (avatar) {
      console.log("AVATAR CHANGED: " + JSON.stringify(avatar));
    }

    $scope.dance = function () {
      console.log("Toggle Dance Clicked");
    }

  }]);

})();
