var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

var User = new Schema({
    username: { type: String, required: true, index: { unique: true }},
    password: { type: String, required: true },
    firstname: { type: String },
    middlename: { type: String },
    lastname : { type: String },
    admin: { type: Boolean, default: false },
    role: { type: String },
    email: { type: String },
    mobile_no: { type: Number },
    reset_token: { type: String, default: '' },
},{ timestamps: true });

User.pre("save", function (next) {
    // store reference
    const user = this;
    if (user.password === undefined) {
        return next();
    }
    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) console.log(err);
        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) console.log(err);
            user.password = hash;
            next();
        });
    });
});

module.exports = mongoose.model('User', User);