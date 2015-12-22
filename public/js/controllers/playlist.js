(function() {

  angular.module('amdusias')
  .controller('PlaylistController', ['$scope', '$http', '$log', function($scope, $http, $log) {

    $scope.feedback = null;
    $scope.selectedPlaylist = null;
    $scope.playlists = [];
    $scope.playlistContent = null;

    // Toggle UI slide down
    $scope.checked = false; // This will be binded using the ps-open attribute
    
    $scope.toggle = function(){
        $scope.checked = !$scope.checked
    }

    $http.get('/api/playlist/')
    .success( function (result) {
          $log.info("Playlist results:" + JSON.stringify(result));
          $scope.playlists = result;
      });

    // get details for playlist
    $scope.changedValue = function(item){

        var playlistId = item._id;

        if (!playlistId) {
            $scope.feedback = 'Error, no playlist id found.';
            return;
        }

        $http.get('/api/playlist/' + playlistId, {})
          .success( function (data) {
            if (data.length === 0) {
              $scope.feedback = 'No results were found!';
            }
            $scope.playlistContent = null;
            $scope.playlistContent = data[0];

            //$scope.songList = JSON.stringify(data);
            $log.info("Playlist items updated:" + JSON.stringify(data));
        })
        .error( function (error) {
          //$scope.songList = 'Search error:' + JSON.stringify(error);
          $scope.feedback = 'Error retrieving playlist contents!';
          $log.info('Playlist retrieval error:' + JSON.stringify(error));
        });

    }

    // add song to playlist
    $scope.addToPlaylist = function (video) {

      if (!$scope.selectedPlaylist._id) {
        $scope.feedback = "You must select playlist.";
        return;
      } else {
        $scope.feedback = null;
      }

      if (!video.snippet.title || !video.id.videoId ||
          !video.snippet.thumbnails.default.url) {
        $scope.feedback = "Selected video is invalid and missing details.";
        return;
      } else {
        $scope.feedback = null;
      }

      var uriPath = "/api/playlist/" + $scope.selectedPlaylist._id + "/song";

      var jsonBody = {
        "name"  : video.snippet.title,
        "vid"   : video.id.videoId,
        "thumb" : video.snippet.thumbnails.default.url
      }

      $http.post(uriPath, jsonBody)
      .success( function (result) {
            $scope.feedback = jsonBody.name + " song added.";
            $scope.changedValue($scope.selectedPlaylist);
        });

    };

    // remove song from playlist
    $scope.removeFromPlaylist = function (video) {

      if (!$scope.selectedPlaylist._id) {
        $scope.feedback = "You must select playlist.";
        return;
      } else {
        $scope.feedback = null;
      }

      var index = $scope.playlistContent.songs.indexOf(video);
      $log.info("Index of removed item is: " + index );

      var uriPath = "/api/playlist/" + $scope.selectedPlaylist._id + "/song/" + index;

      $http.delete(uriPath)
      .success( function (result) {
            $scope.feedback = video.name + " song deleted.";
            $scope.playlistContent.songs.splice( index, 1 );
        });

    };

  }]);

})();
