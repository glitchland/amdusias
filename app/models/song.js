/*
 *   Model for song
 */

// grab the mongoose module
var mongoose = require('mongoose');

// create a new schema
var Schema = mongoose.Schema;

/*
 *  var videoName      = request.body.name;
 *  var videoId        = request.body.vid;
 *  var thumbnail      = request.body.thumb;
 *  var secondsLength  = request.body.secondsLength;
 */
var songSchema = new Schema({
    _playlist: {
        type: Schema.Types.ObjectId,
        ref: 'Playlist'
    },
    videoname: {
        type: String,
        required: true,
        maxlength: 128,
        message: 'This is not a valid videoname.'
    },
    videoid: {
        type: String,
        required: true,
        validator: function(v) {
            return /[a-zA-Z0-9_-]{8,12}/.test(v);
        },
        message: 'This is not a valid videoid.'
    },
    thumbnail: {
        type: String,
        required: true,
        maxlength: 256,
    },
    secvidlen: {
        type: Number,
        required: true
    },
    played: {
        type: Date,
        default: '12/10/1990'
    },
    position: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Song', songSchema);
