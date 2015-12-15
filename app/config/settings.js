var mongoUrl  = process.env.MONGOLAB_URI || 'mongodb://localhost/amdusias';
var port      = process.env.PORT || 3000;
var jwtSecret = '';
var googleApi = '';

module.exports = {
    dbUrl : mongoUrl,
    jwtSecret: jwtSecret,
    listenPort: port,
    googleKey: googleApi
};
