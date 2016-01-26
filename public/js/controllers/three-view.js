(function() {

angular.module('amdusias')
.controller('ThreeController', ['$scope', '$interval', '$http', '$log', function($scope, $interval, $http, $log) {

  $scope.assimpModelUrl = "models/jeep1.ms3d.json";
  $scope.theGameState = { "val" : 0 };

  //https://docs.angularjs.org/api/ng/service/$interval
  // initialize socket factory
  $interval( function() {
    var test = Math.random();
    $scope.theGameState = {"val": test };
    $log.info("Controller Gamestate: " + JSON.stringify($scope.theGameState));
   }, 10000);

  $scope.changeModel = function() {
    if ($scope.assimpModelUrl == "models/interior.3ds.json") {
      $scope.assimpModelUrl = "models/jeep1.ms3d.json";
    }
    else {
      $scope.assimpModelUrl = "models/interior.3ds.json";
    }
  };

}]);

})();
