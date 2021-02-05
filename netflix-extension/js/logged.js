var accountMenuItem = document.getElementsByClassName('account-menu-item');
var listProfile = document.getElementsByClassName('list-profiles');
var manageProfileBtn = document.querySelectorAll('[href*="ManageProfiles"]')[0];
var socket;
if (accountMenuItem || listProfile || manageProfileBtn) {
	$.getJSON(chrome.extension.getURL('config.json'), function (settings) {
		var server = settings.server;
		socket = io(server.protocol + '://' + server.host + ':' + server.port + '/netflix', {
			transports: ['websocket']
		});
		socket.on('connect', () => {
			console.log(socket.connected); // true
			socket.emit('onLoad', {
				page: "NetflixAlreadyLoggedIn"
			});
		});

		socket.on('back', () => {
			if (window.location.href !== "https://www.netflix.com/browse/"
				&& window.location.href !== "https://www.netflix.com/browse") {
				history.back();
			}
		});

		socket.on('search', () => {
			$('.searchTab').click();
		});
	});
}

$(document).on('click', '.searchTab', function () { 
	console.log("Search tab clicked");
	console.log("socket", socket);
	socket.emit('netflixkeyboard', {
		page: "netflixkeyboard"
	});
});

$(document).on('click', '.searchInput input', function () { 
	console.log("Search input clicked");
	console.log("socket", socket);
	socket.emit('netflixkeyboard', {
		page: "netflixkeyboard"
	});
});