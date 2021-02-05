const logger = require(__base + 'components/logger'),
    inRoomExperience = require('./inRoomExperience'),
    netflix = require('./netflix'),
    youku = require('./youku'),
    amazon = require('./amazon'),
    hulu = require('./hulu'),
    iqiyi = require('./iqiyi'),
    hotstar = require('./hotstar'),
    pkgClients = [];

let socketServer = {
    onConnect: (socket) => {
        pkgClients.push(socket);
        var remoteAddress = socket.remoteAddress + ':' + socket.remotePort;
        logger.debug('New tcp client connected: %s', remoteAddress);

        socket.write(JSON.stringify({
            "action": "connected",
            "data": "",
            "message": "TCP Socket Connected"
        }));

        socket.on('data', function (data) {
            logger.debug('%s Says: %s', remoteAddress, data);
            try {
                data = JSON.parse(data);
            } catch (e) {
                logger.error(e);
            }
            if (data.hasOwnProperty('module') && (data.module == "wspotify" || data.module == "spotify")
                && data.hasOwnProperty('action')) {
                inRoomExperience.sendSPCommand(data);
            } else if(data.hasOwnProperty('module') && data.module == "wmusic"){
                inRoomExperience.sendWMCommand(data);
            } else if(data.hasOwnProperty('module') && data.module == "youku" && data.hasOwnProperty('action')){
                youku.sendCommand(data.action);
            } else if(data.hasOwnProperty('module') && data.module == "amazon" && data.hasOwnProperty('action')){
                amazon.sendCommand(data.action);
            } else if(data.hasOwnProperty('module') && data.module == "hulu" && data.hasOwnProperty('action')){
                hulu.sendCommand(data.action);
            } else if(data.hasOwnProperty('module') && data.module == "netflix" && data.hasOwnProperty('action')){
                netflix.sendCommand(data.action);
            } else if(data.hasOwnProperty('module') && data.module == "iqiyi" && data.hasOwnProperty('action')){
                iqiyi.sendCommand(data.action);
            } else if(data.hasOwnProperty('module') && data.module == "hotstar" && data.hasOwnProperty('action')){
                hotstar.sendCommand(data);
            } else if(data.hasOwnProperty('module') && data.module == "youtube" && data.hasOwnProperty('action')){
                socketServer.youtube.sendCommand(data);
            } else {
                try {
                    data = data.toString();
                } catch (e) {
                    logger.error(e);
                }
                logger.debug("Invalid command", data);
            }
        });
        socket.on('close', function () {
            logger.debug('connection from %s closed', remoteAddress);
            let socketIndex = pkgClients.indexOf(socket);
            if (socketIndex >= 0) {
                pkgClients.splice(socketIndex, 1);
            }
        });
        socket.on('error', function (err) {
            logger.error('Connection %s error: %s', remoteAddress, err.message);
        });
    },

    sendToPKG: (action, data = {}, message = '', module) => {
        logger.info("Send to PKG called");
        for (let client of pkgClients) {
            let command = {
                "module": module,
                "action": action,
                "data": data,
                "message": message
            };
            logger.debug("Sending command to PKG", JSON.stringify(command));
            client.write(JSON.stringify(command));
        }
    }
}

module.exports = socketServer;
