var express  = require('express');
var config   = require('../config/settings');
var router = express.Router();

// get the google api key
router.route('/')
  .get( function(request, response) {
    return response.status(200).json({ googleKey: config.googleKey }).end();
  });

module.exports = router;
