var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
var authenticate = require('../authenticate');
var cors = require('./cors');
var transporter = require('../mailer');
var config = require('../config');

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
router.get('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, function(req, res, next) {
  User.find({})
  .then((users) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(users);
  })
  .catch((err) => next(err));
});

router.post('/signup', cors.corsWithOptions,  (req, res, next) => {
  User.register(new User({username: req.body.username}), 
    req.body.password, (err, user) => {
    if(err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else {
      if (req.body.firstname)
        user.firstname = req.body.firstname;
      if (req.body.middlename)
        user.middlename = req.body.middlename;
      if (req.body.lastname)
      user.lastname = req.body.lastname;
      if (req.body.role)
      user.role = req.body.role;
      if (req.body.email)
      user.email = req.body.email;
      if (req.body.mobile_no)
      user.mobile_no = req.body.mobile_no;
      user.save((err, user) => {
        if (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({err: err});
          return;
        }
        passport.authenticate('local')(req, res, () => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true, status: 'Registration Successful!'});
      });
      });
    }
  });
});

router.post('/login', cors.corsWithOptions,  passport.authenticate('local'), (req, res, next) => {

  var token = authenticate.getToken({_id: req.user._id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, token: token, status: 'You are successfully logged in!'});
});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

router.post('/forgot', (req, res, next) => {
  if(req.body.email) {
    User.findOne({email: req.body.email})
    .then((User)=>{
      const mailOptions = {
      from: config.mailer.username, // sender's address
      to: User.email, // receiver's address
      subject: 'Password Reset', // Subject line
      html: '<h1>If you received this email, you previous registered and requested to reset your password</h1>'// plain text body
    };
    transporter.sendMail(mailOptions, function (err, info) {
      if(err)
      {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({err: err});
        return;
      }
      else
      {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, status: 'Email sent successfully!'});
      }
   });
    }).catch((err)=>{
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({failed: true, status: 'No account is registered with that email'});
    });
  }
  else
  {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.json({failed: true, status: 'No email is entered'});
    return;
  }
});

module.exports = router;
