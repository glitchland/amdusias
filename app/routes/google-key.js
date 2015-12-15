var express  = require('express');
var config   = require('../config/settings');
var router = express.Router();

// get the google api key
router.route('/')
.get( function(request, response) {
  response.json({ googleKey: config.googleKey });
});

module.exports = router;
