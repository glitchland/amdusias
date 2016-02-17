(function() {

  angular.module('amdusias')
  .controller('PlaylistController', ['AuthYoutube', '$scope', '$http', '$log', function(AuthYoutube, $scope, $http, $log) {

    $scope.feedbackMessage  = null;
    $scope.feedbackClass    = null;
    $scope.selectedPlaylist = null;
    $scope.playlists        = [];
    $scope.playlistContent  = [];
    $scope.newPlaylistName  = "";

    $scope.getPlaylists = function() {
      $http.get("/api/playlist/")
      .success( function (result) {
            $log.info("Playlist results:" + JSON.stringify(result));
            $scope.playlists = result;
        });
    }
    // get the set of playlists
    $scope.getPlaylists();

    // Toggle UI slide down
    $scope.checked = false; // This will be binded using the ps-open attribute

    $scope.toggle = function(){
        $scope.checked = !$scope.checked
    }

    // get details for playlist on state change
    $scope.changedValue = function (playlist) {

        var playlistId = playlist._id;

        if (!playlistId) {
            $scope.feedback = "Error, no playlist id found.";
            return;
        }

        $http.get("/api/playlist/" + playlistId, {})
          .success( function (playlistDetails) {
            if (playlistDetails.length === 0) {
              $scope.feedback = "No results were found!";
            }
            $scope.playlistContent  = [];
            $scope.playlistContent  = playlistDetails;

        })
        .error( function (error) {
          //$scope.songList = 'Search error:' + JSON.stringify(error);
          $scope.feedback = "Error retrieving playlist contents!";
          $log.info("Playlist retrieval error:" + JSON.stringify(error));
        });
    }

    // fetch video length
    $scope.getVideoLength = function (video) {
      var baseUrl  = "https://www.googleapis.com/youtube/v3/videos?id=";
      var apiToken = "&key=" + AuthYoutube.getApiToken();
      var contentDetails = "&part=contentDetails";
      var fullUrl = baseUrl + video.id.videoId + apiToken + contentDetails;

      return $http.get(fullUrl, {})
      .success( function (data) {
          return data;
      })
      .error( function (error) {
        $scope.feedback = "Error retrieving video length!";
        return -1;
      });

    }

    // get time in seconds from google ISO 8601 content details duration
    $scope.convertGoogleTimeToSeconds = function(duration) {
      var matches = duration.match(/[0-9]+[HMS]/g);

      var seconds = 0;

      matches.forEach(function (part) {
          var unit = part.charAt(part.length-1);
          var amount = parseInt(part.slice(0,-1));

          switch (unit) {
              case 'H':
                  seconds += amount*60*60;
                  break;
              case 'M':
                  seconds += amount*60;
                  break;
              case 'S':
                  seconds += amount;
                  break;
              default:
                  // noop
          }
      });
      return seconds;
    }

    // add song to playlist
    $scope.addToPlaylist = function (video) {

      // video.id.videoId
      if (!$scope.selectedPlaylist || !$scope.selectedPlaylist._id) {
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

      // get length of the video so that we can better sync it
      var myVideoLengthPromise = $scope.getVideoLength(video);
      myVideoLengthPromise.then( function (videoData) {

        if (videoData.length === 0) {
          $scope.feedback = "No results were returned!";
          return -1;
        }
        $log.info("getVideoLength:" + JSON.stringify(videoData));
        var stringDuration = videoData.data.items[0].contentDetails.duration;
        var videoLength = $scope.convertGoogleTimeToSeconds(stringDuration);

        if (videoLength <= 0)
        {
            $log.error("Could not fetch length of video");
            $scope.feedbackClass   = "btn btn-danger";
            $scope.feedbackMessage = "Could not fetch length of video";
            return;
        }

        var uriPath = "/api/playlist/" + $scope.selectedPlaylist._id + "/song";

        $log.info("videoLength" + JSON.stringify(jsonBody));
        var jsonBody = {
          "name"          : video.snippet.title,
          "vid"           : video.id.videoId,
          "secondsLength" : videoLength,
          "thumb"         : video.snippet.thumbnails.default.url
        }
        $log.info("jsonbody" + JSON.stringify(jsonBody));

        $http.post(uriPath, jsonBody)
        .success( function (result) {
            $scope.feedback = jsonBody.name + " song added.";
            $scope.changedValue($scope.selectedPlaylist);
          })
        .error( function (error) {
          $log.error("Could not store song");
          $scope.feedbackClass   = "btn btn-danger";
          $scope.feedbackMessage = "Could not store song";
          return;
        });

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

      if (!video._id) {
        $scope.feedback = "Video id is missing!";
        return;
      }

      var uriPath = "/api/playlist/" + $scope.selectedPlaylist._id + "/song/" + video._id;

      $http.delete(uriPath)
      .success( function (result) {
            $scope.feedback = video.name + " song deleted.";
            $scope.changedValue($scope.selectedPlaylist);
      });

    };

    // delete a playlist
    $scope.deletePlaylist = function() {

      if (!$scope.selectedPlaylist._id) {
        $scope.feedbackClass   = "btn btn-danger";
        $scope.feedbackMessage = "select a playlist";
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
          $scope.feedbackMessage = "Error";
          $log.info("Playlist delete error:" + JSON.stringify(error));
      });

    };

    // create a playlist
    $scope.createPlaylist = function () {

      if (!$scope.newPlaylistName) {
        $scope.feedbackClass   = "input-group-addon text-danger";
        $scope.feedbackMessage = "Blank name forbidden";
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
          $scope.feedbackMessage = "Error";
          $log.info("Playlist retrieval error:" + JSON.stringify(error));
      });
    };

    // dj using this playlist
    $scope.djThisPlaylist = function () {

      if (!$scope.selectedPlaylist._id) {
        $scope.feedbackClass   = "input-group-addon text-danger";
        $scope.feedbackMessage = "Cannot DJ empty playlist";
        return;
      }

      var jsonBody = {
        "playlistId"  : $scope.selectedPlaylist._id
      }
      var uriPath = "/api/djq/";

      $http.post(uriPath, jsonBody)
      .success( function () {
          $scope.feedbackClass   = "input-group-addon text-success";
          $scope.feedbackMessage = "Success";
      })
      .error( function (error) {
          $scope.feedbackClass   = "input-group-addon text-danger";
          $scope.feedbackMessage = "Error";
          $log.info("Failed to add myself to DJ roster:" + JSON.stringify(error));
      });
    };

  }]);

})();
