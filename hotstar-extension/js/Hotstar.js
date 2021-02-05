const HISTORY_CHANGE = "historyChange";

// Selectors
const loginButton = '.signIn',
    emailFBLoginButton = '.email-or-fb-signin',
    emailLoginText = '.email-login-title-text',
    emailInput = '.email-login-container #emailID',
    passwordInput = '.email-login-form-container #password',
    emailSubmitBtn = ".email-login-title + .form-wrapper .submit-button",
    signInBtn = ".email-login-form-container .form-wrapper .submit-button",
    mobileInput = '.phone-number-container #phoneNo',
    otpInput = '.otp-container .otp-input .single-otp-input:first-child',
    resendOtpBtn = '.otp-container .resend-code button',
    mobileSubmitBtn = ".phone-number-container .submit-button",
    otpSubmitBtn = ".otp-container .submit-button",
    forwardBtn = ".controls-container .player-control.forward",
    rewindBtn = ".controls-container .player-control.rewind",
    userPic = '.user-pic';

// Intervals
const findSignInInterval = 500,
    findLoginInterval = 500,
    checkLoggedInInterval = 500;

// Retries Allowed
const findSingInRepeatAllowed = 5,
    findPassowordAllowed = 3,
    findMobileAllowed = 3,
    findOtpAllowed = 3;

class Hotstar {

    constructor() {
        this.socket = null;
        this.connectToServer();
        this.bindEvents();
        this.findLoginInRepeat = 0;
        this.findPassowordRepeat = 0;
        this.findSignInRepeat = 0;
        this.findMobileRepeat = 0;
        this.findOtpRepeat = 0;
        this.sendLoginEvent = true;

        // Observers
        this.resendOTPObserver = null;
    }

    // observe resend OTP button
    observeResendOTP() {
        const targetNode = document.querySelector('.resend-code');
        console.log('targetNode', targetNode);
        const config = { childList: true, subtree: true };

        // Callback function to execute when mutations are observed
        const callback = function (mutationsList, observer) {
            // Use traditional 'for loops' for IE 11
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    if (mutation.addedNodes.length && this.socket && this.socket.connected) {
                        let resendButton = mutation.addedNodes[0];
                        console.log('Found resendButton', resendButton);
                        this.socket.emit('showResendOTP')
                    }
                }
            }
        };

        // Create an observer instance linked to the callback function
        this.resendOTPObserver = new MutationObserver(callback.bind(this));

        // Start observing the target node for configured mutations
        this.resendOTPObserver.observe(targetNode, config);
    }

    connectToServer() {
        $.getJSON(chrome.runtime.getURL('config.json'), (settings) => {
            var server = settings.server;
            this.socket = io(server.protocol + '://' + server.host + ':' + server.port + '/hotstar', {
                transports: ['websocket']
            });

            this.socket.on('connect', () => {
                console.log(this.socket.connected); // true
                if (localStorage.getItem("setSearch") == 1) {
                    $('#searchField').focus();
                    localStorage.removeItem("setSearch")
                }
            });

            this.socket.on('back', () => {
                console.log("[hotstar] Back command received")
                this.goBack();
            });

            this.socket.on('search', () => {
                console.log("[hotstar] Search command received")
                if ($('video').length && $('.player-base').hasClass('full-screen')) {
                    localStorage.setItem("setSearch", 1);
                    this.goBack();
                } else {
                    $('#searchField').focus();
                }
            });

            this.socket.on('submitUsername', () => {
                console.log("[hotstar] Submit username command received");
                if ($(emailSubmitBtn).length) {
                    $(emailSubmitBtn).click();
                    this.findPassowordRepeat = 0;
                    this.findMobileField();
                    this.findPasswordField();
                }
            });

            this.socket.on('setmobile', () => {
                console.log("[hotstar] Set mobile command received");
                this.changeInput(mobileInput);
            });

            this.socket.on('submitMobile', () => {
                console.log("[hotstar] Submit mobile command received");
                if ($(mobileSubmitBtn).length) {
                    $(mobileSubmitBtn).click();
                    this.findOtpRepeat = 0;
                    this.findOTPField();
                }
            });

            this.socket.on('setotp', () => {
                console.log("[hotstar] Set otp command received");
                this.changeInput(otpInput);
            });

            this.socket.on('submitOTP', () => {
                console.log("[hotstar] Submit otp command received");
                if ($(otpSubmitBtn).length) {
                    $(otpSubmitBtn).click();
                    this.resendOTPObserver.disconnect();
                    this.checkIsLoggedIn();
                }
            });

            this.socket.on('resendOTP', () => {
                console.log("[hotstar] resetOTP command received");
                if ($(resendOtpBtn).length) {
                    $(resendOtpBtn).trigger('click');
                } else {
                    console.log("resend OTP button not found");
                }
            });

            this.socket.on('setusername', () => {
                console.log("[hotstar] Set username command received");
                if ($(".email-login-form-container").length) {
                    $(".action-bg").trigger('click');
                    setTimeout(() => {
                        this.findSignInButton();
                    })
                } else {
                    console.log("Reset email");
                    this.changeInput(emailInput);
                }
            });

            this.socket.on('setpassword', () => {
                console.log("[hotstar] Set password command received");
                this.changeInput(passwordInput);
            });

            this.socket.on('setsignin', () => {
                console.log("[hotstar] Signin command received");
                if ($(signInBtn).length) {
                    $(signInBtn).click();
                    this.checkIsLoggedIn();
                }
            });

            this.socket.on('forward', () => {
                console.log("[hotstar] Forward command received");
                if ($(forwardBtn).length) {
                    $(forwardBtn).click();
                }
            });

            this.socket.on('rewind', () => {
                console.log("[hotstar] Rewind command received");
                if ($(rewindBtn).length) {
                    $(rewindBtn).click();
                }
            });
        });
    }

    bindEvents() { 
        // Listen for background script events
        chrome.runtime.onMessage.addListener(this.onMessage.bind(this));

        $(document).on('focus', '#searchField', () => { 
            console.log("[hotstar] Search input focused");
            this.socket.emit('hotstarkeyboard');
        });
    }

    addBackButton(url){
        // Get back button
        var urlHref = url || window.location.href;
        var button = document.getElementById('dv_hotstart_back_btn');
        console.log("[hotstar] window.location.href", window.location.href);
        console.log("[hotstar] urlHref", urlHref);
        if (urlHref === "https://www.hotstar.com/in/"
            || urlHref === "https://www.hotstar.com/in") {
            // Remove back button if user is on home page
            if(button)
                button.remove(button);
        } else if(!button){ 
            // If user not on home page or button in there then create new back button and append it body with click listener
            var button = document.createElement('button'); // Create new button element
            button.id = "dv_hotstart_back_btn"; // Assign identifier to button
            button.className = "dv_hotstart_back_btn"; // Assign class to button
    
            var imgEle = document.createElement('img');
            imgEle.src = chrome.runtime.getURL('img/arrowback.png');
            button.appendChild(imgEle);
    
            // Add click listener to button
            button.onclick = this.goBack;
    
            // Check if budy element is loaded or not
            if(document.body){
                document.body.appendChild(button); // When body os loaded then append button to body
            } else {
                // If body not loaded then again call addBackButton after 500ms
                setTimeout(() => {
                    this.addBackButton();
                }, 500);
            }
        }
    }

    changeInput(field){
        let elem = document.querySelector(field);
        elem.select();
        elem.dispatchEvent(new Event('focus'));

        let target = jQuery(field)[0]
        let event = document.createEvent("HTMLEvents");
        if(jQuery(field).val()){
            jQuery(field).val("");
        }
        event.initEvent("input", true, true);
        target.dispatchEvent(event);
    }

    addVideoBackButton(){
        var button = document.getElementById('dv_hotstart_vd_back_btn');
        if(button){
            return false;
        }
        // If user not on home page or button in there then create new back button and append it body with click listener
        var button = document.createElement('button'); 
        button.id = "dv_hotstart_vd_back_btn"
        button.className = "dv_hotstart_back_btn"; // Assign class to button
        // button.innerText = "Back"; // Add button text
    
        var imgEle = document.createElement('img');
        imgEle.src = chrome.runtime.getURL('img/arrowback.png');
        button.appendChild(imgEle);
        
        // Add click listener to button
        button.onclick = this.goBack;
    
        var videoControlContainer = document.getElementsByClassName('controls-container');
        if(videoControlContainer && videoControlContainer[0]){
            console.log("[hotstar] append video button");
            videoControlContainer[0].appendChild(button)
        } else {
            // If body not loaded then again call addBackButton after 500ms
            setTimeout(() => {
                this.addVideoBackButton();
            }, 500);
        }
    }

    makeVideoToFullScreen() {
        var fsBtn = $('.player');
        if(fsBtn.length){
            this.socket.emit('setFullScreen');
        } else {
            setTimeout(function(){
                this.makeVideoToFullScreen();
            }.bind(this), 1000);
        }
    }

    /**
     * Find login pop-up button to open login pop-up
     */
    findSignInButton() {
        if ($(loginButton).length) {
            $(loginButton).click();
            this.findMobileField();
            this.findMobileRepeat = 0;
        } else if (this.findSignInRepeat < findSingInRepeatAllowed) {
            setTimeout(() => {
                console.log("[hotstar] Call find sing in");
                this.findSignInButton();
            }, findSignInInterval); // Not found then again check for same after a sec.
            this.findSignInRepeat++;
        } else {
            this.checkIsLoggedIn();
        }
    }

    // /**
    //  * Find login button after pop-up open
    //  */
    // findLoginButton(){
    //     if($(emailFBLoginButton).length){ // Check for login button loaded or not if loaded then click
    //         $(emailFBLoginButton).click();
    //         $(emailLoginText).text("Enter your email");
    //         // $(emailInput).focus();
    //         this.changeInput(emailInput);
    //         this.showUsername();
    //     } else {
    //         setTimeout(() => {
    //             this.findLoginButton();
    //         }, findLoginInterval); // Not found then again check for same after a sec.
    //     }
    // }
    
    findPasswordField() {
        console.log("[hotstar] Find password called");
        if ($(passwordInput).length) {
            console.log("[hotstar] Found password input");
            $(passwordInput).focus();
            this.findPassowordRepeat = 0;
            this.socket.emit('showPassword');
        } else {
            if (this.findPassowordRepeat <= findPassowordAllowed) {
                setTimeout(() => {
                    this.findPasswordField();
                }, 1000);
                this.findPassowordRepeat++;
            }
        }
    }

    findMobileField() {
        console.log("[hotstar] Find mobile called");
        if ($(mobileInput).length) {
            console.log("[hotstar] Found mobile input");
            $(mobileInput).focus();
            this.findMobileRepeat = 0;
            this.socket.emit('showMobile');
        } else {
            if (this.findMobileRepeat <= findMobileAllowed) {
                setTimeout(() => {
                    this.findMobileField();
                }, 1000);
                this.findMobileRepeat++;
            }
        }
    }

    findOTPField() {
        console.log("[hotstar] Find otp called");
        if ($(otpInput).length) {
            console.log("[hotstar] Found otp input");
            $(otpInput).focus();
            this.findOtpRepeat = 0;
            this.socket.emit('showOTP');
            this.observeResendOTP();
        } else {
            if (this.findOtpRepeat <= findMobileAllowed) {
                setTimeout(() => {
                    this.findOTPField();
                }, 1000);
                this.findOtpRepeat++;
            }
        }
    }

    goBack() {
        if (window.location.href !== "https://www.hotstar.com/in/"
            && window.location.href !== "https://www.hotstar.com/in") {
            history.back();
        }
    }

    onMessage(data) {
        console.log("data", data);
        if("action" in data){
            switch(data.action){
                case HISTORY_CHANGE:
                    this.addBackButton(data.url);
                    this.addVideoBackButton(data.url);
                break;
                default:
                    console.log("[hotstar] Invalid action", data);
            }
        }
    }

    checkIsLoggedIn() {
        if ($(userPic).length) {
            console.log("[hotstar] User logged-in");
            this.userLoggedIn();
        } else {
            setTimeout(() => { 
                this.checkIsLoggedIn();
            }, checkLoggedInInterval)
        }
    }

    showUsername() {
        if(this.sendLoginEvent){
            this.socket.emit('showLogin');
            this.sendLoginEvent = false;
        }
        this.socket.emit('showUsername');
    }

    userLoggedIn() { 
        this.socket.emit('userLoggedIn');
    }
}