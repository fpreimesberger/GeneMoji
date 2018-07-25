var express = require('express');
var router = express.Router();
const User = require('../models/user');
var request = require('request');
var rp = require('request-promise');

// landing page
router.get('/', function(req, res, next) {
  const currentUserId = req.session.userId;
  const currentUsername = req.session.username;
  console.log("username:");
  console.log(JSON.stringify(currentUsername));
  res.render('index', { title: 'GeneMoji', currentUserId: currentUserId, currentUsername: currentUsername });
});

// GET login
router.get('/login', (req, res, next) => {
  res.render('login');
});
// POST login
router.post('/login', (req, res, next) => {
  User.authenticate(req.body.username, req.body.password, (err, user) => {
    if (err || !user) {
      const next_error = new Error("Username or password incorrect");
      next_error.status = 401;

      return next(next_error);
    } else {
      req.session.userId = user._id;

      return res.redirect('/') ;
    }
  });
});

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// get token after user connects their 23andMe acct
router.get('/callback', (req, res, next) => {
 // CHANGE SCOPE
  var options = {
    method: 'POST',
    uri: 'https://api.23andme.com/token/',
    form: {
      'client_id': process.env.CLIENT_ID,
      'client_secret': process.env.CLIENT_SECRET,
      'grant_type': 'authorization_code',//process.env.GRANT_TYPE,//'authorization_code',
      'code': req.query.code,
      'redirect_uri': process.env.REDIRECT_URI,
      'scope': 'basic'
    },
    json: true,
  };

  const UpdatedUserSchema = new Schema({
    // username: { type: String, required: true },
    // password: { type: String, required: true },
    firstname: { type: String, required: false },
    lastname: { type: String, required: false },
    // optionals
    email: {type: String, required: false}
  });


// POST to API with request-promise, receive auth token and redirect
  if (!req.query.code) {
    console.log('error with code');
  } else {
    console.log('attempting to post for token');
    rp(options)
      .then(function(body) {
        console.log('it worked');
        console.log(body);
        console.log(body.access_token);
        // res.render('/callback', {token: body.access_token}); // changed from res.redirect
      // GET from API -
        var getData = {
          uri: 'https://api.23andme.com/3/account/',
          headers: {Authorization: 'Bearer ' + body.access_token},
          // headers: {Authorization: 'Bearer demo_oauth_token'},
          json: true };// Automatically parses the JSON string in the response
        rp(getData)
          .then(function(output) {
            console.log('GET worked');

            var updatedUser = mongoose.model('updatedUser', UpdatedUserSchema);
            // find user by id and add email to database
            var newUser = updatedUser({
              firstname: output['data'][0]['first_name'],
              lastname: output['data'][0]['last_name'],
              email: output['data'][0]['email']
            })
            newUser.save();
            console.log('saved' + newUser);

          })
        })
      .catch(function(err) {
        console.log(err);
        res.redirect('/error'); //{error:err}
      });
  }
})

module.exports = router;
