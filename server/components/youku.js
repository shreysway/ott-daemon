let express = require('express'),
    config = require(__basedir + '/config.json'),
    logger = require(__base + 'components/logger'),
    net = require('net');

let youkuWebClients = [];

let youku = {
    onConnect: (socket) => {
        youkuWebClients.push(socket);
        socket.on('disconnect', () => {
            let socketIndex = youkuWebClients.indexOf(socket);
            if (socketIndex >= 0) {
                youkuWebClients.splice(socketIndex, 1);
            }
        });
        socket.on('onLoad', (data) => {
            logger.debug(data);
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
        youkuWebClients.forEach((singleClient) => {
            singleClient.emit('inputCommand', command);
        });
    }
}

module.exports = youku;