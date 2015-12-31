/*
# node create_user.js demo demo
*/
var path = require("path"),
    config = require("./app/config/settings.js"),
    User = require(path.join(__dirname, "app/models", "user.js"));

var args = process.argv.slice(2);

var username = args[0];
var password = args[1];

if (args.length < 2) {
    console.log("usage: node %s %s %s", path.basename(process.argv[1]), "user", "password");
    process.exit();
}

console.log("Username: %s", username);
console.log("Password: %s", password);

console.log("Creating a new user in Mongo");

var mongoose = require('mongoose');
mongoose.set('debug', true);
mongoose.connect(config.dbUrl);
mongoose.connection.on('error', function () {
    console.log('Mongoose connection error', arguments);
});

mongoose.connection.once('open', function callback() {
    console.log("Mongoose connected to the database");

    var user = new User();

    user.username = username;
    user.password = password;

    user.save(function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log(user);
        }
        process.exit();
    });

});
