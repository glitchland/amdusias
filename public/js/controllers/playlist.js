(function() {

  angular.module('amdusias')
  .controller('PlaylistController', ['$scope', '$http', '$log', function($scope, $http, $log) {

    $scope.feedbackMessage = null;
    $scope.feedbackClass  = null;
    $scope.selectedPlaylist = null;
    $scope.playlists = [];
    $scope.playlistContent = null;
    $scope.newPlaylistName = '';

    var getPlaylists = function() {
      $http.get('/api/playlist/')
      .success( function (result) {
            $log.info("Playlist results:" + JSON.stringify(result));
            $scope.playlists = result;
        });
    }

    getPlaylists();

    // Toggle UI slide down
    $scope.checked = false; // This will be binded using the ps-open attribute

    $scope.toggle = function(){
        $scope.checked = !$scope.checked
    }

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

    // delete a playlist
    $scope.deletePlaylist = function() {

      if (!$scope.selectedPlaylist._id) {
        $scope.feedbackClass   = "btn btn-danger";
        $scope.feedbackMessage = 'select a playlist';
        return;
      } else {
        $scope.feedbackMessage = "";
      }

      var msg = "Are you sure you want to delete " + $scope.selectedPlaylist.name;
      if (confirm(msg) == true) {
      } else {
        return;
      }

      var uriPath = "/api/playlist/" + $scope.selectedPlaylist._id;

      $http.delete(uriPath)
      .success( function () {
          $scope.feedbackClass   = "btn btn-success";
          $scope.feedbackMessage = "Success";
          getPlaylists();
      })
      .error( function (error) {
          $scope.feedbackClass   = "btn btn-danger";
          $scope.feedbackMessage = 'Error';
          $log.info('Playlist delete error:' + JSON.stringify(error));
      });

    };

    // create a playlist
    $scope.createPlaylist = function () {

      if (!$scope.newPlaylistName) {
        $scope.feedbackClass   = "input-group-addon text-danger";
        $scope.feedbackMessage = 'Blank name forbidden';
        return;
      }

      var jsonBody = {
        "name"  : $scope.newPlaylistName
      }
      var uriPath = "/api/playlist/";

      $http.post(uriPath, jsonBody)
      .success( function () {
          $scope.newPlaylistName = "";
          $scope.feedbackClass   = "input-group-addon text-success";
          $scope.feedbackMessage = "Success";
          getPlaylists();
      })
      .error( function (error) {
          $scope.feedbackClass   = "input-group-addon text-danger";
          $scope.feedbackMessage = 'Error';
          $log.info('Playlist retrieval error:' + JSON.stringify(error));
      });
    };

  }]);

})();
