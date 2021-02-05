let express = require('express'),
    config = require(__basedir + '/config.json'),
    logger = require(__base + 'components/logger'),
    net = require('net');

let amazonWebClients = [];

let amazon = {
    onConnect: (socket) => {
        amazonWebClients.push(socket);
        socket.on('disconnect', () => {
            let socketIndex = amazonWebClients.indexOf(socket);
            if (socketIndex >= 0) {
                amazonWebClients.splice(socketIndex, 1);
            }
        });
        socket.on('onLoad', (data) => {
            logger.info(data);
            var client = new net.Socket();
            client.connect(config.server.pkg_port, config.server.host, function () {
                logger.info('Connected');
                client.write(data.page);
                client.destroy();
            });
            client.on('close', function () {
                logger.info('Connection closed');
            });
            client.on('error', function (err) {
                logger.error("Error: " + err.message);
            })
        });
    },
    sendCommand: (command) => {
        amazonWebClients.forEach((singleClient) => {
            singleClient.emit('inputCommand', command);
        });
    }
}

module.exports = amazon;