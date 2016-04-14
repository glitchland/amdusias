var express = require('express');
var _internalServerState = require("../data/volatile-state");
var playlist = require('../models/playlist');

var badRequest = 400;
var success = 200;
var failure = 420;

var router = express.Router();

/************************************************************************/
/************************** Manage State *******************************/


/************************************************************************/
/**************************** API ***************************************/
router.route('/')
    .all(function(request, response, next) {
        var username = request.user.username;
        var playlistId = request.body.playlistId;

        if (!username) {
            console.log("ERROR: No username in request to DJ-queue");
            return response.status(failure).json("no username error").end();
        }

        if (!playlistId) {
            playlistId = null;
        }

        request.playlist = playlistId;
        next();
    }) // join dj queue
    .post(function(request, response) {
        _internalServerState.DJadd(request.user.username, request.playlist);
        return response.status(200).end();
    }) // skip a song
    .put(function(request, response) {
        _internalServerState.DJskip(request.user.username);
        return response.status(200).end();
    }) //
    .get(function(request, response) {
        return response.status(200).json(_internalServerState.getState()).end();
    }) //remove dj
    .delete(function(request, response) {
        _internalServerState.DJrm(request.user.username);
        return response.status(200).end();
    });

module.exports = router;
