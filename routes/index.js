var express = require('express');
var router = express.Router();
const User = require('../models/user');
var request = require('request');
var rp = require('request-promise');

// landing page
router.get('/', function(req, res, next) {
  const currentUserId = req.session.userId;
  const currentUsername = req.session.username;
  console.log(currentUsername);
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

router.get('/callback', (req, res, next) => {
  console.log(req.query['code']);
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


if (!req.query.code) {
  console.log('error with code');
} else { // POST to API with request-promise
  console.log('attempting to post for token');
  rp(options)
    .then(function(body) {
      console.log('it worked');
      console.log(body);
      // res.redirect('/callback'+token, {token: body});
    })
    .catch(function(err) {
      console.log(err);
      res.redirect('/error'); //{error:err}
    })
    console.log('access token');
  // console.log(access_token);
}

  // myFunction().then(
  //   do some stuff
  // )
  // .catch((err) => {
  //   console.error(err)
  // })
//   exports.callback = function(req, res, scope){
//     if (!req.query.code) {
//         console.log('error with req.query.code');
//         res.render('error', {
//             client_id: process.env.CLIENT_ID,
//             scope: scope,
//             redirect_uri: process.env.REDIRECT_URI
//         });
//     } else {
//         // Exchange the code for a token,
//         // store it in the session, and redirect.
//         console.log('attempting to get token');
//         request.post({
//             url: 'https://api.23andme.com/token/',
//             form: {
//                 client_id: process.env.CLIENT_ID,
//                 client_secret: process.env.CLIENT_SECRET,
//                 grant_type: 'authorization_code',
//                 code: req.query.code,
//                 redirect_uri: process.env.REDIRECT_URI,
//                 scope: scope
//             },
//             json: true }, function(e, r, body) {
//                 if (!e && r.statusCode == 200) {
//                     res.cookie('access_token', body.access_token, {signed: true});
//                     res.redirect('/');
//                 } else {
//                     res.send(body);
//                 }
//             });
//           console.log('access token');
//           console.log(access_token);
//     }
// };
})

module.exports = router;
