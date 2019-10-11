var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
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
  var new_user = new User({
    username: req.body.username,
    password: req.body.password,
    firstname: req.body.firstname,
    middlename: req.body.middlename,
    lastname: req.body.lastname,
    role: req.body.role,
    email: req.body.email,
    mobile_no: req.body.mobile_no
  });

  new_user.save(function(err) {
    if (err) 
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
      res.json({success: true, status: 'Registration Successful!'});
    }
});
});

router.post('/login', cors.corsWithOptions,  authenticate.userAuthenticate, (req, res, next) => {

  User.findOne( {username: req.body.username} ).
  then((user)=>{
    var token = authenticate.getToken({_id: user._id});
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: true, token: token, status: 'You are successfully logged in!'});
  })
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
      html: '<h1>If you received this email, you previously registered and requested to reset your password</h1>'// plain text body
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

router.post('/reset', (req, res, next) => {
  if(req.body.new_password1 === req.body.new_password2) 
  {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: true, status: 'Password is successfully reset!'});
  }
  else {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.json({failed: true, status: 'The two passwords do not match'});
    return;
  }
});

module.exports = router;
