var express  = require('express');
var state = require("../data/volatile-state");
var playlist = require('../models/playlist');

var badRequest = 400;
var success    = 200;
var failure    = 420;

var router = express.Router();

/************************************************************************/
/************************** Manage State *******************************/


/************************************************************************/
/**************************** API ***************************************/
// join dj rotation
router.route('/')
  .all(function (request, response, next) {
    var username = request.user.username;
    var playlistId = request.body.playlistId;

    if(!username) {
      return response.status(failure).json("no username error").end();
    }

    if(!playlistId) {
      return response.status(failure).json("no playlistid error").end();
    }

    request.username = username;
    request.playlist = playlistId;
    next();
  })
  .post( function(request, response) {

    playlist.
      find({'username': request.username}).
      where('_id').equals(request.playlist).
      select('_id').
      exec(function(err, result) {

        if(result.length === 0) {
          console.log(err);
          return response.status(failure).json("invalid playlistid error").end();
        }

        state.addDj(request.username, request.playlist);
        state.printState();
        return response.status(200).json("ok").end();

      });
  })
  .get( function(request, response) { //status
    return response.status(200).json(state.getState()).end();
  })
  .delete( function(request, response) { //status

    playlist.
      find({'username': request.username}).
      where('_id').equals(request.playlist).
      select('_id').
      exec(function(err, result) {

        if(playlist.length === 0) {
          console.log(err);
          return response.status(failure).json("invalid playlistid error").end();
        }

        state.rmDj(request.username);
        state.printState();
        return response.status(200).json("ok").end();

      });
  });

module.exports = router;
