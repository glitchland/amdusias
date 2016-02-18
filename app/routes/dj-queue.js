var express  = require('express');
var state    = require("../data/volatile-state");
var playlist = require('../models/playlist');

var badRequest = 400;
var success    = 200;
var failure    = 420;

var router = express.Router();

/************************************************************************/
/************************** Manage State *******************************/


/************************************************************************/
/**************************** API ***************************************/
router.route('/')
  .all(function (request, response, next) {
    var username = request.user.username;
    var playlistId = request.body.playlistId;

    if(!username) {
      return response.status(failure).json("no username error").end();
    }

    if(!playlistId) {
      playlistId = null;
    }

    request.username = username;
    request.playlist = playlistId;
    next();
  })
  .post( function(request, response) { // join dj rotation

    state.addDJ(request.username, request.playlist);

  })
  .get( function(request, response) { //status
    return response.status(200).json(state.getState()).end();
  })
  .delete( function(request, response) { //remove dj

    state.rmDJ(request.username);

  });

module.exports = router;
