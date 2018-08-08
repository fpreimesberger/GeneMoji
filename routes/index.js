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
  res.render('index', { title: 'GeneMoji' });
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
// get SNPslist
router.get('/SNPslist', (req, res, next) => {
  res.render('SNPslist');
})
// results res.redirect(`/results?hair=${hairQuery}&skin=${skinQuery}&eyecolor=${eyeQuery}&haircolor=${hairColorQuery}&age=${ageQuery}&freckles=${frecklesQuery}`);

router.get('/results', (req, res, next) => {
  var hairColor = req.query.haircolor;
  var eyeColor = req.query.eyecolor;
  var skinColor = req.query.skin;
  var freckles = req.query.freckles;
  var age = req.query.age;
  var hairStyle = req.query.hair;
  var frecklesBool = false;
  var blueEyesBool = false;
  var greenEyesBool = false;
  var oldBool = false;
  if (freckles == "freckles") { frecklesBool = true; }
  if (eyeColor == "blue") { blueEyesBool = true; }
  if (eyeColor == "green") { greenEyesBool = true; }
  if (age == 'old') { oldBool = true };

  res.render('results', {hairColor: hairColor, eyeColor: eyeColor, skinColor: skinColor, freckles: freckles, age: age, hairStyle: hairStyle, frecklesBool: frecklesBool, blueEyesBool: blueEyesBool, greenEyesBool: greenEyesBool, oldBool: oldBool});
})
// function goToResults(req, res) {
//   res.render('results', req.body);
// }

function retrieveAlleles(inputUri, token) {
  output = '';
  return rp({
      uri: inputUri,
      headers: {Authorization: 'Bearer ' + token},
      json: true,
    }).then((data) => {
      var one = (data['variants'][0]['allele']);
      var two = (data['variants'][1]['allele']);
      return [one, two];
    })}

function getGeneticWeight(geneticWeightReq) {
  var sex = 'a';
  var a_ge = 'a';
  var model_ethnicity = 'a';
  var predicted_bmi = 'a';
  return rp(geneticWeightReq)
    .then(function(body) {
   // change from model_input later
      sex = body['details']['model_inputs']['sex'];
      console.log(sex);
      a_ge = body['details']['model_inputs']['age'];
      model_ethnicity = body['details']['model_inputs']['model_ethnicity'];
      predicted_bmi = body['summary']['predicted_bmi'];
      // if over half Asian or African, eyes are brown and hair is black. else -->
      return [sex, a_ge, model_ethnicity, predicted_bmi];
    })
};

function getEyeColor(eyeColorReq) { // defunct
  var color = '';
  return rp(eyeColorReq)
    .then(function(eyecolorBody) { // determine eye color
      if ( eyecolorBody['variants'][0]['allele'] == "A" ) {
        color = 'brown';
      } else if ( eyecolorBody['variants'][1]['allele']  == "A" ) {
        color = 'brown';
      } else {
        color = 'blue';
      }
      return color;
    });
};

function getEyes8Plex(reqs8plex, token) {
  var eyeColor = "";
  var req0 = retrieveAlleles(reqs8plex[0], token); // rs12913832
  var req1 = retrieveAlleles(reqs8plex[1], token); // rs16891982
  var req2 = retrieveAlleles(reqs8plex[2], token); // rs12896399

  return Promise.all([req0, req1, req2]).then(function(res) {
    if (res[0][0] == "A" || res[0][1] == "A") { // not blue -> brown or green
       if (res[1][0] == "C" && res[1][1] == "C") {
        eyeColor = "green";
      } else {
        eyeColor = "brown";
      }
    // not brown -> blue or green
  } else if (res[1][0] == "C" && res[1][1] == "C") {
      eyeColor = "green";
    } else if (res[2][0] == "T" && res[2][1] == "T") {
      eyeColor = "blue";
    } else { // defaults to brown if fails
      eyeColor = "brown";
    }
  }).then((data) => {
    return eyeColor;
  })
}

function getHair(hairUris, token) {
  var hairFound = false;
  var hairColor = ''; //default
  var ans = ['A', 'C', 'T', 'T', 'A', 'T', 'T', 'A', 'A'];
  var colors = ['black', 'black', 'red', 'red', 'red', 'blonde', 'blonde', 'blonde', 'blonde'];

  var req0 = retrieveAlleles(hairUris[0], token);
  var req1 = retrieveAlleles(hairUris[1], token);
  var req2 = retrieveAlleles(hairUris[2], token);
  var req3 = retrieveAlleles(hairUris[3], token);
  var req4 = retrieveAlleles(hairUris[4], token);
  var req5 = retrieveAlleles(hairUris[5], token);
  var req6 = retrieveAlleles(hairUris[6], token);
  var req7 = retrieveAlleles(hairUris[7], token);
  var req8 = retrieveAlleles(hairUris[8], token);
  return Promise.all([req0, req1, req2, req3, req4, req5, req6, req7, req8]).then(function(res) {
    if (res[0][0] == ans[0] && res[0][1] == ans[0]) {
        hairColor = 'black';
      } else if (res[1][0] == ans[1] && res[1][1] == ans[1]) {
        hairColor = 'black';
      } else if (res[2][0] == ans[2] && res[2][1] == ans[2]) {
        hairColor = 'red';
      } else if (res[3][0] == ans[3] && res[3][1] == ans[3]) {
        hairColor = 'red';
      } else if (res[4][0] == ans[4] && res[4][1] == ans[4]) {
        hairColor = 'red';
      } else if (res[5][0] == ans[5] && res[5][1] == ans[5]) {
        hairColor = 'blonde';
      } else if (res[6][0] == ans[6] && res[6][1] == ans[6]) {
        hairColor = 'blonde';
      } else if (res[7][0] == ans[7] && res[7][1] == ans[7]) {
        hairColor = 'blonde';
      } else if (res[8][0] == ans[8] && res[8][1] == ans[8]) {
        hairColor = 'blonde';
      } else {
        hairColor = 'brown';
      }
  }).then( data => {
    return hairColor;
  })}

function getHairTexture(curlyHairUris, token) {
  var hair_curl_index = 0;
  var ans = ['G', 'T', 'T'];
  var hairTexture = '';

  var req0 = retrieveAlleles(curlyHairUris[0], token);
  var req1 = retrieveAlleles(curlyHairUris[1], token);
  var req2 = retrieveAlleles(curlyHairUris[2], token);
  return Promise.all([req0, req1, req2]).then(function(res) {
    if (res[0][0] == ans[0] && res[0][1] == ans[0]) {
        hair_curl_index+=2;
      } else if (res[0][0] == ans[0] || res[0][1] == ans[0]) {
        hair_curl_index++;
      }
    if (res[1][0] == ans[1] && res[1][1] == ans[1]) {
        hair_curl_index+=2;
      } else if (res[1][0] == ans[1] || res[1][1] == ans[1]) {
        hair_curl_index++;
      }
    if (res[2][0] == ans[2] && res[2][1] == ans[2]) {
        hair_curl_index+=2;
      } else if (res[2][0] == ans[2] || res[2][1] == ans[2]) {
        hair_curl_index++;
      }
      return hair_curl_index;
  }).then(data => {
    if (hair_curl_index > 2) {
      hairTexture = 'wavy';
    } else {
      hairTexture = 'straight';
    }
    return hairTexture;
  })
}

function getSkinTone(skinUris, token) {
  var skin_tone = "";
  var req0 = retrieveAlleles(skinUris[0], token); // rs1291382
  var req1 = retrieveAlleles(skinUris[1], token); // rs16891982
  var req2 = retrieveAlleles(skinUris[2], token); // rs1426654
  var req3 = retrieveAlleles(skinUris[3], token); // rs885479
  var req4 = retrieveAlleles(skinUris[4], token); // rs1426654
  var req5 = retrieveAlleles(skinUris[5], token); // rs1129038

  return Promise.all([req0, req1, req2, req3, req4, req5]).then(function(res) {
    console.log(`printing skin color promises ${res}`);
    if(res[0][0] == "G" && res[0][1] == "G" && res[1][0] == "G" && res[1][1] == "G" && res[2][0] == "A" && res[2][1] == "A") {
      skin_tone = "Light";
    } else if (res[3][0] == "A" && res[3][1] == "A") {
      skin_tone = "Tanned";
    } else if (res[4][0] == "G" && res[4][1] == "G" && res[5][0] == "G" && res[5][1] == "G") {
      skin_tone = "DarkBrown";
    } else {
      console.log("skin color falls to default");
      skin_tone = "Tanned";
    }
  }).then((data) => {
    return skin_tone;
  }).catch(function(err) {
    console.log(err);
    return "Brown";
  })
}

function getFrecklingIndex(frecklesUris, token) {
  var freckling_index = 0;
  var has_freckles = '';
  var ans = ['T', 'C'];

  var req1 = retrieveAlleles(frecklesUris[0], token);
  var req2 = retrieveAlleles(frecklesUris[1], token);
  return Promise.all([req1, req1]).then(function(res) {
    if (res[0][0] == ans[0] && res[0][1] == ans[0]) {
        freckling_index+=2;
      } else if (res[0][0] == ans[0] || res[0][1] == ans[0]) {
        freckling_index++;
      }
    if (res[1][0] == ans[0] && res[1][1] == ans[0]) {
        freckling_index+=2;
      } else if (res[1][0] == ans[0] || res[1][1] == ans[0]) {
        freckling_index++;
      }
    return freckling_index;
  }).then( data => {
    return freckling_index;
  })}


function getInfo(token, id, first_name, last_name, e_mail, acct_id) {
  return new Promise((resolve, reject) => {


  var sex = '';
  var a_ge = '';
  var model_ethnicity = '';
  var predicted_bmi = '';
  var eye_color = '';
  var hair_color = '';
  var hair_texture = '';
  var has_freckles = '';
  var skin_color = '';

  var output;

// REQUESTS
  var geneticWeightReq = {
    uri: `https://api.23andme.com/3/profile/${id}/report/genetic_weight/`, // + id + '/sex/ ',
    headers: {Authorization: 'Bearer ' + token},
    json: true, };
  var eyeColorReq = {
    uri: `https://api.23andme.com/3/profile/${id}/marker/rs12913832/`,
    headers: {Authorization: 'Bearer ' + token},
    json: true, };
  hairUris = [`https://api.23andme.com/3/profile/${id}/marker/rs12913832/`, `https://api.23andme.com/3/profile/${id}/marker/rs28777/`, `https://api.23andme.com/3/profile/${id}/marker/rs1805007/`, `https://api.23andme.com/3/profile/${id}/marker/rs1805008/`, `https://api.23andme.com/3/profile/${id}/marker/rs11547464/`, `https://api.23andme.com/3/profile/${id}/marker/rs35264875/`, `https://api.23andme.com/3/profile/${id}/marker/rs1129038/`, `https://api.23andme.com/3/profile/${id}/marker/rs7495174/`, `https://api.23andme.com/3/profile/${id}/marker/rs4778138/`];
  var curlyHairUris = [`https://api.23andme.com/3/profile/${id}/marker/rs17646946/`, `https://api.23andme.com/3/profile/${id}/marker/rs7349332/`, `https://api.23andme.com/3/profile/${id}/marker/rs11803731/`];
  var frecklesUris = [`https://api.23andme.com/3/profile/${id}/marker/rs1015362/`, `https://api.23andme.com/3/profile/${id}/marker/rs2153271/`]
  var uris8plex = [`https://api.23andme.com/3/profile/${id}/marker/rs12913832/`, `https://api.23andme.com/3/profile/${id}/marker/rs16891982/`, `https://api.23andme.com/3/profile/${id}/marker/rs12896399/`];
  var skinUris = [`https://api.23andme.com/3/profile/${id}/marker/rs12913832/`, `https://api.23andme.com/3/profile/${id}/marker/rs16891982/`, `https://api.23andme.com/3/profile/${id}/marker/rs1426654/`, `https://api.23andme.com/3/profile/${id}/marker/rs885479/`, `https://api.23andme.com/3/profile/${id}/marker/rs1426654/`, `https://api.23andme.com/3/profile/${id}/marker/rs1129038/`];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  var genWeightOutput = getGeneticWeight(geneticWeightReq).then((data) => {
    sex = data[0];
    a_ge = data[1];
    model_ethnicity = data[2];
    predicted_bmi = data[3];
    // var eye_color = getEyeColor(eyeColorReq); // update with 8 plex system
    var eye_color = getEyes8Plex(uris8plex, token);
    var freckle_index = getFrecklingIndex(frecklesUris, token);
    var hair_color = getHair(hairUris, token);
    var hair_texture = getHairTexture(curlyHairUris, token);
    var skin_color = getSkinTone(skinUris, token);
    return Promise.all([sex, a_ge, model_ethnicity, predicted_bmi, eye_color, hair_color, hair_texture, freckle_index, skin_color]);
  }).then(data => {
    console.log("TESTING", data);
    var has_freckles = '';
    if (data[7] > 2) {
      has_freckles = 'yes';
    } else { has_freckles = 'no'; }
      console.log(data);
      console.log(JSON.stringify(data));
      resolve(data);
    }).catch(function(err) {
      console.log(err);
      reject(err);
      //res.redirect('/error'); // this redirect does not work
    })

  });
};




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
      'scope': 'basic names report:all genomes ancestry phenotypes:read:sex'
    },
    json: true,
  };


// POST to API with request-promise, receive auth token and redirect
  if (!req.query.code) {
    console.log('error with code');
  } else {
    console.log('attempting to post for token');
    var myValue;
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
        return getData;
      }).then((data) => {
        return rp(data);
      }).then((data)=> {
        userID = data['data'][0]['id'];
        console.log('GET worked');
        console.log(data['data'][0]['id']);

    // getInfo(body.access_token, userID); //What the fuck
        console.log('aquiiiiiiiii');
        return getInfo('demo_oauth_token', 'demo_profile_id', 'Erin', 'Mendel', 'shit@fuck.com', 'demo_profile_id')
      }).then((data) => {
        console.log(`ffffffffffff ${data}`);
        // hair texture query
        var hairQuery = '';
        if (data[0] == 'female') {
          hairQuery = 'LongHair';
        } else {
          hairQuery = 'ShortHair';
        }
        if (data[6] == 'wavy' && data[0] == 'female') {
          hairQuery += 'Curvy'
        } else if (data[0] == 'female') {
          hairQuery += 'Straight2'
        } else if (data[6] == 'wavy' && data[0] == 'male') {
          hairQuery += 'ShortWaved'
        } else {
          hairQuery += 'ShortFlat'
        }
        // skin query
        var skinQuery = '';
        skinQuery = data[8];
        // eye color query
        var eyeQuery = data[4];
        // if (data[4] == 'blue') {
        //   eyeQuery = 'blue';
        // } else {
        //   eyeQuery = 'brown';
        // }
        // hair color query
        var hairColorQuery = '';
        if (data[5] == 'brown') {
          hairColorQuery = 'Brown';
        } else if (data[5] == 'blonde') {
          hairColorQuery = 'Blonde';
        } else if (data[6] == 'red') {
          hairColorQuery = 'Red';
        } else {
          hairColorQuery = 'Black';
        } // age query for wrinkles
        var ageQuery = '';
        if (data[1] > 50) {
          ageQuery = 'old';
        } else {
          ageQuery = 'young';
        }
        // freckles query
        var frecklesQuery = '';
        if (data[7] > 2) {
          frecklesQuery = 'freckles';
        } else {
          frecklesQuery = 'nofreckles';
        }
        console.log(`final hair texture ${hairQuery}`);
        console.log(`final skin color ${skinQuery}`);
        console.log(`final eye color ${eyeQuery}`);
        console.log(`final hair color ${hairColorQuery}`);
        console.log(`final age ${ageQuery}`);
        console.log(`final freckles ${frecklesQuery}`);
        // res.redirect('/results?hair=');
        res.redirect(`/results?hair=${hairQuery}&skin=${skinQuery}&eyecolor=${eyeQuery}&haircolor=${hairColorQuery}&age=${ageQuery}&freckles=${frecklesQuery}`);
      }).catch(function(err) {
        console.log(err);
        // res.redirect('/error'); //{error:err}
      });

  }
  // res.send
  // res.redirect("/results?")//, {data: [0]});
  // res.post('/results', {data: [0]});
})

module.exports = router;
