var profileDropdown = document.querySelectorAll('.ProfileDropdown__profile')[0];
var profileListItem = document.querySelectorAll('.ProfileList__profile-item')[0];
var profiles = document.querySelectorAll('[href*="/account/profiles"]')[0];
var account = document.querySelectorAll('[href*="/account"]')[0];
var signout = document.querySelectorAll('.ProfileDropdown__logout')[0];

if (profileDropdown && (profileListItem || profiles || account || signout)) {
	$.getJSON(chrome.extension.getURL('config.json'), function (settings) {
		var server = settings.server;
		var socket = io(server.protocol + '://' + server.host + ':' + server.port + '/hulu', {
			transports: ['websocket']
		});
		socket.on('connect', () => {
			console.log(socket.connected);
			socket.emit('onLoad', {
				page: "HuluAlreadyLoggedIn"
			});
		});
	});
}