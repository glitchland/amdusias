var User   = require('../models/user');  // get our mongoose model

module.exports = {

  authenticate : function (request, response, next) {
    console.log("Authenticating : " + request.url);

    var username = request.body.username,
        password = request.body.password;

    if (!username || !password) {
        return response.status(400).json('Must provide username or password').end();
    }

    // find the user
    User.findOne({
      username: username
    }, function(err, user) {

      if (err) throw err;

      if (!user) {
        return response.status(401).json('Username or password incorrect').end();
      }

      if (user) {

        // check if password matches
        user.comparePassword ( password, function (err, isMatch) {
          if (isMatch && !err) {
            console.log("[+] " + username + " user authenticated, generating token");
            request.user = user;  //Append the user to the request, and go to next, which is the root route.
            next();
          } else {
            return response.status(401).json('Username or password incorrect').end();
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
