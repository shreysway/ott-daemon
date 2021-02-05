let express = require('express');
let request = require('request');
let config = require(__base + 'config.json');
let cookieParser = require('cookie-parser');
let logger = require(__base + 'components/logger');
let router = express.Router();
let net = require('net');
let moment = require('moment');

router.use(cookieParser());

let wspotifyWebClients = [];
let client_id = config.wspotify.client_id; // Your client id
let client_secret = config.wspotify.client_secret; // Your secret
let redirect_uri = config.wspotify.redirect_uri; // Your redirect uri
let refreshTokenInterval = false;
let playTrackQueue = false;

let wspotify = {
    onConnect: (socket) => {
        wspotifyWebClients.push(socket);

        socket.on('disconnect', () => {
            let socketIndex = wspotifyWebClients.indexOf(socket);
            if (socketIndex >= 0) {
                wspotifyWebClients.splice(socketIndex, 1);
            }
        });

        logger.debug("process.env.wspotify", process.env.wspotify);
        if (process.env.wspotify) {
            let wspotifyDetail = JSON.parse(process.env.wspotify);
            if (wspotifyDetail.access_token) {
                wspotifyWebClients.forEach((singleClient) => {
                    singleClient.emit('startPlayer', {
                        status: true,
                        message: "Access token available",
                        data: {
                            access_token: wspotifyDetail.access_token
                        },
                        response_tag: 0
                    });
                });
            }
        }

        socket.on('playerReady', (data) => {
            logger.debug("Player connected");
            process.env.wspotify_playerId = data.device_id;
            logger.debug("Check tracks queue");
            if (playTrackQueue) {
                logger.debug("Track found in queue", playTrackQueue);
                logger.debug("Play queue track");
                wspotify.playTrack(playTrackQueue, (response) => { 
                    logger.debug("Playtrack response:", response);
                });
                playTrackQueue = false;
            }
        });

        socket.on('playerOffline', (data) => {
            logger.debug("Player offline", data);
            sendToiPad("playerOffline", {}, data);
        });

        socket.on("trackPlayed", (trackDetail) => {
            logger.debug("trackPlayed", trackDetail);
            trackDetail.hotel_id = process.env.wspotify_hotelId;
            sendToiPad("trackPlayed", {}, trackDetail);
        });

        socket.on('nextTrack', () => {
            wspotify.nextTrack();
        });

        socket.on('playerError', (errorObj) => {
            logger.error("playerError", errorObj);
            sendToiPad(errorObj.type, errorObj);
        })
    },

    playTrack: (trackDetail, callabck) => {
        logger.info("typeof process.env.wspotify_playerId", typeof process.env.wspotify_playerId);
        logger.info("process.env.wspotify_playerId",process.env.wspotify_playerId);

        if(process.env.wspotify){
            let wspotifyDetail = JSON.parse(process.env.wspotify);
            if(wspotifyDetail.access_token){
                if (process.env.wspotify_playerId == 'false') {
                    logger.debug("Player not connected first connect player");
                    logger.debug("Save track detail in queue");
                    playTrackQueue = trackDetail;
                    wspotifyWebClients.forEach((singleClient) => {
                        singleClient.emit('connectPlayer');
                    });
                    return null;
                }
                if (trackDetail.track_id && trackDetail.hotel_id) {
                    process.env.wspotify_hotelId = trackDetail.hotel_id;
                    let url = 'https://api.spotify.com/v1/me/player/play?device_id=' + process.env.wspotify_playerId;
                    var options = {
                        url: url,
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + wspotifyDetail.access_token,
                        },
                        body: JSON.stringify({
                            // "context_uri": trackId,
                            "uris": ["spotify:track:" + trackDetail.track_id],
                            "position_ms": 0
                        })
                    };

                    wspotifyWebClients.forEach((singleClient) => {
                        singleClient.emit('playTrack',{
                            latitude: trackDetail.latitude,
                            longitude: trackDetail.longitude
                        });
                    });
                    request.put(options, function (error, response, body) {
                        logger.debug("playTrack response.statusCode", response.statusCode);
                        if (!error && (response.statusCode === 200 || response.statusCode === 204)) {
                            if (typeof callabck == "function") {
                                callabck(body);
                            }
                        } else {
                            sendToiPad('playTrackFailed', {
                                type: 'apiError',
                                statusCode: response.statusCode,
                                body: body,
                                error: error
                            });
                            logger.debug("playTrack response", JSON.stringify(response));
                            logger.debug("playTrack body", body);
                            logger.error("playTrack error", error);
                        }
                    });
                }else{
                    logger.debug("playTrack trackDetail", trackDetail);
                    sendToiPad('invalideTrack', {}, trackDetail);
                }
            } else {
                logger.debug("playTrack authentication detail not available", wspotifyDetail);
                sendToiPad('notAuthorized');
            }
        }
    },

    updateTokenAT: (data) => {
        logger.info("getAccessToken client_id:", client_id);
        logger.info("getAccessToken client_secret:", client_secret);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
              code: code,
              redirect_uri: redirect_uri,
              grant_type: 'authorization_code'
            },
            headers: {
              'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };
      
        request.post(authOptions, function (error, response, body) {
            logger.debug(response.statusCode);
            logger.debug("body", body);
            if (!error && response.statusCode === 200) {
                logger.debug("response body", body);
                let access_token = body.access_token,
                    expires_in = body.expires_in,
                    refresh_token = body.refresh_token;
                
                let expires_at = moment().add(expires_in, 'seconds');
                
                logger.debug("expires_at", expires_at.format());

                process.env.wspotify = JSON.stringify({
                    access_token: access_token,
                    refresh_token: refresh_token,
                    expires_at: expires_at.format()
                });
                if (!refreshTokenInterval) {
                    refreshTokenInterval = setInterval(refreshToken, 5000);
                }
                sendToiPad('authenticationSuccess');
                wspotifyWebClients.forEach((singleClient) => {
                    singleClient.emit('startPlayer', {
                        status: true,
                        message: "Access token generated start player",
                        data: {
                            access_token: access_token,
                            refresh_token: refresh_token
                        },
                        response_tag: 0
                    });
                });
            } else {
                sendToiPad('tokenValidationFailed', {
                    type: 'apiError',
                    statusCode: response.statusCode,
                    body: body,
                    error: error
                });
                logger.error("get access token error", error);
            }
        });
    },

    destroyPlayer: (eventType) => {
        logger.info("destroyPlayer refreshTokenInterval", refreshTokenInterval)
        if (refreshTokenInterval) {
            clearInterval(refreshTokenInterval);
        }
        process.env.wspotify = JSON.stringify({
            access_token: false,
            refresh_token: false
        });
        playTrackQueue = false;
        process.env.wspotify_hotelId = false;
        process.env.wspotify_playerId = false;
        wspotifyWebClients.forEach((singleClient) => {
            singleClient.emit('destroyPlayer');
        });
        sendToiPad(eventType);
    },

    stopPlayer: () => {
        logger.info("stopPlayer")
        playTrackQueue = false;
        process.env.wspotify_playerId = false;
        wspotifyWebClients.forEach((singleClient) => {
            singleClient.emit('stopPlayer');
        });
        sendToiPad('playerStopped');
    },

    nextTrack: (data) => {
        process.env.wspotify_hotelId = data.hotel_id;
        nextTrack();
    }
}

let nextTrack = () => {
    let authToken = config.wspotify.graphql_token;
    logger.info("nextTrack", authToken);
    authToken = Buffer.from(authToken).toString('base64')
    logger.info("nextTrack base64", authToken);

    let hotelId = process.env.wspotify_hotelId;
    logger.debug("hotelId", hotelId);

    let options = {
        method: 'POST',
        url: 'https://global.wapi.co/graphql',
        headers: {
            'Authorization': 'Basic ' + authToken,
            'Content-Type': 'application/json'
        },
        body: {
            query: '{ hotel(id: ' + hotelId + ') { name, id, soundZone { nowPlaying { track { id, name, spotifyId } } } } }'
        },
        json: true
    };
    request(options, (error, response, body) => {
        if (!error) {
            logger.debug("nextTrack body", JSON.stringify(body));
            logger.debug("nextTrack response.statusCode", response.statusCode);
            if (response.statusCode === 200) {
                try {
                    let hotelId = body.data.hotel.id;
                    let trackDetail = body.data.hotel.soundZone.nowPlaying.track;
                    wspotify.playTrack({
                        track_id: trackDetail.wspotifyId,
                        hotel_id: hotelId
                    }, (response) => {
                        logger.debug("play nextTrack reponse", response);
                    });
                } catch (e) {
                    logger.error("Next track parsing error:", e);
                }
            }
        } else {
            logger.error("get nextTrack Error:", error);
        }
    });
}

let sendToiPad = (type, error = {}, detail = {}) => {
    var client = new net.Socket();
    client.connect(config.server.pkg_port, config.server.host, function () {
        logger.debug('Connected');
        let dataToSend = {
            "timestamp": moment().unix(),
            "command": {
                "feature": "onlineMusic",
                "operation": "updateAudioMetaData",
                "details": {
                    "type": "wSpotify",
                    "metaData": {
                        "operationType": type,
                        "error": error,
                        "detail": detail
                    }
                }
            },
            "deviceId": "23"
        };
        try {
            client.write(JSON.stringify(dataToSend));
            client.destroy();
        } catch (e) {
            logger.error("sendToiPad Error", e);
        }
    });
    client.on('close', function () {
        logger.info('Connection closed');
    });
    client.on('error', function (err) {
        logger.error("Error: " + err.message);
    });
}

let refreshToken = () => {
    logger.debug("refreshToken called");
    if (process.env.wspotify) {
        let wspotifyDetail = JSON.parse(process.env.wspotify);
        logger.debug("Current time", moment().format());
        logger.debug("Expire time", wspotifyDetail.expires_at);
        let expireDiff = moment(wspotifyDetail.expires_at).diff(moment(), 'minutes');
        logger.debug("expireDiff", expireDiff);
        if (expireDiff <= 5 && wspotifyDetail.refresh_token) {
            let refresh_token = wspotifyDetail.refresh_token;
            let authOptions = {
                url: 'https://accounts.spotify.com/api/token',
                headers: { 'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')) },
                form: {
                    grant_type: 'refresh_token',
                    refresh_token: refresh_token
                },
                json: true
            };
            request.post(authOptions, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    logger.debug("refreshToken body", body);

                    let access_token = body.access_token,
                        expires_in = body.expires_in,
                        refresh_token = body.refresh_token;
                        expires_at = moment().add(expires_in, 'seconds');
                    
                    logger.debug("expires_at", expires_at.format());
                    process.env.wspotify = JSON.stringify({
                        access_token: access_token,
                        refresh_token: refresh_token,
                        expires_at: expires_at.format()
                    });
                } else {
                    sendToiPad('refreshTokenFailed', {
                        type: 'apiError',
                        statusCode: response.statusCode,
                        body: body,
                        error: error
                    });
                    logger.error("refresh access token error", error);
                }
            });
        }
    }
}

module.exports = wspotify;