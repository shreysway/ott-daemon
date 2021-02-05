/**
 * Block ad container (by CSS)
 */
class adFilter {
    constructor (enabled = false) {
      this._createStyleSheet()
      this.enabled = enabled
    }
  
    _createStyleSheet () {
      // Create the <style> tag
      const style = document.createElement("style");
  
      // WebKit hack :(
      style.appendChild(document.createTextNode(""));
  
      // Append stylesheet as early as possible
      headReady(() => {
        document.head.appendChild(style);
        this.sheet = style.sheet
        if (this.enabled) {
          this.enable()
        }
      })
    }
  
    enable() {
      if (this.stylesActive) {
        return
      }
      this.ruleId = this.sheet.insertRule(`
        .ad-container,
        .ad-div,
        .masthead-ad-control,
        .video-ads,
        .ytp-ad-progress-list,
        #ad_creative_3,
        #footer-ads,
        #masthead-ad,
        #player-ads,
        .ytd-mealbar-promo-renderer,
        #watch-channel-brand-div,
        #watch7-sidebar-ads {
          display: none !important;
        }
      `, 0);
      this.stylesActive = true
    }
  
    disable() {
      if (this.stylesActive) {
        this.sheet.deleteRule(this.ruleId)
        this.stylesActive = false
      }
    }
}
const PLAYER_STATE_ENDED = "ENDED",
PLAYER_STATE_PLAYING = "PLAYING",
PLAYER_STATE_PAUSED = "PAUSED",
PLAYER_STATE_BUFFERING = "BUFFERING",
PLAYER_STATE_CUED = "CUED";
class DigitTube {

    constructor(){
        this.prevVideoId = null;
        this.sdkReady = false;
        this.playerReady = false;
        this.player = null;
        this.isPlaying = false;
        this.isPause = false;
        this.playStatus = true;
        this.prevState = 0;
        this.stateInterval = null;
        this.fastForwardTime = 10; //In Seconds
        this.updateStatusTime = 1; // In Seconds
        this.isFirst = true;
        this.isSeeking = false;
        this.playerState = {};
        this.playerLastState = false;
        this.needToSeekOnPlay = false
        this.playerStates = {
            0: PLAYER_STATE_ENDED,
            1: PLAYER_STATE_PLAYING,
            2: PLAYER_STATE_PAUSED,
            3: PLAYER_STATE_BUFFERING,
            5: PLAYER_STATE_CUED
        };
    }

    setupSocket(){
        fetch(chrome.extension.getURL('config.json'))
        .then(res => res.json())
        .then(settings => {
            let server = settings.server;
            this.socket = io(server.protocol + '://' + server.host + ':' + server.port + '/youTube', {
                transports: ['websocket']
            });
            this.socket.on('connect', () => {
                console.log("WebSocket Connected:", this.socket.connected); // true
                this.socket.emit('ready');
                // this.removeAdd();
                this.disableAutoPlay();
            });
            this.socket.on('changeVideo', this.changeVideo.bind(this));
            this.socket.on('pause', this.pauseVideo.bind(this));
            this.socket.on('play', this.playVideo.bind(this));
            this.socket.on('stop', this.stopVideo.bind(this));
            this.socket.on('seek', this.seekVideo.bind(this));
            this.socket.on('forward', this.forwardVideo.bind(this));
            this.socket.on('rewind', this.rewindVideo.bind(this));
        });
    }

    setupEvents(){
        let videoElem = document.querySelector('.html5-main-video');
        if(videoElem){
            console.log("found video tag", videoElem);
            videoElem.onplay = this.onVideoPlay.bind(this);
            videoElem.onpause = this.onPausePlay.bind(this);
        } else {
            setTimeout(() => {
                this.setupEvents();
            }, 100);
        }
    }

    onVideoPlay(event){
        console.log("OnVideoPlay", event);
        this.startStatusPoll();
        setTimeout(() => {
            console.log("video started");
            this.hideBgImage();
        }, 1000);
    }

    onPausePlay (event) {
        console.log("onPause");
    }

    removeAdd(){
        let adContainer = document.querySelector('.ytp-ad-module');
        if(adContainer){
            console.log("found ad container");
            this.mutationObserver.observe(adContainer, {
                attributes: true,
                characterData: true,
                childList: true,
                subtree: true,
                attributeOldValue: true,
                characterDataOldValue: true
            });
        } else {
            setTimeout(() => {
                this.removeAdd();
            }, 100);
        }
    }

    pauseVideo(){
        this.isPause = true;
        console.log("this.playStatus", this.playStatus);
        console.log("pauseVideo");
        if(this.playStatus !== PLAYER_STATE_ENDED) {
            ImprovedTube.pause_video();
            this.updateStatus();
            this.stopStatusPoll();
        }
    }

    playVideo(){
        this.isPause = false;
        console.log("this.playStatus", this.playStatus);
        console.log("playVideo");
        if(this.playStatus !== PLAYER_STATE_ENDED) {
            ImprovedTube.play_video();
        } else if(this.playStatus === PLAYER_STATE_ENDED){
            this.changeVideo({
                video_id: this.prevVideoId
            });
        }
    }

    stopVideo() {
        console.log("stopVideo");
        ImprovedTube.stop_video();
        this.updateStatus();
        this.stopStatusPoll();
    }

    seekVideo(data){
        this.isSeeking = true; // Set seeking status to true for handling of media status
        console.log("this.playStatus", this.playStatus);
        console.log("SeekVideo", data);
        if(this.playStatus !== PLAYER_STATE_ENDED) {
            this.stopStatusPoll();
            ImprovedTube.seek_video(data.seconds);
            setTimeout(() => {
                this.isSeeking = false; // Set seeking status to false for handling of media status
                this.startStatusPoll();
            }, 500);
        }
    }

    changeVideo(data){
        const _changeVideo = _ => {
            this.stopStatusPoll();
            this.prevVideoId = videoId;
            this.prevState = 0;
            this.isPause = false;
            this.isPlaying = false;
            $('#error-screen').remove();
            ImprovedTube.change_video(videoId);
            this.startStatusPoll();
        }

        let videoId = data.video_id;
        if(this.prevVideoId !== videoId || this.playStatus === PLAYER_STATE_ENDED){
            _changeVideo();
        } else {
            console.log("this.prevVideoId", this.prevVideoId);
            console.log("videoId", videoId);
            console.log("this.playStatus", this.playStatus)
        }
    }

    startStatusPoll(){
        this.stopStatusPoll();
        this.isPlaying = true;
        this.stateInterval = setInterval(() => {
            this.updateStatus();
        }, this.updateStatusTime * 1000);
    }

    stopStatusPoll(){
        if(this.stateInterval){
            this.isPlaying = false;
            clearInterval(this.stateInterval);
        }
    }

    updateStatus(){
        ImprovedTube.update_video_status();
        setTimeout(() => {
            try{
                let playerData = JSON.parse(localStorage.getItem("player_data"));
                playerData.state = this.playerStates[playerData.state];
                console.log("Player Status", playerData.state);
                console.log("this.isPlaying", this.isPlaying);
                if(!this.isSeeking && this.isPlaying) { // If Video is seeking then do update status to server
                    if(playerData.state === PLAYER_STATE_ENDED) { // If video is ended then set duration to position
                        playerData.position = playerData.duration;
                    }
                    let videoInTheaterMode = getClosest(document.querySelector(".html5-video-player"), '#player-theater-container');
                    // console.log("videoInTheaterMode", videoInTheaterMode);
                    if(videoInTheaterMode) {
                        console.log("video started");
                    }
                    this.socket.emit('status', playerData);
                }
                this.playStatus = playerData.state;
                if(playerData.state === PLAYER_STATE_ENDED){
                    this.stopStatusPoll();
                    this.showBgImage()
                } else if(playerData.state === PLAYER_STATE_PAUSED){
                    this.stopStatusPoll();
                }
                this.playerState = playerData;
            } catch(e) {
                console.log(e);
            }
        }, 500);
    }

    requestFullScreen() {
        let player = document.querySelector(".html5-video-player");
        if(player){
            ImprovedTube.play_video();
        }else {
            setTimeout(() => {
                this.requestFullScreen();
            }, 100);
        }
    }

    forwardVideo(){
        console.log("this.playStatus", this.playStatus);
        console.log("Forward video");
        if(this.playStatus !== PLAYER_STATE_ENDED) {
            ImprovedTube.forward_video(this.fastForwardTime);
        }
    }

    rewindVideo(){
        console.log("this.playStatus", this.playStatus);
        console.log("Rewind video");
        if(this.playStatus !== PLAYER_STATE_ENDED) {
            ImprovedTube.rewind_video(this.fastForwardTime);
        }
    }

    addBGImg(){
        let bgURL = chrome.extension.getURL('assets/youtube_bg.jpg');
        
        let bgImg = document.createElement('img')
        bgImg.src = bgURL;

        let digitubeBG = document.createElement("div");
        digitubeBG.id = "digitube-bg";
        digitubeBG.setAttribute('class', "digitube-bg-img");
        digitubeBG.append(bgImg);
        if(document.body){
            document.body.append(digitubeBG);
        } else {
            setTimeout(() => {
                this.addBGImg();
            }, 1000);
        }
    }

    showBgImage(){
        if(document.getElementById('digitube-bg')){
            document.getElementById('digitube-bg').style = "display:block";
        } else {
            this.addBGImg();
        }
    }

    hideBgImage(){
        if(document.getElementById('digitube-bg')){
            document.getElementById('digitube-bg').style = "display:none";
        }
    }

    disableAutoPlay(){
        this.startStatusPoll();
        this.hideBgImage();
        this.autoPlayWait = setInterval(() => {
            let autoPlayToggle = document.querySelector('#related #head.ytd-compact-autoplay-renderer #toggle');
            console.log("autoPlayToggle", autoPlayToggle);
            if (autoPlayToggle) {
                clearInterval(this.autoPlayWait);
                if(this.isFirst){
                    this.isFirst = false;
                }
                if(autoPlayToggle.hasAttribute('active') || autoPlayToggle.hasAttribute('checked')){
                    autoPlayToggle.click();
                }
            }
        }, 250);
    }
}

function headReady (callback) {
    if (document.readyState === 'complete') {
      callback()
      return
    }
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          if (m.addedNodes && m.addedNodes[0] && m.addedNodes[0].nodeName === "BODY") {
              callback()
              observer.disconnect();
          }
        });
    });
    observer.observe(document.documentElement, {childList: true});
}

var getClosest = function (elem, selector) {
	for ( ; elem && elem !== document; elem = elem.parentNode ) {
		if ( elem.matches( selector ) ) return elem;
	}
	return null;
};

let adfilter = new adFilter(true)
let digitube = new DigitTube;

digitube.setupSocket();
digitube.setupEvents();

// Notify background so it can inject cosmetic filter
chrome.runtime.sendMessage({ action: 'PAGE_READY' }, data => {
    console.log("page_ready", data)
})