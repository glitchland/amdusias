var express  = require('express');
var Playlist = require('../models/playlist');

var router = express.Router();
var badRequest = 400;
var success    = 200;
var failure    = 420;

////////////////////////////////////////////////////////////////////////
// playlist curation
///////////////////////////////////////////////////////////////////////

// create a playlist
router.route('/')
  .post( function(request, response) {
    // create a new instance of the playlist model
    var playList = new Playlist();

    // validate
    playList.name     = request.body.name;
    playList.username = request.user.username;

    // save the song and check for errors
    playList.save(function(err) {
      if (err) {
        console.log(err);
          return response.json({ message: 'Error saving playlist!' }).end();
      }
      return response.json({ message: 'Playlist created!' }).end();
    });
})
.get( function(request, response) {
      console.log("REQUEST USER:" + JSON.stringify(request.user));
    // respond with all of the playlists that the user owns
    var username = request.user.username;
    if (!username) {
        console.log("No username in request!");
        return response.status(badRequest).json("Not username in request!").end();
    }

    Playlist.find({}).
      where('username').equals(username).
      select('name _id').
      exec(function(err, playlists) {
        return response.json(playlists).end();
      });
});

// routes with playlist id
router.route('/:id')
  .get( function(request, response) { // respond with the playlist with the ID

    var playlistId = request.params.id;
    var username   = request.user.username;

    if (!playlistId) {
        console.log("No id in request!");
        return response.status(badRequest).json("No id in request!").end();
    }

    if (!username) {
        console.log("No username in request!");
        return response.status(badRequest).json("No username in request!").end();
    }

    Playlist.
      find({'username': username}).
      where('_id').equals(playlistId).
      select('name _id songs').
      exec(function(err, playlists) {
        return response.json(playlists).end();
    });
  })
  .delete( function(request, response) { // delete the playlist with the ID

    var playlistId = request.params.id;
    var username   = request.user.username;

    if (!playlistId) {
        console.log("No id in request!");
        return response.status(badRequest).json("No id in request!").end();
    }

    if (!username) {
        console.log("No username in request!");
        return response.status(badRequest).json("No username in request!").end();
    }

    Playlist.
      find({'username': username}).
      where('_id').equals(playlistId).
      remove().
      exec(function(err) {
        if (!err) {
          return response.status(success).json("Successfully Deleted.").end();
        } else {
          return response.status(fail).json("Failed to delete playlist.").end();
        }
    });
})
.put( function(request, response) { // rename a playlist with the ID

  var playlistId = request.params.id;
  var username   = request.user.username;
  var newName    = request.body.newname;

  if (!playlistId) {
      console.log("No id in request!");
      return response.status(badRequest).json("No id in request!").end();
  }

  if (!username) {
      console.log("No username in request!");
      return response.status(badRequest).json("No username in request!").end();
  }

  if (!newName) {
    return response.status(badRequest).json("New playlist name missing from request").end();
  }

  Playlist.
    findOne({'username': username}).
    where('_id').equals(playlistId).
    exec( function (err, doc){
      if (doc) {
        doc.name = newName;
        doc.save();
        return response.status(success).json("Renamed the playlist").end();
      } else {
        return response.status(failed).json("Failed to rename the playlist").end();
      }
    });
});

////////////////////////////////////////////////////////////////////////
// song curation
///////////////////////////////////////////////////////////////////////

router.route('/:id/song/:index?')
.post( function(request, response) { // add song to playlist with id

  var playlistId     = request.params.id;
  var username       = request.user.username;
  var videoName      = request.body.name;
  var videoId        = request.body.vid;
  var thumbnail      = request.body.thumb;
  var secondsLength  = request.body.secondsLength;

  if (!playlistId) {
    console.log("No id in request!");
    return response.status(badRequest).json("No id in request!").end();
  }

  if (!username) {
      console.log("No username in request!");
      return response.status(badRequest).json("No username in request!").end();
  }

  if (!videoName || !videoId || !thumbnail || !secondsLength) {
    console.log(videoName + videoId + thumbnail + secondsLength);
    return response.status(badRequest).json("Video details format was incorrect").end();
  }

  Playlist.
    findOne({'username': username}).
    where('_id').equals(playlistId).
    exec( function (err, doc){
      if (doc) {
        // XXX make a model for the songs
        doc.songs.push({name: videoName, vid : videoId, thumb : thumbnail, length : secondsLength});
        doc.save();
        return response.status(success).json("Added the song.").end();
      } else {
        return response.status(failed).json("Failed to add song.").end();
      }
    });
})
.delete ( function(request, response) { // remove song

  var playlistId = request.params.id;
  var username   = request.user.username;
  var songIndex  = request.params.index;

  if (!playlistId) {
    console.log("No id in request!");
    return response.status(badRequest).json("No id in request!").end();
  }

  if (!username) {
      console.log("No username in request!");
      return response.status(badRequest).json("No username in request!").end();
  }

  if (songIndex === undefined) {
    console.log("Video index is missing.");
    return response.status(badRequest).json("Video index is missing").end();
  }

  Playlist.
    findOne({'username': username}).
    where('_id').equals(playlistId).
    exec( function (err, doc){
      if (doc) {
        console.log("Docs length: " + doc.songs.length);
        if (doc.songs.length >= songIndex && songIndex >= 0) {
          doc.songs.splice(songIndex, 1);
          doc.save();
          return response.status(success).json("Removed song").end();
        } else {
          return response.status(failed).json("Failed to remove song").end();
        }
      } else {
        return response.status(failed).json("Failed to remove song").end();
      }
    });
})
.put( function(request, response) { // change position of a song from a playlist with the ID

  var playlistId    = request.params.id;
  var username      = request.user.username;
  var originalIndex = request.body.originalIndex;
  var newIndex      = request.body.newIndex;

  if (!playlistId) {
    console.log("No id in request!");
    return response.status(badRequest).json("No id in request!").end();
  }

  if (!username) {
      console.log("No username in request!");
      return response.status(badRequest).json("No username in request!").end();
  }

  if (!originalIndex || !newIndex) {
    return response.status(badRequest).json("Video indexes are missing").end();
  }

  Playlist.
    findOne({'username': username}).
    where('_id').equals(playlistId).
    exec( function (err, doc){
      if (doc) {
        if ((doc.songs.length > newIndex && newIndex > 0) &&
            (doc.songs.length > originalIndex && originalIndex > 0)) {

          // get the original song
          var originalSong = doc.songs[originalIndex];

          // insert it into the array at the new index
          doc.songs.splice(newIndex, 0, originalSong);

          // remove the old entry from the song list
          doc.songs.splice(originalIndex, 1);

          doc.save();
          return response.status(success).json("Moved the song").end();
        } else {
          return response.status(failed).json("Failed to move song").end();
        }
      } else {
        return response.status(failed).json("Failed to move song").end();
      }
    });
});

module.exports = router;
