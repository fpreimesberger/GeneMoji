var express = require('express');
var router = express.Router();
const User = require('../models/user');
var request = require('request');
var rp = require('request-promise');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UpdatedUserSchema = new Schema({
  // username: { type: String, required: true },
  // password: { type: String, required: true },
  firstname: { type: String, required: false },
  lastname: { type: String, required: false },
  email: {type: String, required: false},
  acctid: {type: String, required: false},
  gender: {type: String, required: false},
  age: {type: String, required: false },
  ethnicity: { type: String, required: false },
  pred_bmi: { type: String, required: false }
});

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

function getInfo(token, id, first_name, last_name, e_mail, acct_id) {
  var sex = '';
  var age = '';
  var model_ethnicity = '';
  var predicted_bmi = '';
  // genetic_weight -> sex, age, model_ethc, pred_bmi
  var geneticWeightReq = {
    uri: 'https://api.23andme.com/3/profile/'+id+'/report/genetic_weight/',// + id + '/sex/ ',
    headers: {Authorization: 'Bearer ' + token},
    json: true, };
  rp(geneticWeightReq)
    .then(function(body) {
      console.log('genetic weight got');
      console.log(JSON.stringify(body));
      console.log(body['details']['model_inputs']['sex']); // change from model_input later
      sex = body['details']['model_inputs']['sex'];
      age = body['details']['model_inputs']['age'];
      model_ethnicity = body['details']['model_inputs']['model_ethnicity'];
      bmi = body['summary']['predicted_bmi'];
      console.log(sex, age, model_ethnicity, bmi);

      var updatedUser = mongoose.model('updatedUser', UpdatedUserSchema);
      var newUser = updatedUser({
        firstname: first_name,
        lastname: last_name,
        email: e_mail,
        acctid: acct_id,
        gender: sex,
        age: age,
        ethnicity: model_ethnicity,
        predicted_bmi: bmi
      });
      newUser.save();
      console.log('saved' + newUser);

    })
    .catch(function(err) {
      console.log(err);
    })

}

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
      'scope': 'basic names email report:all genomes ancestry phenotypes:read:sex'
    },
    json: true,
  };


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
          // headers: {Authorization: 'Bearer demo_oauth_token'}, // DEMO ONLY
          json: true };
        var userID = "";
        rp(getData)
          .then(function(output) {
            console.log('GET worked');



          // var getAncestry = {
          //   uri: 'https://api.23andme.com/1/ancestry/' + newUser.id + '/?threshold=0.9',
          //   headers: {Authorization: 'Bearer ' + body.access_token},
          //   // headers: {Authorization: 'Bearer demo_oauth_token'},
          //   json: true };
          //
          // rp(getAncestry)
          //   .then(function(output) {
          //     console.log("ancestry: ");
          //     console.log(output);
          //   })
        // getInfo(body.access_token, newUser.acctid); What the fuck
        getInfo('demo_oauth_token', 'demo_profile_id', 'Erin', 'Mendel', 'shit@fuck.com', 'demo_profile_id');
        })
          })
      .catch(function(err) {
        console.log(err);
        res.redirect('/error'); //{error:err}
      });
  }
})

module.exports = router;
