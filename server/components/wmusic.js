const logger = require(__base + 'components/logger');

let moodQueue = null;
let metaDataQueue = null;
let guestQueue = null;
let wmusic = {
    sendToClients: (action, data, uiClients) => {
        logger.debug("checking if UI connected or not")
        if(uiClients && uiClients.length){
            logger.debug("UI connected");
            logger.debug("Sending message to webUI clients for " + action);
            for (let client of uiClients) {
                client.emit(action, data);
            }
        } else {
            logger.debug("UI no connected");
            if(action == "changeMood"){
                logger.debug("Queue change mood command")
                moodQueue = {
                    action: action,
                    data: data
                };
            } else if(action == "updateMetaData"){
                logger.debug("Queue update meta command")
                metaDataQueue = {
                    action: action,
                    data: data
                };
            } else if(action == "updateGuestData"){
                logger.debug("Queue update guest command")
                guestQueue = {
                    action: action,
                    data: data
                };
            }
        }
    },

    startMusic: (uiClients) => {
        if(moodQueue){
            wmusic.processQueue(uiClients, moodQueue);
            moodQueue = null;
        }
        if(metaDataQueue){
            wmusic.processQueue(uiClients, metaDataQueue);
            metaDataQueue = null;
        }
        if(guestQueue){
            wmusic.processQueue(uiClients, guestQueue);
            guestQueue = null;
        }
    },

    processQueue: function(uiClients, queue){
        for (let client of uiClients) {
            client.emit(queue.action, queue.data);
        }
    }
}

module.exports = wmusic;