var User   = require('../models/user');  // get our mongoose model

module.exports = {

  authenticate : function (request, response, next) {
    console.log("Authenticating : " + request.url);

    var username = request.body.username,
        password = request.body.password;

    if (!username || !password) {
        response.status(400).end('Must provide username or password');
    }

    // find the user
    User.findOne({
      username: username
    }, function(err, user) {

      if (err) throw err;

      if (!user) {
        response.status(401).end('Username or password incorrect');
      }

      if (user) {

        // check if password matches
        user.comparePassword ( password, function (err, isMatch) {
          if (isMatch && !err) {
            console.log("[+] " + username + " user authenticated, generating token");
            request.user = user;
            next();
          } else {
            return response.status(401).end('Username or password incorrect');
          }
        });

      }

    });
     //findone function
  },

  checkAuthenticated : function (request, response, next) {
    if (request.user) {
      next();
    } else {
      response.status(401).end('Must be authenticated.');
    }
  }
};
