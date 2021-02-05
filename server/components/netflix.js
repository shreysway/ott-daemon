let express = require('express'),
    config = require(__basedir + '/config.json'),
    logger = require(__base + 'components/logger'),
    net = require('net');

let netflixWebClients = [];

let netflix = {
    onConnect: (socket) => {
        netflixWebClients.push(socket);
        socket.on('disconnect', () => {
            let socketIndex = netflixWebClients.indexOf(socket);
            if (socketIndex >= 0) {
                netflixWebClients.splice(socketIndex, 1);
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

        socket.on('netflixkeyboard', (data) => {
            logger.info(data);
            var client = new net.Socket();
            client.connect(config.server.pkg_port, config.server.host, function () {
                logger.info('Connected');
                client.write("netflixkeyboard");
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
        if(command == "back"){
            netflixWebClients.forEach((singleClient) => {
                singleClient.emit('back');
            });
        } else if(command == "search"){
            netflixWebClients.forEach((singleClient) => {
                singleClient.emit('search');
            });
        } else {
            netflixWebClients.forEach((singleClient) => {
                singleClient.emit('inputCommand', command);
            });
        }
    }
}

module.exports = netflix;