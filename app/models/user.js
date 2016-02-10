"use strict";

var mongoose = require('mongoose'),
    bcrypt   = require("bcryptjs"),
    Schema   = mongoose.Schema;

var UserSchema = new Schema({

    username: {
        type: String,
        unique: true,
        required: true,
        validate: {
          validator: function(v) {
            return /[a-zA-Z0-9_]{3,20}/.test(v)
          },
          message: 'This is not a valid username.'
        },
    },
    modelid : {
      type: Number,
    },
    password: {
        type: String,
        required: true
    }

}, {
    toObject: {
        virtuals: true
    }, toJSON: {
        virtuals: true
    }
});

UserSchema.pre('save', function (next) {
    var user = this;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});

UserSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('User', UserSchema);
