const config = require(__basedir + '/config.json'),
    logger = require(__base + 'components/logger'),
    DVPkg = require(__base + 'components/DVPkg'),
    net = require('net');

const FEATURE = "YouTube",
    PLAY = "play",
    CHANGEVIDEO = "changeVideo",
    PAUSE = "pause",
    FORWARD = "forward",
    REWIND = "rewind",
    SEEK = "seek";

let webClients = [];

class YouTube {
    constructor(){
        
    }

    onConnect(socket){
        webClients.push(socket);

        socket.on('disconnect', () => {
            let socketIndex = webClients.indexOf(socket);
            if (socketIndex >= 0) {
                webClients.splice(socketIndex, 1);
            }
        });

        socket.on('ready', () => {
            logger.info(`[${FEATURE}] ready command from UI`);
            this.sendToPKG("YouTubeReady");
        });

        socket.on('status', data => {
            logger.info(`[${FEATURE}] status command from UI`);
            this.sendToPKG("status", data);
        });

        socket.on('playerError', data => {
            logger.info(`[${FEATURE}] playerError command from UI`);
            this.sendToPKG("playerError", data);
        });
    }

    sendCommand (command) {
        switch (command.action) {
            case CHANGEVIDEO:
                logger.info(`[${FEATURE}] ChangeVideo command received from PKG`);
                this.sendToUI(command.action, command.data);
                break;
            case PLAY:
                logger.info(`[${FEATURE}] Play command received from PKG`);
                this.sendToUI(command.action, command.data);
                break;
            case PAUSE:
                logger.info(`[${FEATURE}] Pause command received from PKG`);
                this.sendToUI(command.action, command.data);
                break;
            case FORWARD:
                logger.info(`[${FEATURE}] Forward command received from PKG`);
                this.sendToUI(command.action, command.data);
                break;
            case REWIND:
                logger.info(`[${FEATURE}] Rewind command received from PKG`);
                this.sendToUI(command.action, command.data);
                break;
            case SEEK:
                logger.info(`[${FEATURE}] Seek command received from PKG`);
                this.sendToUI(command.action, command.data);
                break;
            default:
                logger.debug(`[${FEATURE}] invalid command`);
                break;
        }
    }

    sendToUI (event, data) {
        logger.info(`[${FEATURE}] Sending ${event} to web clients`);
        webClients.forEach((client) => {
            client.emit(event, data);
        });
    }

    sendToPKG (action, command = {}) {
        socketServer.sendToPKG(action, command, '', FEATURE.toLocaleLowerCase());
    }
}

module.exports = YouTube;