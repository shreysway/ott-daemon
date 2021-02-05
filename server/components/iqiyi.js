let express = require('express'),
    config = require(__basedir + '/config.json'),
    logger = require(__base + 'components/logger'),
    net = require('net');

let iqiyiWebClients = [];

let iqiyi = {
    onConnect: (socket) => {
        iqiyiWebClients.push(socket);
        socket.on('disconnect', () => {
            let socketIndex = iqiyiWebClients.indexOf(socket);
            if (socketIndex >= 0) {
                iqiyiWebClients.splice(socketIndex, 1);
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
        iqiyiWebClients.forEach((singleClient) => {
            singleClient.emit('inputCommand', command);
        });
    }
}

module.exports = iqiyi;
