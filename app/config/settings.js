var mongoUrl = process.env.MONGOLAB_URI || 'mongodb://localhost/amdusias';
var port = process.env.PORT || 3000;
var jwtSecret = '';
var jwtExpires = '2 days';
var googleApiKey = '';

module.exports = {
    dbUrl: mongoUrl,
    jwtSecret: jwtSecret,
    jwtExpiry: jwtExpires,
    listenPort: port,
    googleApiKey: googleApiKey
};
