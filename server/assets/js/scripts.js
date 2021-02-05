function WebSocketTest() {
  var moodObj = new Mood()
  if ('WebSocket' in window) {
    var ws = new WebSocket('ws://127.0.01:8010')
    ws.onopen = function() {
      console.log('Connected')
      ws.send('clientready')
    }
    ws.onmessage = function(evt) {
      var receivedData = evt.data
      let action = null,
        content = {}
      try {
        receivedData = JSON.parse(receivedData)
        action = receivedData.action
        content = receivedData.data
      } catch (e) {
        console.log('onmessage', e)
      }

      if (action == 'changemood') {
        moodObj.change(content.mood)
      }
      if (action == 'newguest') {
        new Guest(content.guest_name)
        moodObj.change(content.mood)
      }
    }
    ws.onclose = function() {
      console.log('Connection closed...')
    }
  } else {
    console.error('WebSocket NOT supported by your Browser!')
  }
}
WebSocketTest()
