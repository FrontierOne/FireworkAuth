var passport = require('passport');
var User = require('./models/user');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');

var config = require('./config');

//exports.local = passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

exports.userAuthenticate = (req, res, next) => {
    User.findOne({ username: req.body.username })
    .then((User) => {
        bcrypt.compare(req.body.password, User.password, function (err, result) {
            if (result == true) {
                next();
            } else {
                var err = new Error('The password entered is wrong');
                err.status = 403;
                return next(err);
            }
          });
    })
    .catch((err) => {
        var err = new Error('Username entered it wrong');
        err.status = 403;
        return next(err);
    });
}

exports.getToken = function(user) {
    return jwt.sign(user, config.secretkey,
        {expiresIn: 3600});
};

exports.getResetToken = function(user) {
    return jwt.sign(user, config.resetSecretkey,
        {expiresIn: 1});
};

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretkey;

exports.jwtPassport = passport.use(new JwtStrategy(opts, 
    (jwt_payload, done) => {
        console.log("JWT payload: ", jwt_payload);
        User.findOne({_id: jwt_payload._id}, (err, user) => {
            if (err) {
                return done(err, false);
            }
            else if (user) {
                return done(null, user);
            }
            else {
                return done(null, false);
            }
        });
    }));

exports.verifyUser = passport.authenticate('jwt', {session: false});

exports.verifyAdmin = (req, res, next) => {
    if(req.user.admin == true) {
        next();
    }
    else{
        var err = new Error('You are not authorized to perform this operation!');
        err.status = 403;
        return next(err);
    }
};