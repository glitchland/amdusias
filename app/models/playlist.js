/*
 *   Model for playlist
 */

// grab the mongoose module
var mongoose = require('mongoose');

// create a new schema
var Schema = mongoose.Schema;

// schema for playlists
var playlistSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /[a-zA-Z0-9_-\s]{3,20}/.test(v);
            },
            message: 'This is not a playlist valid name.'
        },
    },
    // this array will contain a list of song ids
    songs: [{
        type: Schema.Types.ObjectId,
        ref: 'Song'
    }]
});

module.exports = mongoose.model('Playlist', playlistSchema);
