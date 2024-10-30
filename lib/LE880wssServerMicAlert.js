"use strict";
const utils_1 = require('./utils');
const utils = utils_1.Utils.utils;
const util = require('util'); // inspect
const { exec, execSync } = require("child_process");

//
// https://github.com/websockets/ws
//
// https://www.npmjs.com/package/websocket
//
//

function ts(){
  return new Date().YYYYMMDDHHMMSSmmm() + " : ";
}

function ts1(){
  return new Date().YYYYMMDDHHMMSSmmm();
}

var LE880wss2Server = (function () {
  
  function LE880wss2Server(config) {
    
    utils.log.info(ts()+"LE880wssServerMicAlert.js");
    
    const port 	    = config.LE880wssServerMicAlert;
    const fs        = require('fs');
    const https     = require('https');
    const WebSocket = require('ws');
    const url       = require('url');
    
    const LOG	    = config.LOG;

    const server    = https.createServer({
      cert: fs.readFileSync('./ssl-certificates/LE880-wss-cert.pem'),
      key:  fs.readFileSync('./ssl-certificates/LE880-wss-key.pem')
    });
    
    //var websocketList = []; // use if more than two clients
    
    const wss1 = new WebSocket.Server({ noServer: true });
    
    var ws1    = null;
    
    //
    // wss1
    //

    wss1.on('connection', function connection(ws) {
      
      ws1 = ws;
      
      //utils.log.info(ts()+'LE880wssServerMicAlert.js wss1 ws:\n', util.inspect(ws, {showHidden: false, depth: null}));
      //utils.log.info(ts()+'LE880wssServerMicAlert.js wss1:\n', util.inspect(wss1, {showHidden: false, depth: null}));

      ws.on('message', function incoming(message) {
	
	//utils.log.info(ts()+'LE880wssServerMicAlert.js wss1 received: %s', message);
	
	//
	// browser
	//
	
	if(message == "Hello from browser"){
	  
	  ws.send('LE880wssServerMicAlert acknowledge, JSON now required');
	  
	  /* for development only */
	  
	  /*
	  var i	    = 1*1;
	  
	  setInterval(function(){
	    ws.send('{"wss2" : "' + i.toString() + '"}' );
	    //ws.send('JSON syntax error ' + i.toString());
	    
	    ++i;},
	    1000
	  );
	  */
	  
	  return;
	  
	}

	//
	// HELLO LE880_MIC_ALERT
	//

	if(message == "HELLO LE880_MIC_ALERT"){
	  
	  ws.send('LE880wss2Server acknowledge, JSON now required');
	  
	  /* for development only
	  
	  var i	    = 1*1;
	  
	  setInterval(function(){
	    //ws.send('{"wss2" : "' + i.toString() + '"}' );
	    ws.send('JSON syntax error ' + i.toString());
	    ++i;},
	    1000
	  );
	  */
	  
	  return;
	  
	}

	//
	// forward message from ws1 to ws2
	//
	
	//ws.send(message); // do not echo
	
	if(ws2 != null && message != ""){
	  ws2.send(message);
	  //utils.log.detail(ts()+'LE880wssServerMicAlert.js forwarded from ws1 to ws2: %s', message);
	  return;
	}
	
      });

    });

    //
    // wss2
    //
    
    const wss2 = new WebSocket.Server({ noServer: true });
    
    var ws2    = null;
    
    wss2.on('connection', function connection(ws) {
      
      ws2 = ws;
      
      //utils.log.info(ts()+'LE880wssServerMicAlert.js wss2 ws:\n', util.inspect(ws, {showHidden: false, depth: null}));
      //utils.log.info(ts()+'LE880wssServerMicAlert.js wss2:\n', util.inspect(wss2, {showHidden: false, depth: null}));      
      
      ws.on('message', function incoming(message) {
	
	//utils.log.info(ts()+'LE880wssServerMicAlert.js wss2 received: %s', message);
	
	//
	// browser
	//
	
	if(message == "Hello from browser"){
	  
	  ws.send('LE880wssServerMicAlert acknowledge, JSON now required');
	  
	  /* for development only */
	  
	  /*
	  var i	    = 1*1;
	  
	  setInterval(function(){
	    ws.send('{"wss2" : "' + i.toString() + '"}' );
	    //ws.send('JSON syntax error ' + i.toString());
	    
	    ++i;},
	    1000
	  );
	  */
	  
	  return;
	  
	}

	//
	// HELLO LE880_MIC_ALERT
	//

	if(message == "HELLO LE880_MIC_ALERT"){
	  
	  ws.send('LE880wss2Server acknowledge, JSON now required');
	  
	  /* for development only */
	  
	  /*
	  var i	    = 1*1;
	  
	  setInterval(function(){
	    ws.send('{"wss2" : "' + i.toString() + '"}' );
	    //ws.send('JSON syntax error ' + i.toString());
	    ++i;},
	    1000
	  );
	  */
	  
	  return;
	  
	}

	//
	// forward message from ws2 to ws1
	//
	
	//ws.send(message); // do not echo
	
	if(ws1 != null && message != ""){
	  ws1.send(message);
	  //utils.log.detail(ts()+'LE880wssServerMicAlert.js forwarded from ws2 to ws1: %s', message);
	  return;
	}
	
      });      
     
    });

    //
    // upgrade to websockets
    //

    server.on('upgrade', function upgrade(request, socket, head) {
      
      const pathname = url.parse(request.url).pathname;
      
      utils.log.info(ts()+'LE880wssServerMicAlert.js attempt upgrade pathname: %s', pathname);

      if (pathname === '/browser') {
	
	try {
	  var cmd = "sudo pkill -9 -f 'LE880-mic-set-level-02'";
	  execSync(cmd);
	  utils.log.info(ts()+"LE880wssServerMicAlert.js cmd: " + cmd);
	}
	
	catch(err) {
	    utils.log.info(ts()+"LE880wssServerMicAlert.js ERROR: " + err + ", cmd: " + cmd);
	}	     	
	
	wss1.handleUpgrade(request, socket, head, function done(ws) {
	  wss1.emit('connection', ws, request);
	});
	
	utils.log.info(ts()+'LE880wssServerMicAlert.js upgraded pathname: %s', pathname);
	
	setTimeout( function() {
	  
	  //
	  // pulseaudio must be run as pi
	  //

	  var semaphoreFile = process.cwd() + "/pulseaudio_cmd/wssServerMicAlert_" + ts1() + ".cmd";
	  
	  try {
	    
	    cmd = "/home/pi/LE880-Profile-T/c/LE880-mic-set-level-02 >> "+LOG+"LE880-mic-set-level-02.log 2>&1 &";
	    
	    fs.writeFileSync(semaphoreFile, cmd);
	    utils.log.info(ts()+"LE880wssServerMicAlert.js  SUCCESS fs.writeFileSync() semaphoreFile: " + semaphoreFile + "\ncmd: " + cmd);
	  }
	  catch (err) {
	    utils.log.error(ts()+"LE880wssServerMicAlert.js  ERROR fs.writeFileSync() semaphoreFile: " + semaphoreFile + "\nerr: " + err + "\ncmd: " + cmd);
	  }	  
	  
	}, 3000);	
	
      } else if (pathname === '/LE880_MIC_ALERT') {
	wss2.handleUpgrade(request, socket, head, function done(ws) {
	  wss2.emit('connection', ws, request);
	});
	
	utils.log.info(ts()+'LE880wssServerMicAlert.js upgraded pathname: %s', pathname);
	
      } else {
	socket.destroy();
      }
    });

    server.listen(port);
    
    //
    // start LE880-mic-set-level-02
    //
    // see also LE880main.js post root "this.webserver_admin.post('/', function (req, res)"
    //
    
    try {

      var cmd = "sudo pkill -9 -f 'LE880-mic-set-level-02'";
      
      execSync(cmd);
      utils.log.info(ts()+"LE880wssServerMicAlert.js cmd: " + cmd);
    }
    
    catch(err) {
	utils.log.info(ts()+"LE880wssServerMicAlert.js ERROR: " + err + ", cmd: " + cmd);
    }	     

    setTimeout( function() {
      
      //
      // pulseaudio must be run as pi
      //

      var semaphoreFile = process.cwd() + "/pulseaudio_cmd/wssServerMicAlert_" + ts1() + ".cmd";
      
      try {
	
	cmd = "/home/pi/LE880-Profile-T/c/LE880-mic-set-level-02 >> "+LOG+"LE880-mic-set-level-02.log 2>&1 &";
	
	fs.writeFileSync(semaphoreFile, cmd);
	utils.log.info(ts()+"LE880wssServerMicAlert.js  SUCCESS fs.writeFileSync() semaphoreFile: " + semaphoreFile + "\ncmd: " + cmd);
      }
      catch (err) {
	utils.log.error(ts()+"LE880wssServerMicAlert.js  ERROR fs.writeFileSync() semaphoreFile: " + semaphoreFile + "\nerr: " + err + "\ncmd: " + cmd);
      }
      
    }, 3000);
    
  }
  
   return LE880wss2Server;
    
}());

module.exports = LE880wss2Server;
