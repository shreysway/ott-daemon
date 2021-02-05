let log4js = require('log4js'),
    config = require(__base + '/config.json');


log4js.configure({
    appenders: { 
      app: { 
        type: 'file',
        filename: __base + '/logs/application.log' 
      },
      console: { 
        type: 'console'
      }
    },
    categories: { 
      default: { 
        appenders: ['app','console'], 
        level: 'ALL' 
      } 
    }
});

let logger;
if(config.environment == "development"){
    logger = log4js.getLogger('console');
}else{
    logger = log4js.getLogger('app');
}

module.exports = logger;