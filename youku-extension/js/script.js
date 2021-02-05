
var fields = {
  email: '#fm-login-id',
  password: '#fm-login-password',
  submit: '#login-form button.password-login'
};

var loginPopInterval, afterLoginInterval, addHideRetry = 0;

function manageLogin() {
  console.log("manageLogin called");

  var afterLogin = $("div[class^='login-after']");
  var userProfile = $("div[class^='u-profile']");
  var userName = $("div[class^='u-name']");
  
  if (afterLogin.length && userProfile.length && userName.length) {
    console.log("YoukuAlreadyLoggedIn")
    socket.emit('onLoad', {
      page: "YoukuAlreadyLoggedIn"
    });
  } else {
    setTimeout(manageLogin, 1000);
  }
}

// Open login popup
function showLogin() {
  console.log("showLogin called");
  var loginPopDisplay = $('#YT-loginFramePop').css('display');
  if (loginPopDisplay == "block") {
    console.log("showLogin stop");
    return null;
  } else {
    setTimeout(showLogin, 1000);
  }
  var loginFormBtn = document.getElementById('qheader_panel-login');
  console.log("loginFormBtn", loginFormBtn);
  if (loginFormBtn) {
    loginFormBtn.click();
  }
}

// setTimeout(showLogin, 1000);

/*var socket;
$.getJSON(chrome.extension.getURL('config.json'), function (settings) {
  var server = settings.server;
  socket = io(server.protocol + '://' + server.host + ':' + server.port + '/youku', {
    transports: ['websocket']
  });
  socket.on('connect', () => {
    console.log(socket.connected);
    setTimeout(manageLogin, 1000);
  });
});*/

function playerVideo() {
  var youkuVideo = document.querySelector(".youku-player video");
  console.log("youkuVideo", youkuVideo);
  if (youkuVideo) {
    youkuVideo.onpause = (event) => {
      console.log("Video paused", event);
    };
    youkuVideo.onplay = (event) => {
      addHideRetry = 0;
      console.log("Video playing", event);
      $(".youku-player .h5-ext-layer").show();
    };

    $("body").on('DOMSubtreeModified', ".youku-player .h5-ext-layer", function() {
      console.log('changed');
      var adImg = document.querySelector(".youku-player .h5-ext-layer img");
      console.log("adImg", adImg);
      if (adImg) {
        $(".youku-player .h5-ext-layer").hide();
      }
    });
  } else {
    setTimeout(function () { 
      playerVideo();
    }, 1000);
  }
}

playerVideo();