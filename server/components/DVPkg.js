const config = require(__basedir + '/config.json'),
    logger = require(__base + 'components/logger'),
    net = require('net');

function DVPkg(){ 
    this.sendCommand = (feature, command) => {
        logger.info("Send " + command + " for " + feature);
        var client = new net.Socket();
        client.connect(config.server.pkg_port, config.server.host, function () {
            logger.info('Connected');
            client.write(command);
            client.destroy();
        });
        client.on('close', function () {
            logger.debug('Connection closed');
        });
        client.on('error', function (err) {
            logger.error("Error: " + err.message);
        })
    }
}


module.exports = DVPkg;