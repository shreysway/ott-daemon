
function connectToServer() {
  $.getJSON(chrome.extension.getURL('config.json'), function (settings) {
    var server = settings.server;
    socket = io(server.protocol + '://' + server.host + ':' + server.port + '/iqiyi', {
      transports: ['websocket']
    });
    socket.on('connect', () => {
      console.log(socket.connected);
    });
  });
}

// Open login form iframe popup
setTimeout(function () {
  var loginFrameBtn = document.querySelector('#nav_userBox .login-bottom a[rseat="tj_login"]');
  var userPop = document.querySelector('.header-user .qy-header-user-pop');
  console.log("loginFrameBtn", loginFrameBtn)
  if (loginFrameBtn) {
    loginFrameBtn.click()
  } else if(userPop) {
    socket.emit('onLoad', {
      page: "IqiyiAlreadyLoggedIn"
    });
  }
}, 1000);

connectToServer();