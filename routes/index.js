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
  email: {type: String, required: false },
  acctid: {type: String, required: false },
  gender: {type: String, required: false },
  age: {type: String, required: false },
  ethnicity: { type: String, required: false },
  pred_bmi: { type: String, required: false },
  eyecolor: { type: String, required: false },
  haircolor: { type: String, required: false },
  hairtexture: { type: String, required: false },
  freckles: { type: String, required: false }
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
  var a_ge = '';
  var model_ethnicity = '';
  var predicted_bmi = '';
  var eye_color = '';
  var hair_color = '';
  var hair_texture = '';
  var has_freckles = '';

  // REQUESTS
  var geneticWeightReq = {
    uri: `https://api.23andme.com/3/profile/${id}/report/genetic_weight/`, // + id + '/sex/ ',
    headers: {Authorization: 'Bearer ' + token},
    json: true, };
  var eyeColorReq = {
    uri: `https://api.23andme.com/3/profile/${id}/marker/rs12913832/`,
    headers: {Authorization: 'Bearer ' + token},
    json: true, };
  var blackHairUris = [`https://api.23andme.com/3/profile/${id}/marker/rs12913832/`, `https://api.23andme.com/3/profile/${id}/marker/rs28777/`]; // array of uris for blach hair
  var redHairUris = [`https://api.23andme.com/3/profile/${id}/marker/rs1805007/`, `https://api.23andme.com/3/profile/${id}/marker/rs1805008/`, `https://api.23andme.com/3/profile/${id}/marker/rs11547464/`];
  var blondeHairUris = [`https://api.23andme.com/3/profile/${id}/marker/rs35264875/`, `https://api.23andme.com/3/profile/${id}/marker/rs1129038/`, `https://api.23andme.com/3/profile/${id}/marker/rs7495174/`, `https://api.23andme.com/3/profile/${id}/marker/rs4778138/`];
  var curlyHairUris = [`https://api.23andme.com/3/profile/${id}/marker/rs17646946/`, `https://api.23andme.com/3/profile/${id}/marker/rs7349332/`, `https://api.23andme.com/3/profile/${id}/marker/rs11803731/`];
  var frecklesUris = [`https://api.23andme.com/3/profile/${id}/marker/rs1015362/`, `https://api.23andme.com/3/profile/${id}/marker/rs2153271/`]

  rp(geneticWeightReq)
    .then(function(body) {
   // change from model_input later
      sex = body['details']['model_inputs']['sex'];
      a_ge = body['details']['model_inputs']['age'];
      model_ethnicity = body['details']['model_inputs']['model_ethnicity'];
      predicted_bmi = body['summary']['predicted_bmi'];

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
          console.log(`eye color from Req ${eye_color}`);
        })

      // black hair ??
      rp( {
        uri: blackHairUris[0],
        headers: {Authorization: 'Bearer ' + token},
        json: true,
      }).then(function(blackHair0) {
        if (blackHair0['variants'][0]['allele'] == "A" && blackHair0['variants'][1]['allele'] == "A" ) {
          hair_color = 'black';
        } else {
        rp( {
          uri: blackHairUris[1],
          headers: {Authorization: 'Bearer ' + token},
          json: true,
        }).then(function(blackHair1) {
          if (blackHair0['variants'][0]['allele'] == "C" && blackHair0['variants'][1]['allele'] == "C" ) {
            hair_color = 'black';
          }
          // else --> hair not black
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
          } else {
            rp( {
              uri: redHairUris[1],
              headers: {Authorization: 'Bearer ' + token},
              json: true,
            }).then(function(redHair1) {
              if (redHair1['variants'][0]['allele'] == "T" && redHair1['variants'][1]['allele'] == "T") {
                hair_color = 'red';
              } else {
                rp( {
                  uri: redHairUris[2],
                  headers: {Authorization: 'Bearer ' + token},
                  json: true,
                }).then (function(redHair2) {
                  if (redHair2['variants'][0]['allele'] == "A" && redHair2['variants'][1]['allele'] == "A") {
                    hair_color = 'red';
                  } // else, hair is not red
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
          } else {
            rp( {
              uri: blondeHairUris[1],
              headers: {Authorization: 'Bearer ' + token},
              json: true,
            }).then(function(blondeHair1) {
              if (blondeHair1['variants'][0]['allele'] == "T" && blondeHair1['variants'][1]['allele'] == "T") {
                hair_color = 'blonde';
              } else {
                rp( {
                  uri: blondeHairUris[2],
                  headers: {Authorization: 'Bearer ' + token},
                  json: true,
                }).then(function(blondeHair2) {
                  if (blondeHair2['variants'][0]['allele'] == "A" && blondeHair2['variants'][1]['allele'] == "A") {
                    hair_color = 'blonde';
                  } else {
                    rp( {
                      uri: blondeHairUris[3],
                      headers: {Authorization: 'Bearer ' + token},
                      json: true,
                    }).then(function(blondeHair3) {
                      if (blondeHair3['variants'][0]['allele'] == "A" && blondeHair3['variants'][1]['allele'] == "A") {
                        hair_color = 'blonde';
                      } else {
                        hair_color = 'brown';
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
    var hair_curl_index = 0;
    if (hair_curl_index === 0) {
      rp({
        uri: curlyHairUris[0],
        headers: {Authorization: 'Bearer ' + token},
        json: true,
      }).then(function(curlyHair0) {
        if (curlyHair0['variants'][0]['allele'] == "G" && curlyHair0['variants'][1]['allele'] == "G") {
          hair_curl_index+=2;
        } else if (curlyHair0['variants'][0]['allele'] == "G" || curlyHair0['variants'][1]['allele'] == "G") {
          hair_curl_index+=1;
        } })
      rp({
        uri: curlyHairUris[1],
        headers: {Authorization: 'Bearer ' + token},
        json: true,
      }).then(function(curlyHair1) {
        if (curlyHair1['variants'][0]['allele'] == "T" && curlyHair1['variants'][1]['allele'] == "T") {
          hair_curl_index+=2;
        } else if (curlyHair1['variants'][0]['allele'] == "T" || curlyHair1['variants'][1]['allele'] == "T") {
          hair_curl_index+=1;
        }})
      rp({
        uri: curlyHairUris[2],
        headers: {Authorization: 'Bearer ' + token},
        json: true,
        }).then(function(curlyHair2) {
          if (curlyHair2['variants'][0]['allele'] == "T" && curlyHair2['variants'][1]['allele'] == "T") {
            hair_curl_index+=2;
          } else if (curlyHair2['variants'][0]['allele'] == "T" || curlyHair2['variants'][1]['allele'] == "T") {
            hair_curl_index+=1;
          }
          if (hair_curl_index < 3) {
            hair_texture = 'straight';
          } else if (hair_curl_index < 6) {
            hair_texture = 'wavy';
          } else {
            hair_texture = 'curly';
          }
          console.log(`hair index ${hair_curl_index}`);
          console.log(`hair texture ${hair_texture}`);
        })
    }



    var freckling_index = 0;
    rp({
      uri: frecklesUris[0],
      headers: {Authorization: 'Bearer ' + token},
      json: true,
    }).then(function(freckles0) {
      if (freckles0['variants'][0]['allele'] == "T" && freckles0['variants'][1]['allele'] == "T") {
        freckling_index+=2;
      } else if ( freckles0['variants'][0]['allele'] == "T" || freckles0['variants'][1]['allele'] == "T" ) {
        freckling_index+=1;
      }
    })
    rp({
      uri: frecklesUris[1],
      headers: {Authorization: 'Bearer ' + token},
      json: true,
    }).then(function(freckles1) {
      if (freckles1['variants'][0]['allele'] == "C" && freckles1['variants'][1]['allele'] == "C") {
        freckling_index+=2;
      } else if (freckles1['variants'][0]['allele'] == "C" || freckles1['variants'][1]['allele'] == "C") {
        freckling_index+=1;
      }

      if ( freckling_index > 2 ) {
        has_freckles = 'yes';
      } else {
        has_freckles = 'no';
      }
      console.log(`freckling index ${freckling_index}`);
      console.log(`freckles ${has_freckles}`);
      console.log(`output ${sex} ${hair_color} ${eye_color}`);
    })
    // .catch(function(err) {
    //   console.log(err);
    // })


}).then(function(what) {
  var updatedUser = mongoose.model('updatedUser', UpdatedUserSchema);
  var newUser = updatedUser({
      firstname: first_name,
      lastname: last_name,
      email: e_mail,
      acctid: acct_id,
      gender: sex,
      age: a_ge,
      ethnicity: model_ethnicity,
      pred_bmi: predicted_bmi,
      eyecolor: eye_color,
      haircolor: hair_color,
      hairtexture: hair_texture,
      freckles: has_freckles
    });
  newUser.save();
  console.log('saved' + newUser);
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
