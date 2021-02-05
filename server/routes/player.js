
const express = require('express'),
  cookieParser = require('cookie-parser'),
  path = require('path'),
  router = express.Router();

router.use(cookieParser());

router.get('/wmusic', function (req, res) {
  res.sendFile(path.join(__basedir + '/views/players/player_wmusic.html'));
});

router.get('/wspotify', function (req, res) {
  res.sendFile(path.join(__basedir + '/views/players/player_wspotify.html'));
});

router.get('/spotify', function (req, res) {
  res.sendFile(path.join(__basedir + '/views/players/player_spotify.html'));
});

router.get('/youtube', function (req, res) {
  res.sendFile(path.join(__basedir + '/views/players/player_youtube.html'));
});

module.exports = router;