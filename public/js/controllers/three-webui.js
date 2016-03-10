(function() {

  angular.module('amdusias')
  .controller('ThreeWebUIController', ['$scope', '$interval', '$http', '$log', '$rootScope', function($scope, $interval, $http, $log, $rootScope) {

    $scope.selectedAvatar  = null;
    $scope.avatars         = [
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
*/
    // do something when the dropdown is changed
    $scope.changedValue = function (avatar) {
      console.log("AVATAR CHANGED: " + JSON.stringify(avatar));
      $rootScope.$emit('three-view-change-avatar', avatar.name);
    }

    $scope.toggleDance = function () {
      $rootScope.$emit('three-view-dance', "");
    }

  }]);

})();
