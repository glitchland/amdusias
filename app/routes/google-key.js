var express = require('express');
var config = require('../config/settings');
var router = express.Router();

// get the google api key
router.route('/')
    .get(function(request, response) {
        return response.status(200).json({
            googleApiKey: config.googleApiKey
        }).end();
    });

module.exports = router;
