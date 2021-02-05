var hsInstance = new Hotstar();

hsInstance.findSignInButton();

if (window.location.href !== "https://www.hotstar.com/in/"
    && window.location.href !== "https://www.hotstar.com/in") {
    hsInstance.addBackButton();
    hsInstance.addVideoBackButton();
}

hsInstance.makeVideoToFullScreen();