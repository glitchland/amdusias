var express = require('express');
var state = require("../data/volatile-state");
var validator = require("../data/valid-3d-model-names");
var User = require('../models/user');

var router = express.Router();
var badRequest = 400;
var success = 200;
var failure = 420;

////////////////////////////////////////////////////////////////////////
// User model state management
///////////////////////////////////////////////////////////////////////


// add the user into the scene
router.route('/join')
    .post(function(request, response) {
        var username = request.user.username;

        if (!username) {
            console.log("ERROR: No username in request to gamestate-api");
            return response.status(failure).json("no username error").end();
        }

        state.joinFloor(username);
        return response.status(200).end();

    });

// toggle the dance animation on and off
router.route('/toggle-dance')
    .post(function(request, response) {
        var username = request.user.username;

        if (!username) {
            console.log("ERROR: No username in request to gamestate-api");
            return response.status(failure).json("no username error").end();
        }

        state.toggleDance(username);
        return response.status(200).end();
    });

// change the avatar model
router.route('/change-model')
    .post(function(request, response) {
        var newModelName = request.body.newModelName;
        var username = request.user.username;

        if (!username) {
            console.log("ERROR: No username in request to gamestate-api");
            return response.status(failure).json("no username error").end();
        }

        if (!newModelName || !validator.isModelValid(newModelName)) {
            return response.status(failure).json("this is not a valid model name").end();
        }

        User.findOne({
                'username': username
            })
            .exec(function(err, doc) {
                if (doc) {
                    doc.avmodel = newModelName;
                    doc.save();
                    state.changeModel(username, newModelName);
                    return response.status(success).json("changed the model").end();
                } else {
                    return response.status(failed).json("failed to rename model").end();
                }
            });

    });

module.exports = router;
