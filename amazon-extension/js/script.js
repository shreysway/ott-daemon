
var fields = {
  email: '#ap_email',
  password: '#ap_password',
  submit: '#signInSubmit'
};

function changeInput(data){
  var field = document.querySelector(fields[data.field]);
  field.select();
  field.dispatchEvent(new Event('focus'));

  var field = fields[data.field];
  var target = jQuery(field)[0]
  var event = document.createEvent("HTMLEvents");
  jQuery(field).val("");
  event.initEvent("input", true, true);
  target.dispatchEvent(event);
}

function changeText(data){
  var field = fields[data.field];
  var target = jQuery(field)[0]
  var event = document.createEvent("HTMLEvents");
  jQuery(field).val(data.value);
  event.initEvent("input", true, true);
  target.dispatchEvent(event);
}

function clickButton(data){
  var field = document.querySelector(fields[data.field]);
  field.focus()
  field.click();
}

var socket
// $.getJSON(chrome.extension.getURL('config.json'), function (settings) {
//   var server = settings.server;
//   socket = io(server.protocol + '://' + server.host + ':' + server.port + '/amazon', {
//     transports: ['websocket']
//   });
//   socket.on('connect', () => {
//     console.log(socket.connected);
//     socket.emit('onLoad', {
//       page: "AmazonLoginPage"
//     });
//   });
//   socket.on('inputCommand', (command) => {
//     if (command == "setusername") {
//       changeInput({ field: 'email' });
//     }else if (command == "setpassword") {
//       changeInput({ field: 'password' });
//     }else if (command == "setsignin") {
//       clickButton({ field: 'submit' });
//     } else {
//       console.error("Invalide command " + command);
//     }
//   });
// });