var fields = {
  email: '#id_userLoginId',
  password: '#id_password',
  submit: '.login-button'
};

var socket;

function changeInput(data) {
  var field = document.querySelector(fields[data.field]);
  console.log('Field:', data.field, field)
  field.select();
  field.dispatchEvent(new Event('focus'));

  var field = fields[data.field];

  console.log('Field 1:', data.field, field)

  var target = jQuery(field)[0];
  var event = document.createEvent("HTMLEvents");
  jQuery(field).val("");
  event.initEvent("input", true, true);
  target.dispatchEvent(event);
}

function changeText(data) {
  var field = fields[data.field];
  var target = jQuery(field)[0]
  var event = document.createEvent("HTMLEvents");
  jQuery(field).val(data.value);
  event.initEvent("input", true, true);
  target.dispatchEvent(event);
}

function clickButton(data) {
  var field = document.querySelector(fields[data.field]);
  field.focus()
  field.click();
}

$(document).ready(function(){
  console.log('Document is ready');

  $.getJSON(chrome.extension.getURL('config.json'), function (settings) {
    var server = settings.server;
    socket = io(server.protocol + '://' + server.host + ':' + server.port + '/netflix', {
      transports: ['websocket']
    });
    socket.on('connect', () => {
      console.log(socket.connected); // true
      socket.emit('onLoad', {
        page: "NetflixLoginPage"
      });
    });
    socket.on('inputCommand', (command) => {
      console.log("Received command:", command);
      if (command == "setusername") {
        changeInput({ field: 'email' });
      } else if (command == "setpassword") {
        changeInput({ field: 'password' });
      } else if (command == "setsignin") {
        clickButton({ field: 'submit' });
      } else {
        console.error("Invalid command " + command);
      }
    });
  });
});