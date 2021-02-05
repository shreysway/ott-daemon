(function () {
  'use strict';
  global.__basedir = __dirname;
  global.__base = __dirname + '/';

const express = require('express'),
    app = express(),
    config = require('./config.json'),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    path = require("path"),
    net = require('net'),
    fs = require('fs'),
    cookieParser = require('cookie-parser'),
    socketServer = require('./components/socketServer'),
    netflix = require('./components/netflix'),
    youku = require('./components/youku'),
    amazon = require('./components/amazon'),
    hulu = require('./components/hulu'),
    iqiyi = require('./components/iqiyi'),
    hotstar = require('./components/hotstar'),
    YouTube = require('./components/YouTube'),
    inRoomExperience = require('./components/inRoomExperience'),
    logger = require(__base + 'components/logger'),
    host = config.server.host,
    port = config.server.port,
    tcpPort = config.socket.port;

  if (!fs.existsSync('./logs/')) {
    try {
      fs.mkdirSync('./logs/');
    } catch(err) {
      console.log("Error in creating dir: ./logs", err);
    }
  }

  // --------------------------------------------------------------------------------------
  // Routes
  var playerRouter = require('./routes/player');
  app.use('/player', playerRouter);
  // --------------------------------------------------------------------------------------

  app.use(express.static(path.join(__dirname))).use(cookieParser());

  // Netflix web client IO
  const netflixIO = io.of('netflix');
  netflixIO.on('connection', netflix.onConnect);

  // Youku web client IO
  const youkuIO = io.of('youku');
  youkuIO.on('connection', youku.onConnect);

  // Amazon Prime web client IO
  const amazonIO = io.of('amazon');
  amazonIO.on('connection', amazon.onConnect);

  // Hulu web client IO
  const huluIO = io.of('hulu');
  huluIO.on('connection', hulu.onConnect);

  // Iqiyi web client IO
  const iqiyiIO = io.of('iqiyi');
  iqiyiIO.on('connection', iqiyi.onConnect);

  // Hotstar web client IO
  const hotstarIO = io.of('hotstar');
  hotstarIO.on('connection', hotstar.onConnect);

  // Spotify web client IO
  const inRoomExperienceIO = io.of('inRoomExperience');
  inRoomExperienceIO.on('connection', inRoomExperience.onUIConnect);

  // YouTube web client IO
  const youtubeIO = io.of('youTube');
  const youtube = new YouTube;
  youtubeIO.on('connection', youtube.onConnect.bind(youtube));

  // Create Server instance
  global.socketServer = socketServer;
  socketServer.youtube = youtube;
  const tcpService = net.createServer(socketServer.onConnect);
  tcpService.listen(tcpPort, host, () => {
    logger.info('socket server listening on %j', tcpService.address());
  });

  app.get('/', (req, res) => {
    let reqHeaders = req.headers['user-agent'];
    logger.info("reqHeaders:", reqHeaders);
    res.sendFile(path.join(__dirname + '/views/default/index.html'));
  });

  var server = http.listen(port, () => {
    logger.info('ott server listening on port ' + server.address().port);
  });

  logger.debug('ott node service');
  module.exports = server;
}());
