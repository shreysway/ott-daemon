var trackEnd = false,
    trackPlayed = false,
    latitude = false,
    longitude = false;
    WPlayNext = true;

function SpotifyPlayer(socket) {
    this.socket = socket;
    this.player = null;
    this.latitude = '';
    this.longitude = '';
    this.isConnected = false;
    this.sdkReady = false;
    var isStartPlayer = false;
    var accessToken = null;
    var playerName = 'DigiValet Spotify Player';
    var playingTrackId = null;
    var trackPaused = true;

    this.initialize = function (data) {
        accessToken = data.access_token;
        playerName = data.roomname;
    }

    this.sendPlayerError = function(type, message) {
        if (this.socket == null) return;
        this.socket.emit('playerError', {
            type: type,
            message: message
        });
    }
    
    this.startPlayer = function (module) {
        if (this.player) {
            console.log("Player available disconnect and connect player");
            this.player.disconnect();
            setTimeout(() => {
                console.log("Connect after 1 sec.");
                this.player.connect().then(success => {
                    if (success) {
                        console.info('StartPlayer: Web Player successfully connected to Spotify!');
                    } else {
                        console.warning('StartPlayer: Web Player does not connect to Spotify!');
                    }
                });
            }, 1000);
        } else {
            if (this.sdkReady && accessToken) {
                this.player = new Spotify.Player({
                    name: playerName,
                    getOAuthToken: cb => { 
                        console.log("Called get OAuth Token");
                        cb(accessToken);
                    }
                });
    
                /**
                 * Emitted when the Spotify.Player fails to instantiate a player capable of playing
                 * content in the current environment. Most likely due to the browser not supporting EME
                 * protection.
                */
                this.player.addListener('initialization_error', ({ message }) => {
                    console.error(message);
                    this.isConnected = false;
                    this.sendPlayerError('initialization_error', "Failed to initialize");
                });

                /**
                 * Emitted when the Spotify.Player fails to instantiate a valid Spotify connection from
                 * the access token provided to getOAuthToken
                 */
                this.player.addListener('authentication_error', ({ message }) => {
                    console.error(message);
                    this.isConnected = false;
                    this.sendPlayerError('authentication_error', "Failed to authenticate");
                });

                /**
                 * Emitted when the user authenticated does not have a valid Spotify Premium subscription.
                 */
                this.player.addListener('account_error', ({ message }) => {
                    console.error(message);
                    this.isConnected = false;
                    this.sendPlayerError('premium_required', "Failed to validate Spotify account");
                });

                /**
                 * Emitted when loading and/or playing back a track failed.
                 */
                this.player.addListener('playback_error', ({ message }) => {
                    console.error(message);
                    this.sendPlayerError('playback_error', "Failed to perform playback")
                });
    
                // Playback status updates
                this.player.addListener('player_state_changed', state => {
                    console.log("trackEnd", trackEnd);
                    console.log("trackPlayed", trackPlayed);
                    console.log("trackState", state);
                    if (state) {
                        if (state.position == 0 && state.paused == true && !trackEnd && trackPlayed) {
                            trackEnd = true;
                            console.log("Track end");
                            trackPlayed = false;
                            if (uiType == "wspotify") {
                                if(WPlayNext){
                                    socket.emit('nextTrack', {
                                        hotel_id: wspotifyHotelId
                                    });
                                    WPlayNext = false;
                                    setTimeout(() => {
                                        WPlayNext = true
                                    }, 1000 * 60 * 2);
                                }
                            }
                        } else if (state.paused != true) {
                            trackEnd = false;
                        }
    
                        // check track played then send track detail to iPad via JAVA
                        if (state.position == 0 && state.paused == false && !trackPlayed) {
                            trackPlayed = true;
                            var trackDetail = state.track_window.current_track;
                            console.log("trackDetail", trackDetail)
                            if (this.latitude && this.longitude) {
                                experience.moveTo(this.latitude, this.longitude);
                            }
                        }
                    }
                });
    
                // Ready
                this.player.addListener('ready', ({ device_id }) => {
                    console.log('Ready with Device ID', device_id);
                    this.isConnected = true;
                    this.socket.emit('playerReady', {
                        device_id: device_id,
                        module: uiType
                    });
                    $('iframe').removeAttr('style').css({ height: '0', width: '0' });
                    // -----------------------------------------------------------------------------
                    // TEMPORARY CODE
                    $('#controls').removeClass('d-none');
                    // -----------------------------------------------------------------------------
                    this.pollPlayerState();
                });
    
                /** 
                 * Not Ready
                 * Emitted when the Web Playback SDK is not ready to play content,
                 * typically due to no internet connection.
                 */
                this.player.addListener('not_ready', ({ device_id }) => {
                    console.log('Device ID has gone offline', device_id);
                    this.socket.emit('playerError', {
                        device_id: device_id,
                        type: "not_ready",
                        message: "Device is not ready for playback"
                    });
                });
    
                // Connect to the player!
                this.player.connect().then(success => {
                    if (success) {
                        console.info('Web Player successfully connected to Spotify!');
                    } else {
                        console.warning('Web Player does not connect to Spotify!');
                    }
                });
            }
        }
    }

    this.setCordinates = function (latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }

    this.updateAccessToken = function (at) { 
        accessToken = at;
    }

    this.disconnectPlayer = function () {
        console.log("Destroy player");
        if (this.player) {
            this.player.disconnect();
        }
        this.isConnected = false;
    }

    this.connectPlayer = function () {
        this.isConnected = false;
        if (this.player) {
            this.player.disconnect();
            this.player.connect();
        }
    }    
    
    this.togglePlay = function () {
        this.player.togglePlay().then(() => {
            console.log('Toggled playback!');
        });
    }

    this.nextTrack = function () {
        this.player.nextTrack().then(() => {
            console.log('Skipped to next track!');
        });
    }

    this.previousTrack = function () {
        this.player.previousTrack().then(() => {
            console.log('Set to previous track!');
        });
    }

    this.seekTrack = function (data) { 
        let seek = Number(data.seek);
        if (!isNaN(seek)) {
            this.player.seek(seek).then(() => {
                console.log('Track position changed!');
            });
        } else {
            console.error("Invalide seek", data);
        }
    }

    this.setVolume = function (data) { 
        let volume = Number(data.volume);
        if (!isNaN(volume)) {
            volume /= 100;
            this.player.setVolume(volume).then(() => {
                console.log('Volume updated!');
            });
        } else {
            console.error("Invalide value", data);
        }
    }

    this.pollPlayerState = function () {
        if (this.isConnected) {
            setTimeout(() => {
                this.pollPlayerState();
            }, 3000);
        }
        if (this.player) {
            this.player.getCurrentState().then(state => {
                if (!state) {
                    // console.error('User is not playing music through the Web Playback SDK');
                    return;
                }
          
                let {
                    current_track,
                    next_tracks: [next_track]
                } = state.track_window;
          
                let artists = [];
                let trackImg = null;
                if (Array.isArray(current_track.artists)) {
                    for (let artist of current_track.artists) {
                        artists.push(artist.name);
                        if (artists.length >= 5) {
                            break;
                        }
                    }
                }
                if (current_track.album && current_track.album.images && Array.isArray(current_track.album.images)) {
                    for (let img of current_track.album.images) {
                        if (img.width === 300) {
                            trackImg = img.url;
                            break;
                        }
                    }
                }

                artists = artists.join(', ');
                let trackPos = state.position;
                let trackDur = state.duration;

                this.player.getVolume().then(volume => {
                    let playerState = {
                        "name": current_track.name,
                        "hotel_id": wspotifyHotelId,
                        "artists": artists,
                        "position": (trackPos > trackDur) ? trackDur : trackPos,
                        "duration": trackDur,
                        "paused": state.paused,
                        "volume": volume * 100,
                        "image": trackImg
                    };
                    this.socket.emit('playbackStatus', playerState);
                });
                if (playingTrackId != current_track.id) {
                    try{
                        text.setLargeText(current_track.name);
                        text.setSmallText(artists);
                    }catch(e){
                        console.log(e);
                    }
                    playingTrackId = current_track.id;
                }
            });
        }
    }
}

window.onSpotifyWebPlaybackSDKReady = () => {
    console.log("SDK Ready");
    sPlayer.sdkReady = true;
    // sPlayer.sdkReady();
    sPlayer.startPlayer();
};