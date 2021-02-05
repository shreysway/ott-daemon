// Connect Socket
var socket = io('ws:' + '//' + location.host + '/inRoomExperience', {
    transports: ['websocket']
});

let uiType, wspotifyHotelId;
let isWMusicF = true;

var sPlayer = new SpotifyPlayer(socket);

socket.on('connect', () => {
    console.log(socket.connected); // true
});

socket.on("startPlayer", (response) => { 
    console.log("startPlayer");
    sPlayer.initialize(response);
    sPlayer.startPlayer(response.module);
    setUIExperience(response.module);
});

socket.on("stopPlayer", function () {
    sPlayer.disconnectPlayer();
});

socket.on("destroyPlayer", function () {
    sPlayer.disconnectPlayer();
});

socket.on("connectPlayer", function () { 
    sPlayer.connectPlayer();
});

socket.on("playTrack", function (trackDetail) {
    wspotifyHotelId = trackDetail.wspotifyHotelId;
    trackPlayed = false;
    if(trackDetail.latitude && trackDetail.longitude){
        sPlayer.setCordinates(trackDetail.latitude, trackDetail.longitude)
    }
    setUIExperience(trackDetail.module);
});

socket.on("togglePlayback", function () {
    sPlayer.togglePlay();
});

socket.on("nextTrack", function () {
    sPlayer.nextTrack();
});

socket.on("previousTrack", function () {
    sPlayer.previousTrack();
});

socket.on("seekTrack", function (data) {
    sPlayer.seekTrack(data);
});

socket.on("setVolume", function (data) {
    sPlayer.setVolume(data);
});

socket.on("updateAccessToken", function (data) {
    sPlayer.updateAccessToken(data.access_token)
});

socket.on("changeMood", function (data) {
    setUIExperience("wmusic", data);
    var timeOut = (isWMusicF) ? 1000 : 0;
    setTimeout(function(){
        mood.change(data.mood);
    }, timeOut);
});

socket.on("updateMetaData", function (data) {
    setUIExperience("wmusic");
    text.setLargeText(data.title);
    text.setSmallText(data.subtitle);
});

socket.on("updateGuestData", function (data) {
    setUIExperience("wmusic");
    new Guest(data.guestName);
});

function setUIExperience(type, data){
    uiType = type;
}