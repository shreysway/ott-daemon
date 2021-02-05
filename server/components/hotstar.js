const config = require(__basedir + '/config.json'),
    logger = require(__base + 'components/logger'),
    DVPkg = require(__base + 'components/DVPkg'),
    net = require('net');

const BACK = "back",
    SEARCH = "search", FORWARD = "forward", REWIND = "rewind",
    SET_USERNAME = "setusername",
    SET_PASSWORD = "setpassword",
    SUBMIT_USERNAME = "submitUsername",
    SUBMIT_MOBILE = "submitMobile",
    SUBMIT_OTP = "submitOTP",
    SIGNIN = "setsignin",
    SET_MOBILE = "setmobile";
    SET_OTP = "setotp";

let webClients = [];

let hotstar = {
    onConnect: (socket) => {
        webClients.push(socket);
        socket.on('disconnect', () => {
            let socketIndex = webClients.indexOf(socket);
            if (socketIndex >= 0) {
                webClients.splice(socketIndex, 1);
            }
        });

        socket.on('setFullScreen', (data) => {
            logger.info("[hotstar] setFullScreen");
            var client = new net.Socket();
            client.connect(config.hotstar.server_port, config.hotstar.server_host, function () {
                logger.info('[hotstar] Connected');
                client.write("setFullScreen");
                client.destroy();
            });
            client.on('close', function () {
                logger.debug('[hotstar] Connection closed');
            });
            client.on('error', function (err) {
                logger.error("[hotstar] Error: " + err.message);
            });
        });

        socket.on('showLogin', () => {
            logger.info("[hotstar] showUsername command");
            const command = JSON.stringify({"module":"hotstar","action":"HotstarLoginPage"});
            (new DVPkg).sendCommand("hotstar", command);
        });

        socket.on('showUsername', () => {
            logger.info("[hotstar] showUsername command");
            const command = JSON.stringify({"module":"hotstar","action":"showUsername"});
            (new DVPkg).sendCommand("hotstar", command);
        });

        socket.on('showMobile', () => {
            logger.info("[hotstar] showMobile command");
            const command = JSON.stringify({"module":"hotstar","action":"showMobile"});
            (new DVPkg).sendCommand("hotstar", command);
        });

        socket.on('showOTP', () => {
            logger.info("[hotstar] showOTP command");
            const command = JSON.stringify({"module":"hotstar","action":"showOTP"});
            (new DVPkg).sendCommand("hotstar", command);
        });

        socket.on('showResendOTP', () => {
            logger.info("[hotstar] showResendOTP command");
            const command = JSON.stringify({"module":"hotstar","action":"showResendOTP"});
            (new DVPkg).sendCommand("hotstar", command);
        });

        socket.on('resendOTP', () => {
            logger.info("[hotstar] resendOTP command");
            const command = JSON.stringify({"module":"hotstar","action":"resendOTP"});
            (new DVPkg).sendCommand("hotstar", command);
        });

        socket.on('showPassword', () => {
            logger.info("[hotstar] showPassword command");
            const command = JSON.stringify({"module":"hotstar","action":"showPassword"});
            (new DVPkg).sendCommand("hotstar", command);
        });

        socket.on('userLoggedIn', () => {
            logger.info("[hotstar] logged-in command");
            (new DVPkg).sendCommand("hotstar", "HotstarAlreadyLoggedIn");
        });

        socket.on('hotstarkeyboard', () => {
            logger.info("[hotstar] hotstarkeyboard command");
            (new DVPkg).sendCommand("hotstar", "hotstarkeyboard");
        })
    },

    sendCommand: (command) => {
        switch (command.action) {
            case BACK:
                logger.info("[hotstar] Back command received from PKG");
                hotstar.sendToUI(command.action, command.data);
                break;
            case SEARCH:
                logger.info("[hotstar] Search command received from PKG");
                hotstar.sendToUI(command.action, command.data);
                break;
            case FORWARD:
                logger.info("[hotstar] Forward command received from PKG");
                hotstar.sendToUI(command.action, command.data);
                break;
            case REWIND:
                logger.info("[hotstar] Rewind command received from PKG");
                hotstar.sendToUI(command.action, command.data);
                break;
            case SET_USERNAME:
                logger.info("[hotstar] Set username command received from PKG");
                hotstar.sendToUI(command.action, command.data);
                break;
            case SET_PASSWORD:
                logger.info("[hotstar] Set password command received from PKG");
                hotstar.sendToUI(command.action, command.data);
                break;
            case SUBMIT_USERNAME:
                logger.info("[hotstar] Submit username command received from PKG");
                hotstar.sendToUI(command.action, command.data);
                break;
            case SIGNIN:
                logger.info("[hotstar] Signin command received from PKG");
                hotstar.sendToUI(command.action, command.data);
                break;
            case SET_MOBILE:
                logger.info("[hotstar] Mobile command received from PKG");
                hotstar.sendToUI(command.action, command.data);
                break;
            case SET_OTP:
                logger.info("[hotstar] OTP command received from PKG");
                hotstar.sendToUI(command.action, command.data);
                break;
            case SUBMIT_MOBILE:
                logger.info("[hotstar] Submit mobile command received from PKG");
                hotstar.sendToUI(command.action, command.data);
                break;
            case SUBMIT_OTP:
                logger.info("[hotstar] Submit otp command received from PKG");
                hotstar.sendToUI(command.action, command.data);
                break;
            default:
                logger.debug("[hotstar] invalid command");
                break;
        }
    },

    sendToUI: (event, data) => {
        logger.info(`[hotstar] Sending ${event} to web clients`);
        webClients.forEach((client) => {
            client.emit(event, data);
        });
    }
}

module.exports = hotstar;