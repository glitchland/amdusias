var express  = require('express');
var Playlist = require('../models/playlist');
var Song     = require('../models/song');

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
        return response.json({ message: 'Error saving playlist!' }).end();
      }
      return response.json({ message: 'Playlist created!' }).end();
    });

})
.get( function(request, response) {
    // respond with all of the playlists that the user owns
    var username = request.user.username;
    if (!username) {
        console.log("No username in request!");
        return response.status(badRequest).json("Not username in request!").end();
    }

    // XXX : make this a populate query with the user id
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

    // grab the playlist, and all of the song details -- in order
    // Use populate here to respond with the song fields
    // http://mongoosejs.com/docs/populate.html
    Playlist.
      find({'username': username}).
      where('_id').equals(playlistId).
      populate('songs', 'videoname videoid thumbnail').
      exec(function(err, details) {
        var songList = {"songs": details[0].songs};
        console.log(songList);
        return response.json(songList).end();
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

    // XXX go through the songs in the playlist and delete them all
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
// add song to playlist with id
router.route('/:id/song/:songid?')
.post( function(request, response) {

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
    return response.status(badRequest).json("Video details format was incorrect").end();
  }

  // Add a song to the playlist
  Playlist.
    findOne({'username': username}).
    where('_id').equals(playlistId).
    exec( function (err, playlist) {

      if(!playlist)
        return response.status(failure).json("Failed to add song.").end();

      var song = new Song({
                    _playlist: playlist._id,
                    videoname: videoName,
                    videoid: videoId,
                    thumbnail: thumbnail,
                    length: secondsLength,
                   });

      song.save(function (err) {
          if (err)
            console.log("ERROR: "+ JSON.stringify(err));
      });

      playlist.songs.push(song);
      // XXX Wrap the return in a callback passed to .save()
      playlist.save();
      return response.status(success).json("Added the song.").end();
    });
})
.delete ( function(request, response) { // remove song

  var playlistId = request.params.id;
  var username   = request.user.username;
  var songId     = request.params.songid;

  if (!playlistId) {
    console.log("No id in request!");
    return response.status(badRequest).json("No id in request!").end();
  }

  if (!username) {
      console.log("No username in request!");
      return response.status(badRequest).json("No username in request!").end();
  }

  if (songId === undefined) {
    console.log("Video ID is missing.");
    return response.status(badRequest).json("Video index is missing").end();
  }

  // when the song is removed, delete the song entry
  Playlist.
    findOne({'username': username}).
    where('_id').equals(playlistId).
    exec( function (err, playlist){
      if (playlist) {
        playlist.songs.remove(songId);
        playlist.save(function (err) {
          // delete the song as well
          Song.findOne({}).where('_id').equals(songId).exec( function (err, song) {
            song.remove();
            song.save(
              function() {
                return response.status(success).json("Removed song").end();
              }
            );
          });
        });
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
