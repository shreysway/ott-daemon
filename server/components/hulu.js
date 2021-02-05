let express = require('express'),
    config = require(__basedir + '/config.json'),
    logger = require(__base + 'components/logger'),
    net = require('net');

let huluWebClients = [];

let hulu = {
    onConnect: (socket) => {
        huluWebClients.push(socket);
        socket.on('disconnect', () => {
            let socketIndex = huluWebClients.indexOf(socket);
            if (socketIndex >= 0) {
                huluWebClients.splice(socketIndex, 1);
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
                logger.debug('Connection closed');
            });
            client.on('error', function (err) {
                logger.error("Error: " + err.message);
            })
        });
    },
    sendCommand: (command) => {
        huluWebClients.forEach((singleClient) => {
            singleClient.emit('inputCommand', command);
        });
    }
}

module.exports = hulu;