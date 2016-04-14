var express = require('express');
var jwt = require('jsonwebtoken');
var config = require('../config/settings');
var router = express.Router();


// authenticate user
router.route('/')
    .post(function(request, response) {

        console.log("Auth success...");

        var username = request.user.username;

        var token = jwt.sign({
            username: username,
        }, config.jwtSecret, {
            expiresIn: config.jwtExpiry
        });

        // send the token to the user
        return response.status(200).json({
            token: token
        }).end();

    });

router.route('/check')
    .get(function(request, response) {
        return response.status(200).json("ok").end();
    });

module.exports = router;
