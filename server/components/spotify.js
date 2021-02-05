const request = require('request'),
    config = require(__base + 'config.json'),
    logger = require(__base + 'components/logger');

let spotifyToken = null,
    startPlayerQueue = null,
    spotifyPlayerId = false,
    wspotifyHotelId = false,
    spotifyRoomName = '',
    playTrackQueue = false,
    playListQueue = false,
    deviceNFRestartP = true,
    spotifyModule = null;

const spotify = {
    startPlayer: (spModule, data, uiClients) => {
        deviceNFRestartP = true;
        logger.debug("Start player called");
        if (data) {
            spotifyToken = data.access_token;
            spotifyRoomName = data.roomname;
            spotifyModule = spModule;
        }
        
        logger.debug("Checking auth detail before starting player");
        if (!spotifyToken) {
            logger.debug("Auth detail not available");
            logger.debug("Aborted player start");
            return false;
        }
        logger.debug("Check for webUI clients or queue");
        logger.info("Start player queue", startPlayerQueue);
        if (uiClients.length) {
            logger.debug("If webUI connected then start player");
            for (let client of uiClients) {
                logger.debug("Sending message to webUI clients to start player");
                client.emit("startPlayer", {
                    access_token: spotifyToken,
                    roomname: spotifyRoomName,
                    module: spotifyModule
                });
            }
            startPlayerQueue = null;
        } else {
            logger.debug("If webUI not connected then queue command");
            startPlayerQueue = data;
        }
    },

    restartPlayer: (uiClients) => {
        logger.info("Restart player called");
        if (uiClients.length) {
            logger.debug("If webUI connected then restart player");
            for (let client of uiClients) {
                logger.debug("Sending message to webUI clients to restart player");
                client.emit("startPlayer", {
                    access_token: spotifyToken,
                    roomname: spotifyRoomName,
                    module: spotifyModule
                });
            }
        } else {
            logger.debug("Restart player If webUI not connected");
        }
    },

    playerReady: (spModule, uiClients) => {
        logger.debug("When player ready check for play queue");
        if (playTrackQueue) {
            logger.debug("Play queue available then play the queue");
            setTimeout(() => {
                logger.debug("Play queue after 2sec.");
                spotify.playSpotify(spModule, playTrackQueue, uiClients);
                playTrackQueue = null;
            }, 2000);
        } else {
            logger.debug("Player queue not available");
        }
    },

    updateAccessToken: (spModule, data, uiClients) => {
        logger.debug("Updating access token");
        spotifyToken = data.access_token;
        for (let client of uiClients) {
            logger.debug("Sending message to webUI clients to update token");
            client.emit("updateAccessToken", data);
        }
    },

    setPlayerId: (playerId) => { 
        logger.debug("saving player id", playerId);
        spotifyPlayerId = playerId;
    },

    playPlaylist: (spModule, trackDetail, uiClients) => {
        if (trackDetail.playlist_id){
            playTrackBody = {
                "context_uri": trackDetail.playlist_id,
                "position_ms": 0
            }
            logger.info("Call play spotify for spotify");
            spotify.playSpotify(spModule, playTrackBody, uiClients);
        } else {
            socketServer.sendToPKG("invalideTrack", trackDetail, "Invalide playlist detail", spModule.toLocaleLowerCase());
        }
    },

    playTrack: (spModule, trackDetail, uiClients) => {
        wspotifyHotelId = trackDetail.hotel_id;
        if (trackDetail.track_id) {
            playTrackBody = {
                "uris": ["spotify:track:" + trackDetail.track_id],
                "position_ms": 0
            }
            logger.info("Notify ui clients to update globe position");
            for (let client of uiClients) {
                client.emit('playTrack', {
                    wspotifyHotelId: wspotifyHotelId,
                    module: spModule,
                    latitude: trackDetail.latitude,
                    longitude: trackDetail.longitude
                });
            }
            logger.info("Call play spotify for wspotify");
            spotify.playSpotify(spModule, playTrackBody, uiClients);
        } else {
            logger.debug("WSpotify: Invalide track!");
            logger.debug("WSpotify: trackDetail", trackDetail);            
            logger.debug("Sending invalide track detail to PKG");
            socketServer.sendToPKG("invalideTrack", trackDetail, "Invalide track detail", spModule.toLocaleLowerCase());
        }
    },

    playSpotify: (spModule, playTrackBody, uiClients) => {
        // deviceNFRestartP = true;
        logger.info("Checking for accessToken");
        if (spotifyToken) {
            logger.info("Access token available");
            logger.info("Checking player connected or not");

            if (!spotifyPlayerId) {
                logger.debug("Player not connected first connect player");
                logger.debug("Save track detail in queue");
                playTrackQueue = playTrackBody;
                for(let client of uiClients){
                    client.emit('startPlayer', {
                        access_token: spotifyToken,
                        roomname: spotifyRoomName,
                        module: spModule
                    });
                };
                return true;
            }

            logger.info("Player connected.");
            if(playTrackBody){
                let url = 'https://api.spotify.com/v1/me/player/play?device_id=' + spotifyPlayerId;
                var options = {
                    url: url,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + spotifyToken,
                    },
                    body: JSON.stringify(playTrackBody)
                };
                logger.info("Calling play track API of spotify");
                request.put(options, (error, response, body) => {
                    logger.debug("playTrack response.statusCode", response.statusCode);
                    if (!error && (response.statusCode === 200 || response.statusCode === 204)) {
                        logger.info("Playtrack response body", body);
                    } else {
                        logger.debug("playTrack response", JSON.stringify(response));
                        logger.debug("playTrack body", body);
                        logger.error("playTrack error", error);
                        try {
                            body = JSON.parse(body);
                            logger.debug("body", body);
                        } catch (e) {
                            logger.error(e);
                        }
                        let message = "", errorType = "unknown_spotify_error";
                        if (response.statusCode == 404) {
                            message = "No active device found to play";
                            errorType = "device_not_found";
                            logger.error("Device not found");
                            if(deviceNFRestartP){
                                logger.info("restart player once if device not found");
                                deviceNFRestartP = false;
                                playTrackQueue = playTrackBody;
                                spotify.restartPlayer(uiClients);
                                return ;
                            }
                        } else if (response.statusCode == 401) {
                            message = "Failed to authenticate";
                            errorType = "authentication_error";
                        } else if (response.statusCode == 429) {
                            message = "Please retry after sometime";
                            errorType = "rate_limit";
                        } else if (response.statusCode == 403) {
                            let error = body.error;
                            if (error) {
                                switch (error.reason) {
                                    case "PREMIUM_REQUIRED":
                                        message = "Player command failed: Premium required";
                                        errorType = "premium_required";
                                        break;
                                    default:
                                        errorType = "unknown_spotify_error";
                                        message = "Unknown spotify error";
                                        break;
                                }
                            } else {
                                console.log("error", error);
                            }
                        }
                        logger.debug("Sending play track error to PKG");
                        socketServer.sendToPKG("playerError", {
                            type: errorType,
                            message: message
                        }, message, spModule.toLocaleLowerCase());
                    }
                });
            }
        } else {
            logger.debug("playTrack authentication detail not available");
            logger.debug("Sending not authorised error to PKG");
            let message = "Authentication detail not available";
            socketServer.sendToPKG("playerError", {
                type: 'authentication_error',
                message: message
            }, message, spModule.toLocaleLowerCase());
        }
    },

    togglePlayback: (spModule, data, uiClients) => { 
        for (let client of uiClients) {
            logger.debug("Sending message to webUI clients to toggle playback");
            client.emit('togglePlayback');
        }
    },

    nextTrack: (spModule, data, uiClients) => {
        for (let client of uiClients) {
            logger.debug("Sending message to webUI clients to next track");
            client.emit('nextTrack');
        }
    },

    previousTrack: (spModule, data, uiClients) => { 
        for (let client of uiClients) {
            logger.debug("Sending message to webUI clients to previous track");
            client.emit('previousTrack');
        }
    },

    seekTrack: (spModule, data, uiClients) => { 
        for (let client of uiClients) {
            logger.debug("Sending message to webUI clients to seek track");
            client.emit('seekTrack', data);
        }
    },

    setVolume: (spModule, data, uiClients) => { 
        for (let client of uiClients) {
            logger.debug("Sending message to webUI clients to set volume");
            client.emit('setVolume', data);
        }
    },

    destroyPlayer: (eventType, uiClients) => {
        spotifyToken = null,
        startPlayerQueue = null,
        spotifyPlayerId = false,
        wspotifyHotelId = false,
        spotifyRoomName = '',
        playTrackQueue = false;
        playListQueue = false;

        for (let client of uiClients) {
            logger.debug("Sending message to webUI clients to destroy player");
            client.emit('destroyPlayer');
        }
        spotifyModule = spotifyModule ? spotifyModule.toLocaleLowerCase() : "spotify";
        socketServer.sendToPKG('disconnected', {}, "SDK disconnected", spotifyModule);
    },

    nextTrackWSpotify: (spModule, data, uiClients) => {
        logger.debug("next track event called");
        let authToken = config.spotify.graphql_token;
            authToken = Buffer.from(authToken).toString('base64');
        
        wspotifyHotelId = data.hotel_id;
        
        logger.debug("hotel id from PKG", wspotifyHotelId);

        let options = {
            method: 'POST',
            url: 'https://global.wapi.co/graphql',
            headers: {
                'Authorization': 'Basic ' + authToken,
                'Content-Type': 'application/json'
            },
            body: {
                query: '{ hotel(id: ' + wspotifyHotelId + ') { name, id, soundZone { nowPlaying { track { id, name, spotifyId } } } } }'
            },
            json: true
        };
        logger.debug("Calling API to get next track detail");
        request(options, (error, response, body) => {
            if (!error) {
                logger.debug("nextTrack body", JSON.stringify(body));
                logger.debug("nextTrack response.statusCode", response.statusCode);
                if (response.statusCode === 200) {
                    try {
                        let hotelId = body.data.hotel.id;
                        logger.debug("hotel id from GraphQL", hotelId);
                        let trackDetail = body.data.hotel.soundZone.nowPlaying.track;
                        spotify.playTrack(spModule, {
                            track_id: trackDetail.spotifyId,
                            hotel_id: wspotifyHotelId,
                            latitude: data.latitude,
                            longitude: data.longitude
                        }, uiClients);
                    } catch (e) {
                        logger.error("Next track parsing error:", e);
                    }
                }
            } else {
                logger.error("get nextTrack Error:", error);
            }
        });
    }
}

module.exports = spotify;