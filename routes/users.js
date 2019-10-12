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
      var resetToken =  authenticate.getResetToken({_id: new_user._id});
      User.update({ 'username': new_user.username }, {$set: {'reset_token': resetToken }})
      .then((user) => {
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, status: 'Registration Successful!'});
      })
      .catch((err) => {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({err: err});
        return;
      })
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
      res.json({success: false, status: 'No account is registered with that email'});
    });
  }
  else
  {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: false, status: 'No email is entered'});
    return;
  }
});

router.post('/reset/:token', (req, res, next) => {
  User.findOne({ reset_token: req.params.token })
  .then((user) => {
    if(req.body.password1 === req.body.password2) 
    {
      User.update({ 'username': user.username }, {$set: { 'password': req.body.password1 }})
      .then((user) => {
        res.statusCode = 202;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, status: 'Password successfully updated!'});
      })
      .catch((err) => {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, status: 'Password not updated'});
    })
    }
    else 
    {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: false, status: 'The passwords do not match'});
      return;
    }
    user.save(function (err, user) {
      if (err) return new(err);
      else console.log(user.username + "'s password is reset");
    });
  })
  .catch((err) => {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: false, status: 'Invalid route'});
    return;
  });
});

module.exports = router;
