var express = require('express');
var router = express.Router();
var Bluebird = require('bluebird');
var request = require('request');
var rp = require('request-promise');

// landing page
router.get('/', function(req, res, next) {
  res.render('index', { title: 'GeneMoji', redirect_uri: process.env.REDIRECT_URI, client_id: process.env.CLIENT_ID });
});

// list of data pulled
router.get('/SNPslist', (req, res, next) => {
  res.render('SNPslist');
})

// render results once user has connected their account
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
  var email = process.env.EMAIL;

  res.render('results', {hairColor: hairColor, eyeColor: eyeColor, skinColor: skinColor, freckles: freckles, age: age, hairStyle: hairStyle, frecklesBool: frecklesBool, blueEyesBool: blueEyesBool, greenEyesBool: greenEyesBool, oldBool: oldBool, email: email});
})

// retrieve both alleles for a particular SNP
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
      a_ge = body['details']['model_inputs']['age'];
      model_ethnicity = body['details']['model_inputs']['model_ethnicity'];
      predicted_bmi = body['summary']['predicted_bmi'];
      return [sex, a_ge, model_ethnicity, predicted_bmi];
    })
};

// returns whether eyes are brown, blue or green based on 8-plex system (missing 2 SNPs)
// https://www.researchgate.net/profile/Mechthild_Prinz/publication/239525268/figure/fig2/AS:203143125180417@1425444503187/Schematic-representation-of-the-eye-color-predictor-8-plex-system-Step-1-eye-color-is.png
function getEyes8Plex(reqs8plex, token) {
  var eyeColor = "";
  var req0 = retrieveAlleles(reqs8plex[0], token); // rs12913832
  var req1 = retrieveAlleles(reqs8plex[1], token); // rs16891982
  var req2 = retrieveAlleles(reqs8plex[2], token); // rs12896399

  return Promise.all([req0, req1, req2]).then(function(res) {
    if (res[0][0] == "A" || res[0][1] == "A") { // not blue -> brown or green
       if (res[1][0] == "C" || res[1][1] == "C") {
        eyeColor = "green";
      } else {
        eyeColor = "brown";
      }
    // not brown -> blue or green
  } else if (res[1][0] == "C" || res[1][1] == "C") {
      eyeColor = "green";
    } else if (res[2][0] == "T" || res[2][1] == "T") {
      eyeColor = "blue";
    } else { // defaults to brown if fails
      eyeColor = "brown";
    }
  }).then((data) => {
    return eyeColor;
  }).catch(function(err) {
    console.log(err);
    return "brown";
  })
}

// returns probable hair color based off of popular variants
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
  }).catch(function(err) {
    console.log(err);
    return "brown";
  })
}

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
  }).catch(function(err) {
    console.log(err);
    return "straight";
  })
}

// returns probably skin tone based on the 8-plex system
function getSkinTone(skinUris, token) {
  var skin_tone = "";
  var req0 = retrieveAlleles(skinUris[0], token); // rs1291382
  var req1 = retrieveAlleles(skinUris[1], token); // rs16891982
  var req2 = retrieveAlleles(skinUris[2], token); // rs1426654
  var req3 = retrieveAlleles(skinUris[3], token); // rs885479
  var req4 = retrieveAlleles(skinUris[4], token); // rs1426654
  var req5 = retrieveAlleles(skinUris[5], token); // rs1129038

  return Promise.all([req0, req1, req2, req3, req4, req5]).then(function(res) {
    if(res[0][0] == "G" && res[0][1] == "G" && res[1][0] == "G" && res[1][1] == "G" && res[2][0] == "A" && res[2][1] == "A") {
      skin_tone = "Pale";
    } else if (res[3][0] == "A" && res[3][1] == "A") {
      skin_tone = "Tanned";
    } else if (res[4][0] == "G" && res[4][1] == "G" && res[5][0] == "G" && res[5][1] == "G") {
      skin_tone = "DarkBrown";
    } else {
      skin_tone = "Light";
    }
  }).then((data) => {
    return skin_tone;
  }).catch(function(err) {
    console.log(err);
    return "Tanned";
  })
}

// returns freckling index based on variants at 2 SNPs
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
  }).catch(function(err) {
    console.log(err);
    return 0;
  })
}


function getInfo(id, token) {
  return new Promise((resolve, reject) => {

// REQUESTS with SNPs
  var geneticWeightReq = {
    uri: `https://api.23andme.com/3/profile/${id}/report/genetic_weight/`, // + id + '/sex/ ',
    headers: {Authorization: 'Bearer ' + token},
    json: true, };
  var eyeColorReq = {
    uri: `https://api.23andme.com/3/profile/${id}/marker/rs12913832/`,
    headers: {Authorization: 'Bearer ' + token},
    json: true, };
  var hairUris = [`https://api.23andme.com/3/profile/${id}/marker/rs12913832/`, `https://api.23andme.com/3/profile/${id}/marker/rs28777/`, `https://api.23andme.com/3/profile/${id}/marker/rs1805007/`, `https://api.23andme.com/3/profile/${id}/marker/rs1805008/`, `https://api.23andme.com/3/profile/${id}/marker/rs11547464/`, `https://api.23andme.com/3/profile/${id}/marker/rs35264875/`, `https://api.23andme.com/3/profile/${id}/marker/rs1129038/`, `https://api.23andme.com/3/profile/${id}/marker/rs7495174/`, `https://api.23andme.com/3/profile/${id}/marker/rs4778138/`];
  var curlyHairUris = [`https://api.23andme.com/3/profile/${id}/marker/rs17646946/`, `https://api.23andme.com/3/profile/${id}/marker/rs7349332/`, `https://api.23andme.com/3/profile/${id}/marker/rs11803731/`];
  var frecklesUris = [`https://api.23andme.com/3/profile/${id}/marker/rs1015362/`, `https://api.23andme.com/3/profile/${id}/marker/rs2153271/`]
  var uris8plex = [`https://api.23andme.com/3/profile/${id}/marker/rs12913832/`, `https://api.23andme.com/3/profile/${id}/marker/rs16891982/`, `https://api.23andme.com/3/profile/${id}/marker/rs12896399/`];
  var skinUris = [`https://api.23andme.com/3/profile/${id}/marker/rs12913832/`, `https://api.23andme.com/3/profile/${id}/marker/rs16891982/`, `https://api.23andme.com/3/profile/${id}/marker/rs1426654/`, `https://api.23andme.com/3/profile/${id}/marker/rs885479/`, `https://api.23andme.com/3/profile/${id}/marker/rs1426654/`, `https://api.23andme.com/3/profile/${id}/marker/rs1129038/`];

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
    var has_freckles = '';
    if (data[7] > 2) {
      has_freckles = 'yes';
    } else { has_freckles = 'no'; }
      resolve(data);
    }).catch(function(err) {
      console.log(err);
      reject(err);
    })

  });
};

// get token after user connects their 23andMe acct
router.get('/callback', (req, res, next) => {
  var options = {
    method: 'POST',
    uri: 'https://api.23andme.com/token/',
    form: {
      'client_id': process.env.CLIENT_ID,
      'client_secret': process.env.CLIENT_SECRET,
      'grant_type': 'authorization_code',
      'code': req.query.code,
      'redirect_uri': process.env.REDIRECT_URI,
      'scope': 'basic names report:all genomes ancestry phenotypes:read:sex'
    },
    json: true,
  };

// POST to API with request-promise, receive auth token and redirect
  if (!req.query.code) {
    console.log('error posting for token');
  } else {
    var myValue;
    rp(options)
      .then(function(body) {

      // get userId from API
        var getData = {
          uri: 'https://api.23andme.com/3/account/',
          headers: {Authorization: 'Bearer ' + body.access_token},
          // headers: {Authorization: 'Bearer demo_oauth_token'}, // DEMO ONLY
          json: true };

        rp(getData).then((id_data) => {
          return [id_data, body.access_token];
        }).then((data) => {
          return getInfo(data[0]['data'][0]['profiles'][0]['id'], data[1]); 

          // return getInfo('demo_profile_id', 'demo_oauth_token'); // DEMO ONLY
        }).then((data) => {
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
            }
            // age query for wrinkles
            var ageQuery = '';
            if (data[1] > 45) {
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
            // redirect to results and avatar
            res.redirect(`/results?hair=${hairQuery}&skin=${skinQuery}&eyecolor=${eyeQuery}&haircolor=${hairColorQuery}&age=${ageQuery}&freckles=${frecklesQuery}`);
        }).catch(function(err) {
          console.log(err);
          res.redirect('/error');
        })
      });
  }
})

module.exports = router;
