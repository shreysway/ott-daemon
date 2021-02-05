console.log("Iqiyi Login Form Loaded");

var fields = {
    email: 'input.txt-account[data-pwdloginbox="name"]',
    password: 'input.txt-password[data-pwdloginbox="pwd"]',
    submit: 'a.btn-login[data-pwdloginbox="loginBtn"]'
}, loginBtnInterval, validateLoginInterval, loginSuccessInterval;

function changeInput(data){
    var field = document.querySelector(fields[data.field]);
    field.value = '';
    field.select();
    field.dispatchEvent(new Event('focus'));
}

function changeText(data){
    var field = fields[data.field];
    var target = $(field)[0]
    var event = document.createEvent("HTMLEvents");
    $(field).val(data.value);
    event.initEvent("input", true, true);
    target.dispatchEvent(event);
}

function clickButton(data){
    var field = document.querySelector(fields[data.field]);
    field.focus()
    field.click();
}

function loginButton() {
    console.log("loginButton called");
    var loginFormBtn = $('.login-frame[data-loginele="codeLogin"] .login-frame-bottom a[data-passlogin]');
    console.log("loginFormBtn", loginFormBtn);
    if (loginFormBtn.length) {
        loginFormBtn[0].click();

        var passLoginBox = $('.login-frame[data-loginele="passLogin"]');
        console.log("passLoginBox", passLoginBox);
        var passLoginDisplay = (passLoginBox.length) ? passLoginBox.css('display') : 'none';
        console.log("passLoginDisplay", passLoginDisplay);
        if (loginBtnInterval && passLoginDisplay == "block") {

            clearInterval(loginBtnInterval);
            socket.emit('onLoad', {
                page: "IqiyiLoginPage"
            });
            var submitButton = document.querySelector(fields.submit);
            function submitHandle(e) {
                console.log("Submit Handler");
                if (!$(e.target).hasClass('btn-gray')) {
                    checkCaptchaInterval = setInterval(checkCaptcha, 1000);
                }
            }
            submitButton.removeEventListener("click", submitHandle);
            submitButton.addEventListener("click", submitHandle, false);

        }
    }
}

function checkCaptcha() {
    var slidePicCode = $('.login-frame[data-loginele="slidePiccode"]');
    console.log("slidePicCode", slidePicCode);
    var slidePicCodeDisplay = (slidePicCode.length) ? slidePicCode.css('display') : 'none';
    console.log("slidePicCodeDisplay", slidePicCodeDisplay);

    if (slidePicCodeDisplay == "block") {
        socket.emit('onLoad', {
            page: "OpenIqiyiCaptchaView"
        });

        checkLoginInterval = setInterval(checkLogin, 1000);

        if (checkCaptchaInterval)
            clearInterval(checkCaptchaInterval);
    }
}

function checkLogin() {
    var passLoginBox = $('.login-frame[data-loginele="passLogin"]');
    console.log("passLoginBox", passLoginBox);
    var passLoginDisplay = (passLoginBox.length) ? passLoginBox.css('display') : 'none';
    console.log("passLoginDisplay", passLoginDisplay);

    var loginSuccess = $('.login-frame[data-loginele="passLogin"] .div[data-loginele="suc"][data-block-name="pcwpwdlgnok"]');
    console.log("loginSuccess", loginSuccess);
    var loginSuccessDisplay = (loginSuccess.length) ? loginSuccess.css('display') : 'none';
    console.log("loginSuccessDisplay", loginSuccessDisplay);

    if (loginSuccessDisplay == "block") {
        socket.emit('onLoad', {
            page: "IqiyiAlreadyLoggedIn"
        });

        if (checkLoginInterval)
            clearInterval(checkLoginInterval);
        
        if (loginSuccessInterval)
            clearInterval(loginSuccessInterval);
        
    } else if (passLoginDisplay == "block") {
        checkLoginSuccess(function (response) {
            if (!response) {
                socket.emit('onLoad', {
                    page: "IqiyiLoginPage"
                });
    
                if (checkLoginInterval)
                    clearInterval(checkLoginInterval);
            
                if (loginSuccessInterval)
                    clearInterval(loginSuccessInterval);
            
                if (checkCaptchaInterval)
                    clearInterval(checkCaptchaInterval);
            }
        });
    }
}

function checkLoginSuccess(callback) {
    var loginSuccess = $('.login-frame[data-loginele="passLogin"] div[data-loginele="suc"][data-block-name="pcwpwdlgnok"]');
    console.log("loginSuccess", loginSuccess);
    var loginSuccessDisplay = (loginSuccess.length) ? loginSuccess.css('display') : 'none';
    console.log("loginSuccessDisplay", loginSuccessDisplay);

    var isLogin = false;
    if (loginSuccessDisplay == "block") {
        isLogin = true;

        socket.emit('onLoad', {
            page: "IqiyiAlreadyLoggedIn"
        });

        if (checkLoginInterval)
            clearInterval(checkLoginInterval);
        
        if (loginSuccessInterval)
            clearInterval(loginSuccessInterval);
        
        if (checkCaptchaInterval)
            clearInterval(checkCaptchaInterval);
    }

    if (typeof callback == "function") {
        callback(isLogin);
    }
}

function connectToServer() {
    $.getJSON(chrome.extension.getURL('config.json'), function (settings) {
        var server = settings.server;
        socket = io(server.protocol + '://' + server.host + ':' + server.port + '/iqiyi', {
            transports: ['websocket']
        });
        socket.on('connect', () => {
            console.log(socket.connected);
            loginBtnInterval = setInterval(loginButton, 1000);
        });
        socket.on('inputCommand', (command) => {
            if (command == "setusername") {
                changeInput({ field: 'email' });
            } else if (command == "setpassword") {
                changeInput({ field: 'password' });
            } else if (command == "setsignin") {
                clickButton({ field: 'submit' });
            } else {
                console.error("Invalide command " + command);
            }
        });
    });
}

connectToServer();