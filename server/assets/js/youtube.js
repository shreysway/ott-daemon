class YouTube {

    constructor(){
        this.prevVideoId = null;
        this.sdkReady = false;
        this.playerReady = false;
        this.player = null;
        this.isPlaying = false;
        this.prevState = 0;
        this.stateInterval = null;
        this.fastForwardTime = 10; //In Seconds
    }

    onAPIReady(){
        youtube.sdkReady = true;
        this.socket.emit('ready');
        this.playerStates = {
            [YT.PlayerState.ENDED]: 'ENDED',
            [YT.PlayerState.PLAYING]: 'PLAYING',
            [YT.PlayerState.PAUSED]: 'PAUSED',
            [YT.PlayerState.BUFFERING]: 'BUFFERING',
            [YT.PlayerState.CUED]: 'CUED'
        };
        this.playerErrors = {
            2: {
                type:'invalid_video',
                message: 'The video you have requested is invalid!'
            },
            5: {
                type:'player_error',
                message: 'The video you have requested is not playing!'
            },
            100: {
                type:'not_found',
                message: 'The video requested was not found!'
            },
            101: {
                type:'player_error',
                message: 'The owner of the requested video does not allow it to be played!'
            }
        }
        this.playerErrors[105] = this.playerErrors[101];
    }

    setupScript(){
        let tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
        let firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    setupSocket(){
        this.socket = io('ws://' + location.host + '/youTube');
        this.socket.on('connect', () => {
            console.log("WebSocket Connected:", this.socket.connected); // true
        });
        this.socket.on('changeVideo', (data) => {
            console.log("changeVideoEvent:", data);
            let videoId = data.video_id;
            if (videoId && this.player){
                this.changeVideo(videoId);
            } else if(videoId){
                this.startPlayer(videoId);
            }
        });
        this.socket.on('pause', () => {
            this.player.pauseVideo();
        });
        this.socket.on('play', this.playVideo.bind(this));
        this.socket.on('stop', this.stopVideo.bind(this));
        this.socket.on('seek', this.seekVideo.bind(this));
        this.socket.on('forward', this.forwardVideo.bind(this));
        this.socket.on('rewind', this.rewindVideo.bind(this));
    }

    startPlayer(videoId){
        console.log("Start Player");
        this.prevVideoId = videoId;
        this.player = new YT.Player('player', {
            width: '3840',
            height: '2160',
            videoId: videoId,
            playerVars: {
              autoplay: 1,
              mute: 0,
              controls: 0,
              disablekb: 0,
              iv_load_policy: 3,
              modestbranding: 1,
              enablejsapi: 1,
              fs: 0,
              // origin: '',
              showinfo: 0,
              rel: 0
            },
            events: {
              'onReady': this.onPlayerReady.bind(this),
              'onStateChange': this.onPlayerStateChange.bind(this),
              'onError': this.onPlayerError.bind(this),
            }
        })
    }

    onPlayerError(error){
        console.log("PlayerError");
        console.log("Error:", error);
        let errorType = error.data;
        this.socket.emit('playerError', this.playerErrors[errorType]);
    }

    onPlayerReady(event) {
        console.log("PlayerReady");
        this.playerReady = true;
        this.player.playVideo();
    }

    onPlayerStateChange(event) {
        console.log("PlayerStateChange:", event);
        this.currentState = event.data;
        if(this.currentState === YT.PlayerState.ENDED){
            $('.loader').show();
            console.log("Video ended");
            this.updateStatus();
            clearInterval(this.stateInterval);
        }
        if(this.currentState === YT.PlayerState.PAUSED){
            console.log("Video paused");
            this.updateStatus();
            clearInterval(this.stateInterval);
        }
        if(this.currentState === YT.PlayerState.PLAYING){
            $('.loader').hide();
            console.log("Video is playing");
            clearInterval(this.stateInterval);
            this.startStatusPoll();
        }

        this.prevState = this.currentState;
    }

    playVideo(){
        clearInterval(this.stateInterval);
        this.player.playVideo();
    }

    stopVideo() {
        console.log("stopVideo", data);
        this.player.stopVideo();
        clearInterval(this.stateInterval);
    }

    seekVideo(data){
        console.log("SeekVideo", data);
        this.player.seekTo(data.seconds, true);
    }

    fullScreen() {
        let e = document.getElementById("player");
        if (e.requestFullscreen) {
            e.requestFullscreen();
        } else if (e.webkitRequestFullscreen) {
            e.webkitRequestFullscreen();
        } else if (e.mozRequestFullScreen) {
            e.mozRequestFullScreen();
        } else if (e.msRequestFullscreen) {
            e.msRequestFullscreen();
        }
    }

    changeVideo(videoId){
        clearInterval(this.stateInterval);
        console.log("Change Video");
        let state = this.player.getPlayerState();
        if(this.prevVideoId != videoId || (this.prevVideoId === videoId && state === YT.PlayerState.ENDED)){
            this.prevVideoId = videoId;
            this.prevState = 0;
            this.isPlaying = false;
            this.player.loadVideoById(videoId, 0, "default");
            this.player.playVideo();
        }
    }

    startStatusPoll(){
        this.updateStatus();
        if(this.stateInterval){
            clearInterval(this.stateInterval);
        }
        this.stateInterval = setInterval(() => {
            this.updateStatus();
        }, 1000);
    }

    updateStatus(){
        console.log("updateStatus called")
        let state = this.player.getPlayerState();
        let videoData = this.player.getVideoData();
        
        if(!videoData) return;

        let playerData = {
            title: videoData.title,
            author: videoData.author,
            state: this.playerStates[state],
            duration: this.player.getDuration(),
            position: this.player.getCurrentTime()
        }

        console.log("playerData", playerData);

        this.socket.emit('status', playerData);
    }

    forwardVideo(){
        console.log("Forward video");
        let duration = this.player.getCurrentTime();
        duration += this.fastForwardTime;
        this.seekVideo({
            seconds: duration
        });
    }

    rewindVideo(){
        console.log("Rewind video");
        let duration = this.player.getCurrentTime();
        duration -= this.fastForwardTime;
        this.seekVideo({
            seconds: duration
        });
    }
}

let youtube = new YouTube;

youtube.setupScript();
youtube.setupSocket();

function onYouTubeIframeAPIReady() {
    youtube.onAPIReady();
}