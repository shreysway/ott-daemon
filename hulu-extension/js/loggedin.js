$.getJSON(chrome.extension.getURL('config.json'), function (settings) {
    var server = settings.server;
    var socket = io(server.protocol + '://' + server.host + ':' + server.port + '/hulu', {
        transports: ['websocket']
    });
    socket.on('connect', () => {
        console.log(socket.connected);
        socket.emit('onLoad', {
            page: "HuluAlreadyLoggedIn"
        });
    });
});