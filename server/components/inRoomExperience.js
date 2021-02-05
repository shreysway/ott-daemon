const express = require('express'),
    cookieParser = require('cookie-parser'),
    logger = require(__base + 'components/logger'),
    router = express.Router(),
    spotify = require('./spotify'),
    wmusic = require('./wmusic');

router.use(cookieParser());

let webUIClients = [];
let uiType = null;

let inRoomExperience = {
    onUIConnect: (socket) => {
        webUIClients.push(socket);

        logger.debug("webUI connected");

        try{
            logger.debug('Connection from ', socket.handshake.address);
        }catch(e){
            logger.error(e);
        }

        if(["wspotify","spotify"].indexOf(uiType) > -1){
            spotify.startPlayer(null, null, webUIClients);
        } else if(uiType == "wmusic"){
            setTimeout(() => {
                logger.debug("Start wmusic")
                wmusic.startMusic(webUIClients);
            });
        }

        socket.on('disconnect', () => {
            let socketIndex = webUIClients.indexOf(socket);
            if (socketIndex >= 0) {
                webUIClients.splice(socketIndex, 1);
            }

            try{
                logger.debug('Web UI dis-connection from ', socket.handshake.address);
            }catch(e){
                logger.error(e);
            }
        });

        socket.on('playerReady', (data) => {
            logger.debug("Player connected");
            spotify.setPlayerId(data.device_id);
            
            logger.debug("Notify spotify component to player is ready");
            spotify.playerReady(data.module, webUIClients);

            logger.debug("Sending player ready command to PKG");
            logger.debug("data.module", data.module);
            socketServer.sendToPKG("playerReady", {}, "Player ready", data.module.toLowerCase());
        });

        socket.on('playerOffline', (data) => {
            logger.debug("Player offline", data);
            logger.debug("Sending player offline command to PKG");
            socketServer.sendToPKG("playerOffline", data, '', data.module.toLowerCase());
        });

        socket.on("trackPlayed", (trackDetail) => {
            logger.debug("trackPlayed", trackDetail);
            trackDetail.hotel_id = process.env.wspotify_hotelId;
            logger.debug("Sending track detail command to PKG");
            logger.debug("uiType", uiType);
            socketServer.sendToPKG("trackPlayed", trackDetail, '', uiType.toLowerCase());
        });

        socket.on('playbackStatus', (playBackStatus) => {
            logger.debug("Received playback state from SDK Player");
            logger.debug("Sending playback state command to PKG");
            logger.debug("uiType", uiType);
            socketServer.sendToPKG("playbackStatus", playBackStatus, '', uiType.toLowerCase());
        });

        socket.on('nextTrack', (data) => {
            spotify.nextTrackWSpotify('wspotify', data, webUIClients);
        });

        socket.on('playerError', (errorObj) => {
            logger.error("playerError", errorObj);
            logger.debug("Sending player error command to PKG");
            logger.debug("uiType", uiType);
            socketServer.sendToPKG("playerError", errorObj, '', uiType.toLowerCase());
        });
    },

    sendSPCommand: (command) => {
        logger.debug("uiType", uiType);
        logger.debug("command.module", command.module);
        if(uiType && uiType != command.module){
            webUIClients = [];    
        }
        uiType = command.module;
        switch(command.action){
            case "startPlayer":
                logger.debug("Start player command");
                spotify.startPlayer(command.module, command.data, webUIClients);
                break;
            case "updateToken":
                logger.debug("Update token command");
                spotify.updateAccessToken(command.module, command.data, webUIClients);
                break;
            case "playTrack":
                logger.debug("Play track command");
                spotify.playTrack(command.module, command.data, webUIClients);
                break;
            case "playPlaylist":
                logger.debug("Play track command");
                spotify.playPlaylist(command.module, command.data, webUIClients);
                break;
            case "togglePlayback":
                logger.debug("Toggle playback command");
                spotify.togglePlayback(command.module, command.data, webUIClients);
                break;
            case "nextTrack":
                logger.debug("Next track command");
                spotify.nextTrack(command.module, command.data, webUIClients);
                break;
            case "skip":
                logger.debug("Skip track command");
                spotify.nextTrackWSpotify(command.module, command.data, webUIClients);
                break;
            case "previousTrack":
                logger.debug("Previous track command");
                spotify.previousTrack(command.module, command.data, webUIClients);
                break;
            case "seek":
                logger.debug("Seek track command");
                spotify.seekTrack(command.module, command.data, webUIClients);
                break;
            case "setVolume":
                logger.debug("Set volume command");
                spotify.setVolume(command.module, command.data, webUIClients);
                break;
            case "signOut":
            case "checkOut":
            case "stop":
                logger.debug(command.action + " command");
                spotify.destroyPlayer(command.action, webUIClients);
                uiType = null;
                break;
            default:
                logger.debug("Invalide action from PKG");
                break;
        }
        
    },

    sendWMCommand: (command) => {
        if(uiType && uiType !== command.module){
            webUIClients = [];    
        }
        uiType = 'wmusic';
        switch(command.action){
            case "changeMood":
                logger.debug("change mood command");
                wmusic.sendToClients(command.action, command.data, webUIClients);
                break;
            case "updateMetaData":
                logger.debug("Update meta data command");
                wmusic.sendToClients(command.action, command.data, webUIClients);
                break;
            case "updateGuestData":
                logger.debug("Update guest data command");
                wmusic.sendToClients(command.action, command.data, webUIClients);
                break;
            case "stop":
                logger.debug("Stop command");
                uiType = null;
                break;
            default:
                logger.debug("Invalide action from PKG");
                break;
        }
        
    }
}

module.exports = inRoomExperience;