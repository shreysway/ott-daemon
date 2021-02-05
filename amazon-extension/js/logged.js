var watchlist = document.querySelectorAll('[href*="/watchlist/ref=atv_nb_wtl"]')[0];
var settings = document.querySelectorAll('[href*="/settings/ref=atv_nb_set"]')[0];
var watchAnywhere = document.querySelectorAll('[href*="/splash/watchAnywhere/ref=atv_nb_wa"]')[0];
var signout = document.querySelectorAll('[href*="/gp/flex/video/ref=atv_nb_sign_out?action=sign-out"]')[0];

// const style = getComputedStyle(document.querySelector('#pv-nav-accounts'));

// if (style.display == "block"
// 	&& (watchlist || settings || watchAnywhere || watchAnywhere || signout)) {
// 	$.getJSON(chrome.extension.getURL('config.json'), function (settings) {
// 		var server = settings.server;
// 		var socket = io(server.protocol + '://' + server.host + ':' + server.port + '/amazon', {
// 			transports: ['websocket']
// 		});
// 		socket.on('connect', () => {
// 			console.log(socket.connected);
// 			socket.emit('onLoad', {
// 				page: "AmazonAlreadyLoggedIn"
// 			});
// 			$("#pv-nav-accounts").off();
// 		});
// 	});
// }


chrome.extension.onMessage.addListener(data => {
	console.log("data", data);
	if(data.action == "reload"){

	}
});

let isLangSet = localStorage.getItem('is_lang_set');

if(!isLangSet){
	localStorage.setItem('is_lang_set', true);

	chrome.runtime.sendMessage({
		type: "setCookie"
	});
}


