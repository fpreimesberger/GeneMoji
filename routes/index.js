var express = require('express');
var router = express.Router();
const User = require('../models/user');
var Bluebird = require('bluebird');
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
  pred_bmi: { type: String, required: false },
  eyecolor: { type: String, required: false }
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

// messss
function getInfo(token, id, first_name, last_name, e_mail, acct_id) {
  var sex = '';
  var age = '';
  var model_ethnicity = '';
  var predicted_bmi = '';
  var eye_color = '';
  var hair_color = 'test';
  // genetic_weight -> sex, age, model_ethc, pred_bmi
  var geneticWeightReq = {
    uri: `https://api.23andme.com/3/profile/${id}/report/genetic_weight/`, // + id + '/sex/ ',
    headers: {Authorization: 'Bearer ' + token},
    json: true, };
  // eye color
  var eyeColorReq = { // rs12913832; AA --> brown
    uri: `https://api.23andme.com/3/profile/${id}/marker/rs12913832/`,
    headers: {Authorization: 'Bearer ' + token},
    json: true, };
  // hair color
  var blackHairUris = [`https://api.23andme.com/3/profile/${id}/marker/rs12913832/`, `https://api.23andme.com/3/profile/${id}/marker/rs28777/`]; // array of uris for blach hair
  var redHairUris = [`https://api.23andme.com/3/profile/${id}/marker/rs1805007/`, `https://api.23andme.com/3/profile/${id}/marker/rs1805008/`, `https://api.23andme.com/3/profile/${id}/marker/rs11547464/`];
  var blondeHairUris = [`https://api.23andme.com/3/profile/${id}/marker/rs35264875/`, `https://api.23andme.com/3/profile/${id}/marker/rs1129038/`, `https://api.23andme.com/3/profile/${id}/marker/rs7495174/`, `https://api.23andme.com/3/profile/${id}/marker/rs4778138/`];

    // move later
  // var updatedUser = mongoose.model('updatedUser', UpdatedUserSchema);
  // var newUser = updatedUser({
  //     firstname: first_name,
  //     lastname: last_name,
  //     email: e_mail,
  //     acctid: acct_id,
  //     gender: sex,
  //     age: age,
  //     ethnicity: model_ethnicity,
  //     predicted_bmi: bmi
  //   });
  // newUser.save();
  // console.log('saved' + newUser);

  rp(geneticWeightReq)
    .then(function(body) {
      console.log('genetic weight got');
      console.log(JSON.stringify(body));
      console.log(body['details']['model_inputs']['sex']); // change from model_input later
      // sex = body['details']['model_inputs']['sex'];
      // age = body['details']['model_inputs']['age'];
      // model_ethnicity = body['details']['model_inputs']['model_ethnicity'];
      // bmi = body['summary']['predicted_bmi'];
      // console.log(eyecolor['variants'][0]['allele'], eyecolor['variants'][1]['allele']);
      //

      // if over half Asian or African, eyes are brown and hair is black. else -->
      rp(eyeColorReq)
        .then(function(eyecolorBody) { // determine eye color
          if ( eyecolorBody['variants'][0]['allele'] == "A" ) {
            eye_color = 'brown';
          } else if ( eyecolorBody['variants'][1]['allele']  == "A" ) {
            eye_color = 'brown';
          } else {
            eye_color = 'blue';
          }
          console.log(`eye color: ${eye_color}`);
        })

      // black hair ??
      rp( {
        uri: blackHairUris[0],
        headers: {Authorization: 'Bearer ' + token},
        json: true,
      }).then(function(blackHair0) {
        if (blackHair0['variants'][0]['allele'] == "A" && blackHair0['variants'][1]['allele'] == "A" ) {
          hair_color = 'black';
          console.log('hair is black');
        } else {
        rp( {
          uri: blackHairUris[1],
          headers: {Authorization: 'Bearer ' + token},
          json: true,
        }).then(function(blackHair1) {
          if (blackHair0['variants'][0]['allele'] == "C" && blackHair0['variants'][1]['allele'] == "C" ) {
            hair_color = 'black';
            console.log('hair is black');
          }
          // else --> hair not black
          console.log('hair is not black');
              });

            }
          })
        // if not black, check for red
      if ( hair_color != 'black') {
        rp( {
          uri: redHairUris[0],
          headers: {Authorization: 'Bearer ' + token},
          json: true,
        }).then(function(redHair0) {
          if (redHair0['variants'][0]['allele'] == "T" && redHair0['variants'][1]['allele'] == "T") {
            hair_color = 'red';
            console.log('hair is red');
          } else {
            rp( {
              uri: redHairUris[1],
              headers: {Authorization: 'Bearer ' + token},
              json: true,
            }).then(function(redHair1) {
              if (redHair1['variants'][0]['allele'] == "T" && redHair1['variants'][1]['allele'] == "T") {
                hair_color = 'red';
                console.log('hair is red');
              } else {
                rp( {
                  uri: redHairUris[2],
                  headers: {Authorization: 'Bearer ' + token},
                  json: true,
                }).then (function(redHair2) {
                  if (redHair2['variants'][0]['allele'] == "A" && redHair2['variants'][1]['allele'] == "A") {
                    hair_color = 'red';
                    console.log('hair is red');
                  } else {
                    console.log('hair is not red');
                  }
                })
              }
            })
          }
        })
      // if not red check for blonde
      }
      if (hair_color != 'red' && hair_color != 'black') {
        rp( {
          uri: blondeHairUris[0],
          headers: {Authorization: 'Bearer ' + token},
          json: true,
        }).then(function(blondeHair0) {
          if (blondeHair0['variants'][0]['allele'] == "T" && blondeHair0['variants'][1]['allele'] == "T") {
            hair_color = 'blonde';
            console.log('hair is blonde');
          } else {
            rp( {
              uri: blondeHairUris[1],
              headers: {Authorization: 'Bearer ' + token},
              json: true,
            }).then(function(blondeHair1) {
              if (blondeHair1['variants'][0]['allele'] == "T" && blondeHair1['variants'][1]['allele'] == "T") {
                hair_color = 'blonde';
                console.log('hair is blonde');
              } else {
                rp( {
                  uri: blondeHairUris[2],
                  headers: {Authorization: 'Bearer ' + token},
                  json: true,
                }).then(function(blondeHair2) {
                  if (blondeHair2['variants'][0]['allele'] == "A" && blondeHair2['variants'][1]['allele'] == "A") {
                    hair_color = 'blonde';
                    console.log('hair is blonde');
                  } else {
                    rp( {
                      uri: blondeHairUris[3],
                      headers: {Authorization: 'Bearer ' + token},
                      json: true,
                    }).then(function(blondeHair3) {
                      if (blondeHair3['variants'][0]['allele'] == "A" && blondeHair3['variants'][1]['allele'] == "A") {
                        console.log('hair is blonde');
                        hair_color = 'blonde';
                      } else {
                        console.log('hair is not blonde');
                        hair_color = 'brown';
                        console.log('hair is brown');
                      }
                    })
                  }
                })
              }
            })
          }
        })
      }
      console.log(hair_color);







    // .catch(function(err) {
    //   console.log(err);
    // })



    console.log(eye_color);

// good
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
        // res.render('/callback', {token: body.access_token}); // changed from res.redirect

      // GET from API -
        var getData = {
          uri: 'https://api.23andme.com/3/account/',
          // headers: {Authorization: 'Bearer ' + body.access_token},
          headers: {Authorization: 'Bearer demo_oauth_token'}, // DEMO ONLY
          json: true };
        var userID = "";
        rp(getData)
          .then(function(output) {
            console.log('GET worked');

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
