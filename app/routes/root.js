var express  = require('express');
var jwt      = require('jsonwebtoken');
var config   = require('../config/settings');
var router   = express.Router();


// authenticate user
router.route('/login')
  .post(function(request, response) {

    console.log("Auth success...");

    var username = request.user.username;

    var token = jwt.sign({
      username: username
    }, config.jwtSecret);

    // send the token to the user
    return response.status(200).json({
      token: token
    }).end();

});

module.exports = router;
