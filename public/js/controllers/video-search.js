(function() {

angular.module('amdusias')
.controller('VideoSearchController', ['AuthYoutube', '$scope', '$http', '$log', function(AuthYoutube, $scope, $http, $log) {

    var vm = this;
    //These are the results.
    vm.results = [];

    //This is the search query field value on the template.
    $scope.songName = '';
    var googleKey = AuthYoutube.getApiToken();;

    $scope.search = function () {

      // fix bug where googlekey was not present on first search
      if (!googleKey) {
        googleKey = AuthYoutube.getApiToken();
      }

      $scope.loading = true;
      $http.get('https://www.googleapis.com/youtube/v3/search',
        { params: {
            key: googleKey,     //unrestricted API key
            type: 'video',
            maxResults: '10',
            part: 'id,snippet',
            fields: 'items/snippet/title,items/snippet/thumbnails/default,items/id/videoId',
            q: $scope.songName}
        })
        .success( function (data) {
          if (data.items.length === 0) {
            $scope.searchStatus = 'No results were found!';
          }
          vm.results = [];
          vm.results = data.items;

          //$scope.songList = JSON.stringify(data);
          $log.info("Data items updated:" + JSON.stringify(data.items));
      })
      .error( function (error) {
        //$scope.songList = 'Search error:' + JSON.stringify(error);
        $scope.searchStatus = 'Error during search!';
        $log.info('Search error:' + JSON.stringify(error));
      });

    }

  }]);

})();
