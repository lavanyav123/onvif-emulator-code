"use strict";
var utils_1 = require('./utils');
var fs = require('fs');
var parser = require('body-parser');
var utils = utils_1.Utils.utils;
const util = require('util'); // inspect
const { exec, execSync } = require("child_process");
const Gpio 	= require('onoff').Gpio;

function ts(){
  return new Date().YYYYMMDDHHMMSSmmm() + " : ";
}

function ts1(){
  return new Date().YYYYMMDDHHMMSSmmm();
}

var LE880gpio = (function () {
    
  function LE880gpio() {
    
      var _this 	= this;
      this.buildLE880gpio();
      
  }

 LE880gpio.prototype.alertEvent = function (Output)
 {
	utils.log.info(ts()+"LE880gpio.js alertEvent ");
	if( Output == "OP1") 
		//OP1.writeSync(1);
		utils.log.info(ts()+"turn oN OP1");
	else if( Output == "OP2")
		OP2.writeSync(1);
	else if(Output == "OP3")
	    OP3.writeSync(1);
	else if(Output == "OP4")
		OP4.writeSync(1);			
 } 
  
  LE880gpio.prototype.buildLE880gpio = function () {

    var jsonObj = {"LE880gpio" : "ok" };
    
    const IPReset 	= new Gpio(4,  'in', 'both', {debounceTimeout: 500});	// J8-7
    const IP1 		= new Gpio(17, 'in', 'both', {debounceTimeout: 100}); 	// J8-11
    const IP2 		= new Gpio(27, 'in', 'both', {debounceTimeout: 200}); 	// J8-13
    const IP3 		= new Gpio(22, 'in', 'both', {debounceTimeout: 300}); 	// J8-15
    const IP4 		= new Gpio(5,  'in', 'both', {debounceTimeout: 400}); 	// J8-29

    const OPLED 	= new Gpio(12, 'out');		// J8-32 
    const OP1 		= new Gpio(26,  'out');		// J8-37 
    const OP2		= new Gpio(16, 'out');		// J8-36 
    const OP3 		= new Gpio(13, 'out');		// J8-33 
    const OP4 		= new Gpio(6, 'out');		// J8-31

    IPReset.setActiveLow(true);
    IP1.setActiveLow(true);
    IP2.setActiveLow(true);
    IP3.setActiveLow(true);
    IP4.setActiveLow(true);

    //OPLED.setActiveLow(true);
    //OP1.setActiveLow(true);
    //OP2.setActiveLow(true);
    //OP3.setActiveLow(true);
    //OP4.setActiveLow(true);
    
    utils.log.info(ts()+"LE880gpio.js Initial IPReset : " + IPReset.readSync());
    utils.log.info(ts()+"LE880gpio.js Initial IP1 : " + IP1.readSync());
    utils.log.info(ts()+"LE880gpio.js Initial IP2 : " + IP2.readSync());
    utils.log.info(ts()+"LE880gpio.js Initial IP3 : " + IP3.readSync());
    utils.log.info(ts()+"LE880gpio.js Initial IP3 : " + IP4.readSync());

    utils.log.info(ts()+"LE880gpio.js Initial OPLED : " + OPLED.readSync());
    utils.log.info(ts()+"LE880gpio.js Initial OP1 : " + OP1.readSync());
    utils.log.info(ts()+"LE880gpio.js Initial OP2 : " + OP2.readSync());
    utils.log.info(ts()+"LE880gpio.js Initial OP3 : " + OP3.readSync());
    utils.log.info(ts()+"LE880gpio.js Initial OP3 : " + OP4.readSync());
    
    var config     = null;
    var configUser = null;

    delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
    config 		= require(process.cwd() + "/LE880factoryConfig.json");
    //utils.log.info(ts()+"LE880gpio.js config: " + util.inspect(config, {showHidden: false, depth: null})); 
    
    delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
    configUser 	= require(process.cwd() + "/LE880userConfig.json");
    //utils.log.info(ts()+"LE880gpio.js configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));	    
       
    //
    // short press for reboot
    //
    // long press for Reset to Factory Defaults
    //
	if(configUser.OPLED_OL_checked=="high")
	{
		OPLED.writeSync(1);
	}
	else
	{
		OPLED.writeSync(0);
	}	
	if(configUser.OP1_OL_checked=="high")
	{
		OP1.writeSync(1);
	}
	else
	{
		OP1.writeSync(0);	
	}

	if(configUser.OP2_OL_checked=="high")
	{
		OP2.writeSync(1);
	}
	else
	{
		OP2.writeSync(0);	
	}

	if(configUser.OP3_OL_checked=="high")
	{
		OP3.writeSync(1);
	}
	else
	{
		OP3.writeSync(0);	
	}

	if(configUser.OP4_OL_checked=="high")
	{
		OP4.writeSync(1);
	}
	else
	{
		OP4.writeSync(0);	
	}
	
    var tOn  = null;
    var tOff = null;
    var tLen = null;
    
    //utils.log.info(ts()+"LE880gpio.js config.Reset_to_Factory_Defaults_min : " + config.Reset_to_Factory_Defaults_min);
    //utils.log.info(ts()+"LE880gpio.js config.Reboot_min : " + config.Reboot_min);
    //utils.log.info(ts()+"LE880gpio.js config.Reboot_max : " + config.Reboot_max);
    
    //
    // IPReset
    //

    IPReset.watch((err, value) => {
      
      if (err) {
	throw err;
      }
      
      if(value == 1*1) {
	
	tOn = Date.now();
	utils.log.info(ts()+"LE880gpio.js IPReset = " + value + ", tOn = " + (tOn/1000));
	tOff = null;
	
      } else if (tOn && value == 0*1) {
	
	tOff = Date.now();
	utils.log.info(ts()+"LE880gpio.js IPReset = " + value + ", tOff = " + (tOff/1000));
	
	tLen = tOff - tOn;
	utils.log.info(ts()+"LE880gpio.js IPReset = " + value + ", tLen = " + (tLen/1000));
	
	if(tLen && tLen > config.Reset_to_Factory_Defaults_min * 1000){
	  
	  utils.log.info(ts()+"LE880gpio.js long press, tLen = " + (tLen/1000));
	  
	  //
	  // Reset to Factory Defaults
	  //
	  // reset each key in configUser to config value
	  //
	  // get current config and configUser
	  //
	  
	  delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	  config 		= require(process.cwd() + "/LE880factoryConfig.json");
	  //utils.log.info(ts()+"LE880gpio.js config: " + util.inspect(config, {showHidden: false, depth: null}));
	  
	  delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	  configUser 	= require(process.cwd() + "/LE880userConfig.json");
	  //utils.log.info(ts()+"LE880gpio.js configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));	  

	  Object.keys(configUser).forEach(key => {
	      configUser[key] = config[key];
	  });
	  
	  //utils.log.info(ts()+"LE880gpio.js long press resetFactory configUser: " + util.inspect(configUser, {showHidden: false, depth: null}));
	  
	  //
	  // save new configUser values
	  //

	  try { 
	    fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser));
	    utils.log.info(ts()+'LE880gpio.js long press resetFactory updated: fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser))');
	  }
	  catch { 
	    utils.log.error(ts()+'LE880gpio.js long press resetFactory fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser))');
	  }

	  //
	  // send message to browser for reload
	  //
	  
	  var msg  = "Resetting factory default configuation values, rebooting LE880, and setting DHCP.";
	      msg += "<br>Your IP address may be changed by DHCP if you were using a static IP address.";
	      msg += "<br>You may need to manually enter the DHCP generated IP address in your browser and log in.";	  
	  
	  var msgJSON = { "sentFile" : "resetFactory.json", "resetFactory" : true, "msg" : msg };

	  var s2cSignalOutFile = process.cwd() + "/s2cSignalOut/resetFactory.json";
	  //utils.log.info(ts()+"LE880gpio.js long press s2cSignalOutFile : " + s2cSignalOutFile);

	  try { fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON)); }
	  catch { utils.log.error(ts()+"LE880gpio.js long press fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON))")};

	  tOn = null;
	  tOff = null;
	  tLen = null;
	  
	  //
	  // sudo cp /etc/dhcpcd_LE880.conf.backup /etc/dhcpcd.conf; sleep 5; sudo reboot;
	  //
	  
	  var cmd = "sudo cp /etc/dhcpcd_LE880.conf.backup /etc/dhcpcd.conf; sleep 5; sudo reboot;";
	  
	  try {
	    utils.log.info(ts()+'LE880gpio.js longpress exec(cmd): ' + cmd);
	    exec(cmd);
	  }
	  catch {
	    utils.log.error(ts()+'LE880gpio.js longpress ERROR exec(cmd): ' + cmd);
	  }
	  
	} else if (tLen && tLen > config.Reboot_min * 1000 && tLen < config.Reboot_max * 1000) {
	  
	  utils.log.info(ts()+"LE880gpio.js shortpress, tLen = " + (tLen/1000));

	  //
	  // send message to browser for reboot
	  //
	  
	  var msgJSON = { "sentFile" : "reboot.json", "reboot" : true };

	  var s2cSignalOutFile = process.cwd() + "/s2cSignalOut/reboot.json";
	  //utils.log.info(ts()+"LE880gpio.js long press s2cSignalOutFile : " + s2cSignalOutFile);

	  try { fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON)); }
	  catch { utils.log.error(ts()+"LE880gpio.js long press fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON))")};

	  function rebootNow(){
	    var cmd = "sudo reboot";
	    exec(cmd);
	    if (err){ 
	      utils.log.error(ts()+"LE880gpio.js ERROR cmd: " + cmd + ", err: " + err);
	    }	    
	  }
	  
	  setTimeout(rebootNow, 5000);

	} // shortpress
	
      }
      
      utils.log.info(ts()+"LE880gpio.js IPReset : " + value);
      OPLED.writeSync(value);
      
    }); // IPReset
     
     //
     // IP1
     //
        
    IP1.watch((err, value) => {
      
      if (err) {
	throw err;
      }

      //
      // get current config and configUser
      //
      
      delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
      config 		= require(process.cwd() + "/LE880factoryConfig.json");
      //utils.log.info(ts()+"LE880gpio.js config: " + util.inspect(config, {showHidden: false, depth: null}));
      
      delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
      configUser 	= require(process.cwd() + "/LE880userConfig.json");
      //utils.log.info(ts()+"LE880gpio.js configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));
      
      utils.log.info(ts()+"LE880gpio.js IP1 : " + value);
      //OP1.writeSync(value);
      
      var arr = config.gpio_output_ports;
      //utils.log.info(ts()+"LE880gpio.js arr.toString() : " + arr.toString());
      
      arr.forEach(function(p){
      
	//utils.log.info(ts()+"LE880gpio.js p : " + p);
      
	if(configUser[p + "_trig_checked"] == "IP1" && configUser[p + "_HTTPS_checked"] == "https"){

	  //
	  // use axios like cURL for HTTPS POST with same headers as AJAX
	  //
	  
	  var url = configUser[p + "_POST_URL"]; // url for alerts to remote computer
	  
	  //var outJSON = { "axiosK1" : "axiosV1" }; // for test
	  //var outStr  = JSON.stringify(outJSON);
	  
	  var jsonObj = {
	    "k1" : configUser[p + "_k1"],
	    "v1" : configUser[p + "_v1"],
	    "k2" : configUser[p + "_k2"],
	    "v2" : configUser[p + "_v2"],
	    "k3" : configUser[p + "_k3"],
	    "v3" : configUser[p + "_v3"],
	    "k4" : configUser[p + "_k4"],
	    "v4" : configUser[p + "_v4"]
	  };
	  	  
	  var outStr = JSON.stringify(jsonObj);
	  
	  const axios = require('axios')
	  const https = require('https');
	  
	  const agent = new https.Agent({  
	    rejectUnauthorized: false
	  });
	  
	  var options = { headers: {
	    'accept': 'application/json, text/javascript, */*; q=0.01',
	    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
	    'content-length': outStr.length
	    }, httpsAgent: agent };
	  
	  axios.post(url, outStr, options) // use same headers as ajax

	    .then(function (response) {
	      //utils.log.info(ts()+"LE880gpio.js IP1 axios post response: " + response);
	      //utils.log.info(ts()+"LE880gpio.js IP1 request response.data: " + util.inspect(response.data, {showHidden: false, depth: null}));
	      
	      //
	      // use s2cSignal to display on messageBar
	      //
	      
	      var msg  = "Alert POST sent to " + configUser[p + "_POST_URL"];
		  msg += "<br><br>";
		  msg += "POST data: " + outStr;
		  msg += "<br><br>";
		  msg += "Response: " + util.inspect(response.data, {showHidden: false, depth: null});		
		  
	      var msgJSON = { "sentFile" : "alertPOST.json", "toClient" : "messageBar", "messageBar" : msg };

	      var s2cSignalOutFile = process.cwd() + "/s2cSignalOut/alertPOST.json";
	      utils.log.info(ts()+"LE880gpio.js IP1 " + p + " s2cSignalOutFile : " + s2cSignalOutFile);

	      try { fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON)); }
	      catch { utils.log.error(ts()+"LE880gpio.js IP1 fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON))")};
	      
	    })
	    
	    .catch(function (error) {
	      utils.log.error(ts()+"LE880gpio.js IP1 axios post error: " + error);
	    });

	} // if(configUser.OPLED_trig_checked == "IP1" && configUser.OPLED_HTTPS_checked == "https")

	if(configUser[p + "_trig_checked"] == "IP1" && configUser[p + "_Duration"] > 0){

	  OP1.writeSync(1);
	  setTimeout(function(){OP1.writeSync(0)}, configUser.OP1_Duration * 1000);
	  
	} // if(configUser.OPLED_trig_checked == "IP1" && configUser.OPLED_Duration > 0)

      }); // forEach
    
    }); // IP1
    
    //
    // IP2
    //

    IP2.watch((err, value) => {
      
      if (err) {
	throw err;
      }
      
      //
      // get current config and configUser
      //
      
      delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
      config 		= require(process.cwd() + "/LE880factoryConfig.json");
      //utils.log.info(ts()+"LE880gpio.js config: " + util.inspect(config, {showHidden: false, depth: null}));
      
      delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
      configUser 	= require(process.cwd() + "/LE880userConfig.json");
      //utils.log.info(ts()+"LE880gpio.js configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));
      
      utils.log.info(ts()+"LE880gpio.js IP2 : " + value);
      //OP2.writeSync(value);
      
      var arr = config.gpio_output_ports;
      //utils.log.info(ts()+"LE880gpio.js arr.toString() : " + arr.toString());
      
      arr.forEach(function(p){
      
	//utils.log.info(ts()+"LE880gpio.js p : " + p);
      
	if(configUser[p + "_trig_checked"] == "IP2" && configUser[p + "_HTTPS_checked"] == "https"){

	  //
	  // use axios like cURL for HTTPS POST with same headers as AJAX
	  //
	  
	  var url = configUser[p + "_POST_URL"]; // url for alerts to remote computer
	  
	  //var outJSON = { "axiosK1" : "axiosV1" }; // for test
	  //var outStr  = JSON.stringify(outJSON);
	  
	  var jsonObj = {
	    "k1" : configUser[p + "_k1"],
	    "v1" : configUser[p + "_v1"],
	    "k2" : configUser[p + "_k2"],
	    "v2" : configUser[p + "_v2"],
	    "k3" : configUser[p + "_k3"],
	    "v3" : configUser[p + "_v3"],
	    "k4" : configUser[p + "_k4"],
	    "v4" : configUser[p + "_v4"]
	  };
	  	  
	  var outStr = JSON.stringify(jsonObj);
	  
	  const axios = require('axios')
	  const https = require('https');
	  
	  const agent = new https.Agent({  
	    rejectUnauthorized: false
	  });
	  
	  var options = { headers: {
	    'accept': 'application/json, text/javascript, */*; q=0.01',
	    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
	    'content-length': outStr.length
	    }, httpsAgent: agent };
	  
	  axios.post(url, outStr, options) // use same headers as ajax

	    .then(function (response) {
	      //utils.log.info(ts()+"LE880gpio.js IP2 axios post response: " + response);
	      //utils.log.info(ts()+"LE880gpio.js IP2 request response.data: " + util.inspect(response.data, {showHidden: false, depth: null}));
	      
	      //
	      // use s2cSignal to display on messageBar
	      //
	      
	      var msg  = "Alert POST sent to " + configUser[p + "_POST_URL"];
		  msg += "<br><br>";
		  msg += "POST data: " + outStr;
		  msg += "<br><br>";
		  msg += "Response: " + util.inspect(response.data, {showHidden: false, depth: null});		
		  
	      var msgJSON = { "sentFile" : "alertPOST.json", "toClient" : "messageBar", "messageBar" : msg };

	      var s2cSignalOutFile = process.cwd() + "/s2cSignalOut/alertPOST.json";
	      utils.log.info(ts()+"LE880gpio.js IP2 " + p + " s2cSignalOutFile : " + s2cSignalOutFile);

	      try { fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON)); }
	      catch { utils.log.error(ts()+"LE880gpio.js IP2 fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON))")};
	      
	    })
	    
	    .catch(function (error) {
	      utils.log.error(ts()+"LE880gpio.js IP2 axios post error: " + error);
	    });

	} // if(configUser.OPLED_trig_checked == "IP2" && configUser.OPLED_HTTPS_checked == "https")

	if(configUser[p + "_trig_checked"] == "IP2" && configUser[p + "_Duration"] > 0){

	  OP2.writeSync(1);
	  setTimeout(function(){OP2.writeSync(0)}, configUser.OP2_Duration * 1000);
	  
	} // if(configUser.OPLED_trig_checked == "IP2" && configUser.OPLED_Duration > 0)

      }); // forEach
      
    }); // IP2

    //
    // IP3
    //
    
    IP3.watch((err, value) => {
      
      if (err) {
	throw err;
      }
      
      //
      // get current config and configUser
      //
      
      delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
      config 		= require(process.cwd() + "/LE880factoryConfig.json");
      //utils.log.info(ts()+"LE880gpio.js config: " + util.inspect(config, {showHidden: false, depth: null}));
      
      delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
      configUser 	= require(process.cwd() + "/LE880userConfig.json");
      //utils.log.info(ts()+"LE880gpio.js configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));
      
      utils.log.info(ts()+"LE880gpio.js IP3 : " + value);
      //OP3.writeSync(value);
      
      var arr = config.gpio_output_ports;
      //utils.log.info(ts()+"LE880gpio.js arr.toString() : " + arr.toString());
      
      arr.forEach(function(p){
      
	//utils.log.info(ts()+"LE880gpio.js p : " + p);
      
	if(configUser[p + "_trig_checked"] == "IP3" && configUser[p + "_HTTPS_checked"] == "https"){

	  //
	  // use axios like cURL for HTTPS POST with same headers as AJAX
	  //
	  
	  var url = configUser[p + "_POST_URL"]; // url for alerts to remote computer
	  
	  //var outJSON = { "axiosK1" : "axiosV1" }; // for test
	  //var outStr  = JSON.stringify(outJSON);
	  
	  var jsonObj = {
	    "k1" : configUser[p + "_k1"],
	    "v1" : configUser[p + "_v1"],
	    "k2" : configUser[p + "_k2"],
	    "v2" : configUser[p + "_v2"],
	    "k3" : configUser[p + "_k3"],
	    "v3" : configUser[p + "_v3"],
	    "k4" : configUser[p + "_k4"],
	    "v4" : configUser[p + "_v4"]
	  };
	  	  
	  var outStr = JSON.stringify(jsonObj);
	  
	  const axios = require('axios');
	  const https = require('https');
	  
	  const agent = new https.Agent({  
	    rejectUnauthorized: false
	  });
	  
	  var options = { headers: {
	    'accept': 'application/json, text/javascript, */*; q=0.01',
	    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
	    'content-length': outStr.length
	    }, httpsAgent: agent };
	  
	  axios.post(url, outStr, options) // use same headers as ajax

	    .then(function (response) {
	      //utils.log.info(ts()+"LE880gpio.js IP3 axios post response: " + response);
	      //utils.log.info(ts()+"LE880gpio.js IP3 request response.data: " + util.inspect(response.data, {showHidden: false, depth: null}));
	      
	      //
	      // use s2cSignal to display on messageBar
	      //
	      
	      var msg  = "Alert POST sent to " + configUser[p + "_POST_URL"];
		  msg += "<br><br>";
		  msg += "POST data: " + outStr;
		  msg += "<br><br>";
		  msg += "Response: " + util.inspect(response.data, {showHidden: false, depth: null});		
		  
	      var msgJSON = { "sentFile" : "alertPOST.json", "toClient" : "messageBar", "messageBar" : msg };

	      var s2cSignalOutFile = process.cwd() + "/s2cSignalOut/alertPOST.json";
	      utils.log.info(ts()+"LE880gpio.js IP3 " + p + " s2cSignalOutFile : " + s2cSignalOutFile);

	      try { fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON)); }
	      catch { utils.log.error(ts()+"LE880gpio.js IP3 fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON))")};
	      
	    })
	    
	    .catch(function (error) {
	      utils.log.error(ts()+"LE880gpio.js IP3 axios post error: " + error);
	    });

	} // if(configUser.OPLED_trig_checked == "IP3" && configUser.OPLED_HTTPS_checked == "https")

	if(configUser[p + "_trig_checked"] == "IP3" && configUser[p + "_Duration"] > 0){

	  OP3.writeSync(1);
	  setTimeout(function(){OP3.writeSync(0)}, configUser.OP3_Duration * 1000);
	  
	} // if(configUser.OPLED_trig_checked == "IP3" && configUser.OPLED_Duration > 0)

      }); // forEach
      
    }); // IP3

    //
    // IP4
    //
    
    IP4.watch((err, value) => {
      
      if (err) {
	throw err;
      }
      
      //
      // get current config and configUser
      //
      
      delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
      config 		= require(process.cwd() + "/LE880factoryConfig.json");
      //utils.log.info(ts()+"LE880gpio.js config: " + util.inspect(config, {showHidden: false, depth: null}));
      
      delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
      configUser 	= require(process.cwd() + "/LE880userConfig.json");
      //utils.log.info(ts()+"LE880gpio.js configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));
      
      utils.log.info(ts()+"LE880gpio.js IP4 : " + value);
      //OP4.writeSync(value);
      
      var arr = config.gpio_output_ports;
      //utils.log.info(ts()+"LE880gpio.js arr.toString() : " + arr.toString());
      
      arr.forEach(function(p){
      
	//utils.log.info(ts()+"LE880gpio.js p : " + p);
      
	if(configUser[p + "_trig_checked"] == "IP4" && configUser[p + "_HTTPS_checked"] == "https"){

	  //
	  // use axios like cURL for HTTPS POST with same headers as AJAX
	  //
	  
	  var url = configUser[p + "_POST_URL"]; // url for alerts to remote computer
	  
	  //var outJSON = { "axiosK1" : "axiosV1" }; // for test
	  //var outStr  = JSON.stringify(outJSON);
	  
	  var jsonObj = {
	    "k1" : configUser[p + "_k1"],
	    "v1" : configUser[p + "_v1"],
	    "k2" : configUser[p + "_k2"],
	    "v2" : configUser[p + "_v2"],
	    "k3" : configUser[p + "_k3"],
	    "v3" : configUser[p + "_v3"],
	    "k4" : configUser[p + "_k4"],
	    "v4" : configUser[p + "_v4"]
	  };
	  	  
	  var outStr = JSON.stringify(jsonObj);
	  
	  const axios = require('axios')
	  const https = require('https');
	  
	  const agent = new https.Agent({  
	    rejectUnauthorized: false
	  });
	  
	  var options = { headers: {
	    'accept': 'application/json, text/javascript, */*; q=0.01',
	    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
	    'content-length': outStr.length
	    }, httpsAgent: agent };
	  
	  axios.post(url, outStr, options) // use same headers as ajax

	    .then(function (response) {
	      //utils.log.info(ts()+"LE880gpio.js IP4 axios post response: " + response);
	      //utils.log.info(ts()+"LE880gpio.js IP4 request response.data: " + util.inspect(response.data, {showHidden: false, depth: null}));
	      
	      //
	      // use s2cSignal to display on messageBar
	      //
	      
	      var msg  = "Alert POST sent to " + configUser[p + "_POST_URL"];
		  msg += "<br><br>";
		  msg += "POST data: " + outStr;
		  msg += "<br><br>";
		  msg += "Response: " + util.inspect(response.data, {showHidden: false, depth: null});		
		  
	      var msgJSON = { "sentFile" : "alertPOST.json", "toClient" : "messageBar", "messageBar" : msg };

	      var s2cSignalOutFile = process.cwd() + "/s2cSignalOut/alertPOST.json";
	     utils.log.info(ts()+"LE880gpio.js IP4 " + p + " s2cSignalOutFile : " + s2cSignalOutFile);

	      try { fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON)); }
	      catch { utils.log.error(ts()+"LE880gpio.js IP4 fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON))")};
	      
	    })
	    
	    .catch(function (error) {
	      utils.log.error(ts()+"LE880gpio.js IP4 axios post error: " + error);
	    });

	} // if(configUser.OPLED_trig_checked == "IP4" && configUser.OPLED_HTTPS_checked == "https")

	if(configUser[p + "_trig_checked"] == "IP4" && configUser[p + "_Duration"] > 0){

	  OP4.writeSync(1);
	  setTimeout(function(){OP4.writeSync(0)}, configUser.OP4_Duration * 1000);
	  
	} // if(configUser.OPLED_trig_checked == "IP4" && configUser.OPLED_Duration > 0)

      }); // forEach
      
    }); // IP4

    //
    // SIGINT
    //
    
    process.on('SIGINT', _ => {
      
      utils.log.info(ts()+"LE880gpio.js SIGINT, unexport()");

      IPReset.unexport();
      IP1.unexport();
      IP2.unexport();
      IP3.unexport();
      IP4.unexport();
      
      OPLED.unexport();
      OP1.unexport();
      OP2.unexport();
      OP3.unexport();
      OP4.unexport();
      
    });

    return JSON.stringify(jsonObj);
    
  } // LE880gpio.prototype.buildLE880gpio
  
  return LE880gpio;
    
}());

module.exports = LE880gpio;
