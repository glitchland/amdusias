/*
*   Model for song
*/

// grab the mongoose module
var mongoose = require('mongoose');

// create a new schema
var Schema = mongoose.Schema;

// define the schema
var SongSchema = new Schema({
   name        : {
     type: String,
     required: true,
     unique: true,
    },
    videoId    : {
      type: String,
      required: true,
    },
    thumbnail  : {
      type: String,
      required: true,
    }
});

module.exports = mongoose.model('Song', SongSchema);
