"use strict";
var utils_1 = require('./utils');
var fs = require('fs');
var parser = require('body-parser');
var utils = utils_1.Utils.utils;
const util = require('util'); // inspect
const { exec, execSync } = require("child_process");

function ts(){
  return new Date().YYYYMMDDHHMMSSmmm() + " : ";
}

function ts1(){
  return new Date().YYYYMMDDHHMMSSmmm();
}

var AudioFactory = (function () {
    
  function AudioFactory() {
      this.buildAudioFactory();
  }
  
  AudioFactory.prototype.buildAudioFactory = function () {

    //utils.log.info(ts()+"AudioFactory.prototype.buildAudioFactory");
    
    delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
    var config 		= require(process.cwd() + "/LE880factoryConfig.json");
    //utils.log.info(ts()+"AudioFactory.js config: " + util.inspect(config, {showHidden: false, depth: null}));
    
    delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
    var configUser 	= require(process.cwd() + "/LE880userConfig.json");
    //utils.log.info(ts()+"AudioFactory.js configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));

    var PROTOCOL 	= configUser.AudioOptionsStreamingContainerDefault.toLowerCase();
    //var PROTOCOL 	= config.AudioOptionsStreamingContainerDefault.toLowerCase();
    var USERNAME 	= config.RTSPUsername;
    var PASSWORD 	= config.RTSPPassword;
    var IP 		= utils.getIpAddress();
    var PORT 		= config.RTSPPort;
    var NAME 		= config.RTSPName;
    
    //
    // vars for VMSsendOnOff and VMSrecvOnOff status
    //    
    
    var VMSsendStatus 	= "unknown";
    var VMSrecvStatus 	= "unknown";
    var VMSsendProtocol = "unknown";
    
    var cmd 		= null;
    var out 		= null;  
    var unique		= null;

    //
    // check VMSsendOnOff for rtsp
    //
    
    unique = 'LE880-rtsp-server';

    cmd    = 'su - pi -c "ps aux"';
    try {
      out = execSync(cmd).toString();
      //utils.log.info(ts()+'AudioFactory.js RTSP cmd: ' + cmd + ', out: ' + out);
    }
    catch (error) {
      utils.log.warn(ts()+'AudioFactory.js RTSP PROCESS NOT FOUND cmd:' + cmd + ', error.toString(): ' + error.toString());
    }
      
    if(out.indexOf(unique) >= 0){
      VMSsendStatus 	= "on";
      VMSsendProtocol 	= "rtsp";
      //utils.log.info(ts()+"AudioFactory.js RTSP " + unique + " VMSsendStatus: " + VMSsendStatus);
    } else {
      VMSsendStatus = "off";
      //utils.log.info(ts()+"AudioFactory.js RTSP " + unique + " VMSsendStatus" + VMSsendStatus);
    }

    //
    // check VMSsendOnOff for udpmulticast
    //
    
    unique = 'udpsink host';

    cmd    = 'su - pi -c "ps aux"';
    try {
      out = execSync(cmd).toString();
      //utils.log.info(ts()+'AudioFactory.js udp ulticast cmd: ' + cmd + ', out: ' + out);
    }
    catch (error) {
      utils.log.warn(ts()+'AudioFactory.js udp multicast PROCESS NOT FOUND cmd:' + cmd + ', error.toString(): ' + error.toString());
    }
      
    if(out.indexOf(unique) >= 0){
      VMSsendStatus 	= "on";
      VMSsendProtocol 	= "udpmulticast";
      //utils.log.info(ts()+"AudioFactory.js udp multicast " + unique + " VMSsendStatus: " + VMSsendStatus);
    } else {
      VMSsendStatus = "off";
      //utils.log.info(ts()+"AudioFactory.js udp multicast " + unique + " VMSsendStatus" + VMSsendStatus);
    }

    //
    // check VMSrecvOnOff status
    //
      
    unique = 'rtspsrc location';
    
    cmd    = 'su - pi -c "ps aux"';
    try {
      out = execSync(cmd).toString();
      //utils.log.info(ts()+'AudioFactory.js cmd: ' + cmd + ', out: ' + out);
    }
    catch (error) {
      utils.log.warn(ts()+'AudioFactory.js PROCESS NOT FOUND cmd:' + cmd + ', error.toString(): ' + error.toString());
    }
	
    if(out.indexOf(unique) >= 0){
      VMSrecvStatus = "on";
      //utils.log.info(ts()+"AudioFactory.js " + unique + " VMSrecvStatus: " + VMSrecvStatus);
    } else {
      VMSrecvStatus = "off";
      //utils.log.info(ts()+"AudioFactory.js " + unique + " VMSrecvStatus: " + VMSrecvStatus);
    }
        
    //
    // rtsp
    //
          
    if(PROTOCOL == "rtsp"){
	
      var OutgoingAudioURL		= PROTOCOL + "://" + USERNAME + ":" + PASSWORD + "@" + IP + ":" + PORT + "/" + NAME;
      utils.log.info(ts()+"AudioFactory.js RTSP OutgoingAudioURL : " + OutgoingAudioURL);
    
    } // if(PROTOCOL == "rtsp")
    
    //
    // udpmulticast
    //
    
    if(PROTOCOL == "udpmulticast"){
      
      //var OutgoingAudioURL		= "udp://224.1.2.1:5555";
      var OutgoingAudioURL		= "rtp://" + configUser.OutgoingUDPMulticastIP + ":" + configUser.OutgoingUDPMulticastPort;

      utils.log.info(ts()+"AudioFactory.js udp multicast OutgoingAudioURL : " + OutgoingAudioURL)

    } // if(PROTOCOL == "udpmulticast")

    //
    // return jsonObj
    //
    
    if(VMSsendProtocol != "unknown"){ // not just the last tested
      VMSsendStatus = "on";
    }
    
    var jsonObj = { 
      "OutgoingAudioURL" 		: OutgoingAudioURL, 
      "IncomingAudioURL" 		: configUser.IncomingAudioURL,
      "VMSloopbackURL" 			: config.VMSloopbackURL,
      "VMSsendProtocol"  		: VMSsendProtocol,
      "VMSsendStatus"    		: VMSsendStatus,
      "LE880toVMSAutoStart" 		: configUser.LE880toVMSAutoStart, 
      "VMSrecvStatus" 			: VMSrecvStatus,
      "VMStoLE880AutoStart" 		: configUser.VMStoLE880AutoStart,
      "OutgoingUDPMulticastIP"		: configUser.OutgoingUDPMulticastIP,
      "OutgoingUDPMulticastPort"	: configUser.OutgoingUDPMulticastPort
    };   
       
    utils.log.info(ts()+"AudioFactory.js udp multicast JSON.stringify(jsonObj) : " + JSON.stringify(jsonObj));
    
    return JSON.stringify(jsonObj);    
    
  } // AudioFactory.prototype.buildAudioFactory
  
  return AudioFactory;
    
}());

module.exports = AudioFactory;
