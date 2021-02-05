
var fields = {
    email: '#fm-login-id',
    password: '#fm-login-password',
    submit: '#login-form button.password-login'
  };
  
  var loginPopInterval;
  
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
  
  function manageLogin() {      
    socket.emit('onLoad', {
        page: "YoukuLoginPage"
    });
  }
  
  var socket;
  $.getJSON(chrome.extension.getURL('config.json'), function (settings) {
    var server = settings.server;
    socket = io(server.protocol + '://' + server.host + ':' + server.port + '/youku', {
      transports: ['websocket']
    });
    socket.on('connect', () => {
      console.log(socket.connected);
      setTimeout(manageLogin, 500);
    });
    socket.on('inputCommand', (command) => {
      if (command == "setusername") {
        changeInput({ field: 'email' });
      }else if (command == "setpassword") {
        changeInput({ field: 'password' });
      }else if (command == "setsignin") {
        clickButton({ field: 'submit' });
      } else {
        console.error("Invalide command " + command);
      }
    });
  });