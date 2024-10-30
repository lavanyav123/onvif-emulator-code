"use strict";
const utils_1 = require('./utils');
const fs = require('fs');
const parser = require('body-parser');

const utils = utils_1.Utils.utils;
const util = require('util'); // inspect
const glob = require('glob');
const chokidar = require('chokidar');
const { exec, execSync } = require("child_process");
const pathParse = require('path-parse');

//const { JSDOM } = require( "jsdom" ); 	// for jquery
//const { window } = new JSDOM( "" );		// for jquery
//const $ = require( "jquery" )( window );	// for jquery

function ts(){
  return new Date().YYYYMMDDHHMMSSmmm() + " : ";
}

function ts1(){
  return new Date().YYYYMMDDHHMMSSmmm();
}

var seq = Number(0); // force semaphoreFile name to be unique

function pulseaudio_cmd(cmd, src="not provided"){
  
  //
  // write file to pulseaudio_cmd folder since pulseaudio runs as pi
  //
  // pulseaudio commands are processed by LE880-pi-pulseaudio-cmd.js which runs as pi
  //

  var semaphoreFile = process.cwd() + "/pulseaudio_cmd/" + ts1() + "_" + seq + ".cmd";
  
  if(seq > 1000000){
    seq = Number(0);
  } else {
    seq++;
  }

  try {
    fs.writeFileSync(semaphoreFile, cmd);
    //utils.log.info(ts()+"LE880main.js pulseaudio_cmd SUCCESS fs.writeFileSync semaphoreFile: " + semaphoreFile + "\ncmd: " + cmd + ", src: " + src);
  }
  catch (err) {
    utils.log.error(ts()+"LE880main.js pulseaudio_cmd ERROR fs.writeFileSync semaphoreFile: " + semaphoreFile + "\nerr: " + err + "\ncmd: " + cmd + ", src: " + src);
  }
    
} // pulseaudio_cmd

function pulseaudio_cmd_response (cmd="cmd not provided", src="src not provided", stream="all", gs="get", vol="none"){

/*
 * write .req file to pulseaudio_cmd folder since pulseaudio runs as pi
 *
 * pulseaudio commands are processed by LE880-pi-pulseaudio-cmd.js which runs as pi
 *
 * LE880-pi-pulseaudio-cmd.js will place response in semaphoreFile .res file
 *
 * NOTE: since time is required to process the shell command and return the data via semaphore files
 *       calls to this function should spaced at least 100 mSec apart (e.g. human interaction time)
 *
 * pulseaudio_cmd_response additional processing for pactl list source-outputs
 * 
 * stream specifies the stream name as defined in LE880factoryConfig.json, e.g. "input_record_app", "input_alert_app"
 * 
 * gs is either get or set
 * 
 * vol is the volume to be set (no meaning for get)
 * 
 * pactl set-source-output-volume index [0% to 100%]
 * 
 * pactl set-source-output-volume index [0 to 65536]
 * 
 * pactl set-sink-input-volume index [0% to 100%]
 * 
 * pactl set-sink-input-volume index [0 to 65536]
 * 
 * allow 1 second for the volume to be set (between 500 mSec and 1000 mSec) before getting the volume: pactl list source-outputs
 * 
 * allow 2 seconds between setting the volume of different streams
 * 
 */
 
 if(cmd == "cmd not provided"){
   utils.log.error(ts()+"LE880main.js pulseaudio_cmd_response ERROR \ncmd: " + cmd + "\nsrc: " + src + "\nstream: " + stream + ", gs: " + gs + ", vol: " + vol);
   return;
 }
 
  //utils.log.info(ts()+"LE880main.js pulseaudio_cmd_response \ncmd: " + cmd + "\nsrc: " + src + "\nstream: " + stream + ", gs: " + gs + ", vol: " + vol);
  
  if(seq > 1000000){
    seq = Number(0);
  } else {
    seq++;
  }
    
  var semaphoreFile = process.cwd() + "/pulseaudio_cmd/" + ts1() + "_" + seq + ".req";
  var responseFile  = semaphoreFile + ".res";
  
  //utils.log.info(ts()+"LE880main.js pulseaudio_cmd_response responseFile: " + responseFile);
  
  var data = null;

  try {
    fs.writeFileSync(semaphoreFile, cmd);
    //utils.log.info(ts()+"LE880main.js pulseaudio_cmd_response SUCCESS fs.writeFileSync semaphoreFile: " + semaphoreFile + "\ncmd: " + cmd + ", src: " + src);
  }
  catch (err) {
    utils.log.error(ts()+"LE880main.js pulseaudio_cmd_response ERROR fs.writeFileSync semaphoreFile: " + semaphoreFile + "\nerr: " + err + "\ncmd: " + cmd + ", src: " + src);
    return;
  }
  
  //
  // look for responseFile
  //
  
  var count = 0;
  var intervalFlag = setInterval(function(){
    
    count += 1;
    
    if(count >= 21){
      clearInterval(intervalFlag);
      return "none";
    }
    
    fs.readFile(responseFile, (err, data) => {
      
      if (err){ // file not found yet, cannot be read or deleted
	utils.log.warn("\n"+ts()+"LE880main.js pulseaudio_cmd_response ERROR readFile(responseFile) count: " + count + ", cmd: " + cmd + 
	"\nstream: " + stream + ", gs: " + gs + ", vol: " + vol + 
	"\nresponseFile: " + responseFile + "\nerr: " + err + "\n");
      }
      else
      { // file found, can be read and deleted
	
	//utils.log.info(ts()+"LE880main.js pulseaudio_cmd_response SUCCESS readFile(responseFile) count: " + count + "\nresponseFile: " + responseFile + ", data.length: " + data.length);
	
	clearInterval(intervalFlag);
	      
	if(data == "" || data == null || data.length == 0){
	  data = "data not returned from responseFile: " + responseFile;
	  utils.log.error(ts()+"LE880main.js pulseaudio_cmd_response ERROR data: " + data);
	}
	
	//utils.log.info(ts()+"LE880main.js pulseaudio_cmd_response count: " + count + ", responseFile: " + responseFile + "typeof data: " + typeof data + "\ndata:\n" + data);
	
	var dataStr = data.toString();
	//utils.log.info(ts()+"LE880main.js pulseaudio_cmd_response count: " + count + ", typeof dataStr: " + typeof dataStr + ", dataStr.length: " + dataStr.length);
	
	var cmdRM = "sudo rm " + responseFile;
	exec(cmdRM, (error, stdout, stderr) => {
	  if (error) {
	    utils.log.warn(ts()+"LE880main.js pulseaudio_cmd_response ERROR \ncmdRM: " + cmdRM + "\nerror: " + error + "\nstdout: " + stdout + "\nstderr: " + stderr);
	  } else {
	    //utils.log.info(ts()+"LE880main.js pulseaudio_cmd_response SUCCESS \ncmdRM: " + cmdRM + "\nstdout: " + stdout + "\nstderr: " + stderr);
	  }
	});
	
	//
	// process data if requested
	//
	
	var jsonObj = getStreamVolume(dataStr, stream);

	if(jsonObj.status != "ok"){
	  utils.log.warn(ts()+"LE880main.js pulseaudio_cmd_response ERROR process data cmd: " + cmd + ", stream: " + stream + ", gs: " + gs + ", vol: " + vol + 
	  "\nJSON.stringify(jsonObj): " + JSON.stringify(jsonObj));
	  return;	  
	}
	
	/*
	utils.log.info(ts()+"LE880main.js pulseaudio_cmd_response process data cmd: " + cmd + ", stream: " + stream + ", gs: " + gs + ", vol: " + vol + 
	"\nJSON.stringify(jsonObj): " + JSON.stringify(jsonObj));
	*/
	
	if(cmd == "pactl list source-outputs" && gs == "set"){
	  
	  if(jsonObj.status == "ok"){
	    var cmdSet = "pactl set-source-output-volume " + jsonObj.index + " " + vol;
	    //utils.log.info(ts()+"LE880main.js pulseaudio_cmd_response execute pulseaudio_cmd cmdSet: " + cmdSet);
	    pulseaudio_cmd(cmdSet, "from pulseaudio_cmd_response");
	  }
	  
	}

	if(cmd == "pactl list sink-inputs" && gs == "set"){
	  
	  if(jsonObj.status == "ok"){
	    var cmdSet = "pactl set-sink-input-volume " + jsonObj.index + " " + vol;
	    //utils.log.info(ts()+"LE880main.js pulseaudio_cmd_response execute pulseaudio_cmd cmdSet: " + cmdSet);
	    pulseaudio_cmd(cmdSet, "from pulseaudio_cmd_response");
	  }
	}
			  
      } // else if (err) 

    }); // fs.readFile
    
  }, 100); // var intervalFlag = setInterval(function()
  
} // pulseaudio_cmd_response

function getStreamVolume(dataStr, stream){
  
  //utils.log.info(ts()+"LE880main.js getStreamVolume() typeof dataStr: " + typeof dataStr + ", dataStr.length: " + dataStr.length + ", stream: " + stream);

  delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
  var config 		= require(process.cwd() + "/LE880factoryConfig.json");

  delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
  var configUser = require(process.cwd() + "/LE880userConfig.json");
  
  //utils.log.info(ts()+"LE880main.js getStreamVolume() process = config[" + stream + "]: " + config[stream]);

  var streamProcess		= config[stream];
  var lineArr 		= dataStr.split("\n");
  var indexArr		= "";
  var index   		= "undefined";	
  var i 		= -1
  var line;
  var volArr;
  var vol		= "undefined";
  var streamFound	= false;
  var jsonObj;

  for (line of lineArr) {
    
    i++;
    
    //utils.log.info(ts()+"LE880main.js getStreamVolume() for loop i: " + i + ", line: " + line);
    
    if(line.includes("Source Output #") || line.includes("Sink Input #")){
      indexArr = line.split("#");
      index    = indexArr[1].trim();
      //utils.log.info(ts()+"LE880main.js getStreamVolume() for loop i: " + i + ", index: " + index +"\nline: " + line);
    }

    if(line.includes("Volume:")){
      volArr = line.split(/\s+/);
      vol = volArr[5].trim(); // vol%
      //utils.log.info(ts()+"LE880main.js getStreamVolume() for loop i: " + i + ", vol: " + vol +"\nline: " + line);
    }    
    
    if(line.includes(streamProcess)){
      //utils.log.info(ts()+"LE880main.js getStreamVolume() FOUND PROCESS index: " + index + ", vol: " + vol + ", streamProcess: " + streamProcess + "\nline: " + line);
      streamFound = true;
      break;
    }    

  } //  for

    if(streamFound){
      //utils.log.info(ts()+"LE880main.js getStreamVolume() FOUND streamProcess: " + streamProcess);
      jsonObj = {"status" : "ok", "stream" : stream, "streamProcess" : streamProcess, "index" : String(index), "vol" : String(vol)};
    } else {
      utils.log.warn(ts()+"LE880main.js getStreamVolume() NOT FOUND streamProcess: " + streamProcess);
      jsonObj = {"status" : "notFound", "stream" : stream, "streamProcess" : streamProcess, "index" : String(index), "vol" : String(vol)};
    }
    
    return jsonObj;

} // getStreamVolume

function VMSstreamLevels(){

  delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
  var config 	 = require(process.cwd() + "/LE880factoryConfig.json");

  delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
  var configUser = require(process.cwd() + "/LE880userConfig.json");
  
  var VMSpaNumSrcStream;
  var VMSpaNumSinkStream;

  if (configUser.vms_half_full_duplex_state == "half"){ // listen only, set source to 0
    VMSpaNumSinkStream	= 0;
    VMSpaNumSrcStream  	= parseInt((Number(configUser.input_vms_level) * Number(config.input_vms_multiplier))).toString();
  }
  else if (configUser.vms_half_full_duplex_state == "full"){ // listen and talk
    VMSpaNumSinkStream	= parseInt((Number(configUser.output_vms_level) * Number(config.output_vms_multiplier))).toString();
    VMSpaNumSrcStream  	= parseInt((Number(configUser.input_vms_level)  * Number(config.input_vms_multiplier))).toString();
  } else {
    utils.log.error(ts()+"LE880main.js LE880export ERROR configUser.vms_half_full_duplex_state: " + configUser.vms_half_full_duplex_state);
  }
  
  let VMSpaGstSinkStream = (VMSpaNumSinkStream / 100).toString();
  let VMSpaGstSrcStream  = (VMSpaNumSrcStream / 100).toString();
  
  //utils.log.info(ts()+"LE880main.js LE880export VMSpaNumSinkStream: " + VMSpaNumSinkStream + ", VMSpaNumSrcStream: " + VMSpaNumSrcStream);
  //utils.log.info(ts()+"LE880main.js LE880export VMSpaGstSinkStream: " + VMSpaGstSinkStream + ", VMSpaGstSrcStream: " + VMSpaGstSrcStream);
  
  return {"VMSpaNumSinkStream" : VMSpaNumSinkStream, 
	  "VMSpaNumSrcStream"  : VMSpaNumSrcStream, 
          "VMSpaGstSinkStream" : VMSpaGstSinkStream,
          "VMSpaGstSrcStream"  : VMSpaGstSrcStream};
	  
} // VMSstreamLevels()

function IntercomStreamLevels(){
  
  delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
  var config 	 = require(process.cwd() + "/LE880factoryConfig.json");

  delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
  var configUser = require(process.cwd() + "/LE880userConfig.json");
  
  var paNumSinkStream;
  var paNumSrcStream;
  
  if (configUser.half_full_duplex_state == "half"){ // listen only, set source to 0
    paNumSinkStream	= 0;
    paNumSrcStream  	= parseInt((Number(configUser.input_intercom_level) * Number(config.input_intercom_multiplier))).toString();
  }
  else if (configUser.intercom_half_full_duplex_state == "full"){ // listen and talk
    paNumSinkStream	= parseInt((Number(configUser.output_intercom_level) * Number(config.output_intercom_multiplier))).toString();
    paNumSrcStream  	= parseInt((Number(configUser.input_intercom_level)  * Number(config.input_intercom_multiplier))).toString();
  } else {
    utils.log.error(ts()+"LE880main.js LE880export ERROR configUser.half_full_duplex_state: " + configUser.half_full_duplex_state);
  }

  let paGstSinkStream = (paNumSinkStream / 100).toString();
  let paGstSrcStream  = (paNumSrcStream / 100).toString();
  
  utils.log.info(ts()+"LE880main.js LE880export paNumSinkStream: " + paNumSinkStream + "paNumSrcStream: " + paNumSrcStream);
  utils.log.info(ts()+"LE880main.js LE880export paGstSinkStream: " + paGstSinkStream + "paGstSrcStream: " + paGstSrcStream);
  
  return {"paNumSinkStream" : paNumSinkStream,
          "paNumSrcStream"  : paNumSrcStream, 
	  "paGstSinkStream" : paGstSinkStream,
          "paGstSrcStream"  : paGstSrcStream};
	  
} // IntercomStreamLevels()

var LE880export = (function () {
    
    function LE880export(config, configUser, webserver_admin) {
        
	var _this = this;
	
	this.config = config;
	this.configUser = configUser;
	
	var LOG = this.config.LOG;
	utils.log.info(ts()+"LE880main.js LE880export LOG: " + LOG);
	
	//
	// remove prior files in /home/pi/LE880-Profile-T/pulseaudio_cmd
	//
	
	var cmd = "sudo rm /home/pi/LE880-Profile-T/pulseaudio_cmd/*";
	var outStr;
	
	try {
	  outStr = execSync(cmd).toString();
	}
	catch (err) {
	  utils.log.warn(ts()+"LE880main.js LE880export ERROR execSync cmd: " + cmd + ", err: " + err + ", outStr: " + outStr);
	}

	var jsonObj 			= VMSstreamLevels();
	var VMSpaNumSrcStream 		= jsonObj.VMSpaNumSrcStream;
	var VMSpaNumSinkStream		= jsonObj.VMSpaNumSinkStream;
	utils.log.info(ts()+"LE880main.js LE880export VMSpaNumSrcStream :" + VMSpaNumSrcStream + ", VMSpaNumSinkStream: " + VMSpaNumSinkStream);
	var VMSpaGstSrcStream 		= jsonObj.VMSpaGstSrcStream;
	var VMSpaGstSinkStream		= jsonObj.VMSpaGstSinkStream;
	utils.log.info(ts()+"LE880main.js LE880export VMSpaGstSrcStream :" + VMSpaGstSrcStream + ", VMSpaGstSinkStream: " + VMSpaGstSinkStream);
  
	//
	// check configUser.LE880toVMSAutoStart
	//
		
	utils.log.info(ts()+"LE880main.js configUser.LE880toVMSAutoStart: " + configUser.LE880toVMSAutoStart);
	utils.log.info(ts()+"LE880main.js typeof configUser.LE880toVMSAutoStart: " + typeof configUser.LE880toVMSAutoStart);
	
	if (configUser.LE880toVMSAutoStart == "true") {
	  
	  if(configUser.AudioOptionsStreamingContainerDefault == "RTSP"){
	    
	    _this.startRtsp(); // LE880export.prototype.startRtsp
	    utils.log.info(ts()+'LE880main.js LE880export configUser.LE880toVMSAutoStart == "true"');
	  
	  }
	  
	  if(configUser.AudioOptionsStreamingContainerDefault == "UDPMulticast"){
	    
	    //cmd  = "gst-launch-1.0 pulsesrc device=alsa_input.platform-soc_sound.analog-stereo volume=0.1 ! ";
	    cmd  = "gst-launch-1.0 pulsesrc device=alsa_input.platform-soc_sound.analog-stereo volume=" + VMSpaGstSrcStream + " ! ";
	    cmd += "mulawenc ! ";
	    cmd += "rtppcmupay ! ";
	    cmd += "udpsink host=224.1.2.1 auto-multicast=true port=5555 sync=false async=false";
	    
	    setTimeout(function(){
	      utils.log.info(ts()+"LE880main.js LE880export pulseaudio_cmd: " + cmd);
	      pulseaudio_cmd(cmd, 'LE880export configUser.VMStoLE880AutoStart == "true", UDPMulticast');
	    }, 10);
	    
	    setTimeout(function(){
	      utils.log.info(ts()+"LE880main.js LE880export set output_vms_app stream level: " + VMSpaNumSrcStream + "%");
	      pulseaudio_cmd_response("pactl list source-outputs", "set output_vms_app stream level", "output_vms_app", "set", VMSpaNumSrcStream + "%");
	    }, 1000);
	    
	  } // if(configUser.AudioOptionsStreamingContainerDefault == "UDPMulticast")  
	
	} // if (configUser.LE880toVMSAutoStart == "true")

	//
	// check configUser.VMStoLE880AutoStart
	//
	
	utils.log.info(ts()+"LE880main.js configUser.VMStoLE880AutoStart: " + configUser.VMStoLE880AutoStart);
	utils.log.info(ts()+"LE880main.js typeof configUser.VMStoLE880AutoStart: " + typeof configUser.VMStoLE880AutoStart);
	
	if (configUser.VMStoLE880AutoStart == "true") {
	  
	  //
	  // if VMStoLE880 is VMStoLE880 is already running do not start again
	  //
	  
	  var unique 		= 'rtspsrc location';
	  var VMSrecvStatus	= null;
	  var outStr;
	  
	  var cmd  = 'su - pi -c "ps aux"';
	  try {
	     outStr = execSync(cmd).toString();
	    //utils.log.info(ts()+'LE880main.js cmd: ' + cmd + ',  outStr: ' +  outStr);
	  }
	  catch (error) {
	    utils.log.warn(ts()+'LE880main.js PROCESS NOT FOUND cmd:' + cmd + ', error.toString(): ' + error.toString() + ",  outStr: " +  outStr);
	  }
	      
	  if(outStr.indexOf(unique) >= 0){
	    VMSrecvStatus = "on";
	    //utils.log.info(ts()+"LE880main.js " + unique + " VMSrecvStatus: " + VMSrecvStatus);
	  } else {
	    VMSrecvStatus = "off";
	    //utils.log.info(ts()+"LE880main.js " + unique + " VMSrecvStatus: " + VMSrecvStatus);
	  }

	  if(VMSrecvStatus == "off"){
	  	  
	    if(configUser.vmsEcho == "true"){
	      
	      let cmd  = "";
	      
	      //cmd += 'GST_DEBUG=4 ';
	      //cmd += 'PULSE_PROP="filter.want=echo-cancel" ';
	      //cmd += 'gst-launch-1.0 v4l2src ! omx_h264enc ! mpegtsmux  ! rtpmp2tpay ! rtpsink backchannel=ts rtspbcsrc location=\'' + configUser.IncomingAudioURL + '\' ! \ ';
	      //cmd += 'rtpmp2tdepay ! \ ';
		  //cmd +=  'mpegtsdemux ! \ ';
	      //cmd += 'mulawdec ! \ ';
	      //cmd += 'pulsesink device=alsa_output.platform-soc_sound.analog-stereo volume=' + VMSpaGstSinkStream + " ";
	      ////cmd += 'pulsesink device=alsa_output.platform-soc_sound.analog-stereo volume=0.1 ';
	      //cmd += 'stream-properties=props,filter.want=echo-cancel ';
	      //cmd += 'stream-properties=props,aec_method=webrtc ';
	      //cmd += '>>'+LOG+'LE880VMSrecvOn-echo-cancel.sh.log 2>&1 &';
	      //
		  cmd += '/home/pi/LE880-Profile-T/rtspbc' + ' >> '+LOG+'LE880VMSrecvOn.sh.log 2>&1 &';
	      setTimeout(function(){
		utils.log.info(ts()+"LE880main.js LE880export pulseaudio_cmd: " + cmd);
		pulseaudio_cmd(cmd, 'LE880export configUser.VMStoLE880AutoStart == "true", configUser.vmsEcho == "true"');	
	      }, 2000);
		//cmd += 'sudo GST_DEBUG=1 /home/pi/LE880-Profile-T/rtspbc' + ' >> '+LOG+'LE880VMSrecvOn.sh.log 2>&1 &';
		//execSync(cmd);  
		      
	    } else { // if(configUser.vmsEcho == "false")

	      let cmd  = '';

	  //    //cmd += 'GST_DEBUG=4 ';
	  //    
	  //    cmd += 'GST_DEBUG=1 /home/pi/LE880-Profile-T/rtspbc' + ' >> '+LOG+'LE880VMSrecvOn.sh.log 2>&1 &'; // wm8960 speaker
	  //    //cmd += 'pulsesink device=alsa_output.platform-soc_sound.analog-stereo volume=0.1 >> '+LOG+'LE880VMSrecvOn.sh.log 2>&1 &'; // wm8960 speaker
	  cmd += '/home/pi/LE880-Profile-T/rtspbc' + ' >> '+LOG+'LE880VMSrecvOn.sh.log 2>&1 &';  
	      setTimeout(function(){
		utils.log.info(ts()+"LE880main.js LE880export pulseaudio_cmd: " + cmd);
		pulseaudio_cmd(cmd, 'LE880export configUser.VMStoLE880AutoStart == "true", configUser.vmsEcho == "true"');	
	      }, 2000);
	  //cmd += 'sudo GST_DEBUG=1 /home/pi/LE880-Profile-T/rtspbc' + ' >> '+LOG+'LE880VMSrecvOn.sh.log 2>&1 &';
	  //execSync(cmd);  
	      
	    }
	    
	  } // if(VMSrecvStatus == "off")
	

	
	} // if (this.configUser.VMStoLE880AutoStart == "true")
	
	//
	// LE880process start- needed by services/media_service.js
	//
	
        this.options = {
	  
            resolutions: [
	    
		{ Width: 320, Height: 640 }
		
		/*
                { Width: 640, Height: 480 },
                { Width: 800, Height: 600 },
                { Width: 1024, Height: 768 },
                { Width: 1280, Height: 1024 },
                { Width: 1280, Height: 720 },
                { Width: 1640, Height: 1232 },
                { Width: 1920, Height: 1080 }
		*/
		
            ],
            
	    //framerates: [2, 5, 10, 15, 25, 30],
	    
	    framerates: [1],
            
	    bitrates: [
	    
		64
		
		/*
                250,
                500,
                1000,
                2500,
                5000,
                7500,
                10000,
                12500,
                15000,
                17500
		*/
		
            ]
        };
        
	this.settings = {
            forceGop: true,
            resolution: { Width: 320, Height: 240 },
            //framerate: 30,
	    framerate: 1
        };	
	
        this.config 	= config;
	this.configUser = configUser;
	
        this.rtspServer = null;
	//this.startRtsp(); // controller by services/media_service.js and VMSsendOnOff
	//utils.log.info(ts()+"LE880main.js this.startRtsp()");
	
	this.WSSserver = null;
	this.startWSSserver();
		
	this.webserver_admin = webserver_admin;
        this.setupWebserver();
	
	//
	// LE880process end
	//
		
        utils.cleanup(function () {
	  
	  _this.stopRtsp();
	  _this.stopWSSserver();
	  	  
        }); // utils.cleanup
	

    } // function LE880export(config, configUser, webserver_admin)
   
    LE880export.prototype.setupWebserver = function () {
        
	var _this = this;
	
	//utils.log.info(ts()+"LE880main.js 2 this.config.Reboot_min: " + this.config.Reboot_min);	
	
        utils.log.info(ts()+"LE880main.js Starting LE880main settings webserver_admin on " + this.config.AdminHTTPorHTTPS + "://%s:%s/", utils.getIpAddress(), this.config.AdminServicePort);
	
	//this.webserver_admin.use(parser.urlencoded({ extended: true }));
	this.webserver_admin.use(parser.urlencoded({ limit: '500mb', extended: true })); // 500mb required for large .deb files in post swupload
	
	this.webserver_admin.engine('ntl', function (filePath, options, callback) {
	    _this.getLE880SPApage(filePath, options, callback); // can only be called once
        });
	
	this.webserver_admin.set('views', './views');
        this.webserver_admin.set('view engine', 'ntl');

      /* 
       * when not authenticated browser will post for login:
       *   username
       *   password
       *   browserID
       *   browserUA
       *  
       * when authenticated browser will post:
       *   browserID
       *   browserUA
       */
       	
	//
	// get / with no get vars
	//
	
        this.webserver_admin.get('/', function (req, res) {
	  
	  res.render('LE880getLogin', {});
	    
        });

	//
	// post /loginRequest
	//
    
	this.webserver_admin.post('/loginRequest', function (req, res) {
	  
	  utils.log.info(ts()+"LE880main.js loginRequest req.body : " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  //var username 	= req.body.username.toLowerCase();
	  utils.log.info(ts()+"LE880main.js loginRequest username: " + req.body.username.toLowerCase());
	  
	  //var passwordHash = req.body.passwordHash;
	  utils.log.info(ts()+"LE880main.js loginRequest passwordHash: " + req.body.passwordHash);
	  
	  //var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js loginRequest browserID: " + req.body.browserID);
	  
	  //var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js loginRequest browserUA: " + req.body.browserUA);

	  /*
	  if(req.body.first_login){
	    var first_login = req.body.first_login;
	  } else {
	    var first_login = "";
	  }
	  utils.log.info(ts()+"LE880main.js loginRequest first_login: " + first_login);
	  */
	  	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  //utils.log.info(ts()+"LE880main.js loginRequest load authUser: " + util.inspect(authUser, {showHidden: false, depth: null}));

	  delete require.cache[require.resolve("../authAccounts.json")];
	  var authAccounts = require("../authAccounts.json");
	  //utils.log.info(ts()+"LE880main.js loginRequest load authAccounts: " + util.inspect(authAccounts, {showHidden: false, depth: null}));

	  delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	  var config 		= require(process.cwd() + "/LE880factoryConfig.json");

	  delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	  var configUser = require(process.cwd() + "/LE880userConfig.json");	  
	  
	  //var md5 = require('md5');
	  //var passwordHash = md5(req.body.password);
	  
	  /*
	  //
	  // check for first_login
	  //
	  
	  if(first_login.length > 0){
	    utils.log.info(ts()+"LE880main.js loginRequest first_login.length > 0");
	    return;
	  }
	  */
	  
	  //
	  // check for valid credentials
	  //
	  
	  var i;
	  for (i in authAccounts.account) {
	    
	    //utils.log.info(ts()+"LE880main.js loginRequest authAccounts.account["+i+"].username: " + authAccounts.account[i].username);
	    //utils.log.info(ts()+"LE880main.js loginRequestauthAccounts.account["+i+"].passwordHash: " + authAccounts.account[i].passwordHash);
	    
	    if (authAccounts.account[i].username == req.body.username.toLowerCase() && authAccounts.account[i].passwordHash == req.body.passwordHash) {
	      
	      utils.log.info(ts()+"LE880main.js loginRequest OK authAccounts.account["+i+"].username: " + authAccounts.account[i].username);

	      authUser.username	   	= req.body.username.toLowerCase();
	      authUser.passwordHash	= req.body.passwordHash;
	      authUser.browserIDok 	= req.body.browserID;
	      authUser.browserUAok 	= req.body.browserUA;
	      
	      utils.log.info(ts()+"LE880main.js loginRequest OK JSON.stringify(authUser): " + JSON.stringify(authUser));

	      fs.writeFile("/home/pi/LE880-Profile-T/authUser.json", JSON.stringify(authUser), (err) => {
		
		if (err){
		  
		  utils.log.error(ts()+"LE880main.js ERROR loginRequest writeFile authUser.json err: " + err);
		  
		  res.send({ "auth" : false, "msg" : "Login Not Authorized: attempt logged" });
		  return;
		  	 
		}
			    
	      });

	      //
	      // check for first login
	      //
	      
	      var first_login_flag = authUser.username + "_first_login";
	      utils.log.info(ts()+"LE880main.js loginRequest configUser[" + first_login_flag + "] == " + configUser[first_login_flag]);
	      
	      if(configUser[first_login_flag] == "false"){
		
		utils.log.info(ts()+"LE880main.js loginRequest FIRST LOGIN for: " + authUser.username);
		
		var JSONres = { "auth" : true, "msg" : "First login for " + authUser.username, "first_login" : authUser.username};
		
		res.send(JSONres);
		
		return;
	      
	      } else {
		
		utils.log.info(ts()+"LE880main.js loginRequest NOT FIRST LOGIN for: " + authUser.username);
		
	      }
	      
	      //
	      // valid credentials found, save account name in browser for access authorization pre-test
	      //
	      
	      res.send({ "auth" : true, "msg" : "Login Authorized: creating user session" });
	      return;
	      
	    } // if (authUser.account[i].username == username && authUser.account[i].passwordHash == passwordHash)
 
	  } // for (i in authUser.account)
	  
	  //
	  // no valid credentials found
	  //
	  
	  utils.log.info(ts()+"LE880main.js loginRequest failed for : " + req.body.username.toLowerCase());
	  
	  res.send({ "auth" : false, "msg" : "Login Not Authorized: attempt logged" });
	  return;
	
	}); // /loginRequest

	//
	// first_login_change_password
	//

	this.webserver_admin.post('/first_login_change_password', function (req, res) {
	  
	  utils.log.info(ts()+"LE880main.js first_login_change_password req.body : " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  //utils.log.info(ts()+"LE880main.js first_login_change_password load authUser: " + util.inspect(authUser, {showHidden: false, depth: null}));
	  
	  if(req.body.browserID == authUser.browserIDok && req.body.browserUA == authUser.browserUAok){
	    
	    delete require.cache[require.resolve("../authAccounts.json")];
	    var authAccounts = require("../authAccounts.json");
	    //utils.log.info(ts()+"LE880main.js first_login_change_password load authAccounts: " + util.inspect(authAccounts, {showHidden: false, depth: null}));	    

	    //var md5 = require('md5');
	    //var passwordHash = md5(req.body.password);
	    
	    //	user		aaBB33$$		74ddc05977dda23aab4b883c6bbdc3ff
	    //	admin		aaaBBB333$$$		8bfde9d8d9420219a409919b74d58eb0
	    //	superadmin	aaaaBBBB3333$$$$	72d1e7db7f43695845f0b62e261225fc
	    //			aaaaaBBBBB33333$$$$$	fac8ce14f6aea63cb588a75d0b03a9b6
	    
	    var i;
	    for (i in authAccounts.account) {
	      
	      //utils.log.info(ts()+"LE880main.js first_login_change_password authAccounts.account["+i+"].username: " + authAccounts.account[i].username);
	      //utils.log.info(ts()+"LE880main.js first_login_change_passwordauthAccounts.account["+i+"].passwordHash: " + authAccounts.account[i].passwordHash);
	      
	      if (authAccounts.account[i].username == req.body.username.toLowerCase()) {
		
		utils.log.info(ts()+"LE880main.js first_login_change_password OK authAccounts.account["+i+"].username: " + authAccounts.account[i].username);

		authUser.passwordHash			= req.body.passwordHash;
		authUser.browserIDok 			= "logout";
		authUser.browserUAok 			= "logout";		
		
		authAccounts.account[i].passwordHash	= req.body.passwordHash;
		authAccounts.account[i].browserIDok 	= "logout";
		authAccounts.account[i].browserUAok 	= "logout";	

		//utils.log.info(ts()+"LE880main.js first_login_change_password OK JSON.stringify(authUser): " + JSON.stringify(authUser));

		fs.writeFile("/home/pi/LE880-Profile-T/authUser.json", JSON.stringify(authUser), (err) => {
		  
		  if (err){
		    
		    utils.log.error(ts()+"LE880main.js ERROR first_login_change_password writeFile authUser.json err: " + err);
		    res.send({ "auth" : false, "msg" : "First Login Password Change Error Code 1" });
		    return;
			   
		  }
			      
		});

		fs.writeFile("/home/pi/LE880-Profile-T/authAccounts.json", JSON.stringify(authAccounts), (err) => {
		  
		  if (err){
		    
		    utils.log.error(ts()+"LE880main.js ERROR first_login_change_password writeFile authAccounts.json err: " + err);
		    res.send({ "auth" : false, "msg" : "First Login Password Change Error Code 2" });
		    return;
			   
		  }
			      
		});

		
		delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
		var configUser = require(process.cwd() + "/LE880userConfig.json");	  		
		
		var first_login_flag = req.body.username.toLowerCase() + "_first_login";
		
		configUser[first_login_flag] = "true";
		utils.log.info(ts()+"LE880main.js first_login_change_password set configUser." + first_login_flag + " to \"true\"");
		
		fs.writeFile("/home/pi/LE880-Profile-T/LE880userConfig.json", JSON.stringify(configUser), (err) => {
		  
		  if (err){
		    
		    utils.log.error(ts()+"LE880main.js ERROR first_login_change_password writeFile authAccounts.json err: " + err);
		    res.send({ "auth" : false, "msg" : "First Login Password Change Error Code 2" });
		    return;
			   
		  }
			      
		});
				
		//
		// password change complete
		//

		res.send({ "auth" : false, "msg" : "First Login Password Change Complete, logging out" });
		return;
		
	      } // if (authUser.account[i].username == username && authUser.account[i].passwordHash == passwordHash)
   
	    } // for (i in authUser.account)
	    
	    //
	    // no valid credentials found
	    //
	    
	    res.send({ "auth" : false, "msg" : "First Login Password Change Error Code 3" });
	    return;
	
	  } else {
	    
	    res.send({ "auth" : false });
	    
	  }

	}); // first_login_change_password

	//
	// post /pw_change
	//
    
	this.webserver_admin.post('/pw_change', function (req, res) {
	  
	  //utils.log.info(ts()+"LE880main.js pw_change req.body : " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  //utils.log.info(ts()+"LE880main.js pw_change load authUser: " + util.inspect(authUser, {showHidden: false, depth: null}));
	  
	  if(req.body.browserID == authUser.browserIDok && req.body.browserUA == authUser.browserUAok){
	    
	    delete require.cache[require.resolve("../authAccounts.json")];
	    var authAccounts = require("../authAccounts.json");
	    //utils.log.info(ts()+"LE880main.js pw_change load authAccounts: " + util.inspect(authAccounts, {showHidden: false, depth: null}));	    

	    //var md5 = require('md5');
	    //var passwordHash = md5(req.body.password);
	    
	    //	user		aaBB33$$		74ddc05977dda23aab4b883c6bbdc3ff
	    //	admin		aaaBBB333$$$		8bfde9d8d9420219a409919b74d58eb0
	    //	superadmin	aaaaBBBB3333$$$$	72d1e7db7f43695845f0b62e261225fc
	    //			aaaaaBBBBB33333$$$$$	fac8ce14f6aea63cb588a75d0b03a9b6
	    
	    var i;
	    for (i in authAccounts.account) {
	      
	      //utils.log.info(ts()+"LE880main.js pw_change authAccounts.account["+i+"].username: " + authAccounts.account[i].username);
	      //utils.log.info(ts()+"LE880main.js pw_changeauthAccounts.account["+i+"].passwordHash: " + authAccounts.account[i].passwordHash);
	      
	      if (authAccounts.account[i].username == req.body.account.toLowerCase()) {
		
		utils.log.info(ts()+"LE880main.js pw_change OK authAccounts.account["+i+"].username: " + authAccounts.account[i].username);

		authUser.passwordHash			= req.body.passwordHash;
		authUser.browserIDok 			= "logout";
		authUser.browserUAok 			= "logout";		
		
		authAccounts.account[i].passwordHash	= req.body.passwordHash;
		authAccounts.account[i].browserIDok 	= "logout";
		authAccounts.account[i].browserUAok 	= "logout";	

		//utils.log.info(ts()+"LE880main.js pw_change OK JSON.stringify(authUser): " + JSON.stringify(authUser));

		fs.writeFile("/home/pi/LE880-Profile-T/authUser.json", JSON.stringify(authUser), (err) => {
		  
		  if (err){
		    
		    utils.log.error(ts()+"LE880main.js ERROR pw_change writeFile authUser.json err: " + err);
		    res.send({ "auth" : false, "msg" : "Password Change Error Code 1" });
		    return;
			   
		  }
			      
		});

		fs.writeFile("/home/pi/LE880-Profile-T/authAccounts.json", JSON.stringify(authAccounts), (err) => {
		  
		  if (err){
		    
		    utils.log.error(ts()+"LE880main.js ERROR pw_change writeFile authAccounts.json err: " + err);
		    res.send({ "auth" : false, "msg" : "Password Change Error Code 2" });
		    return;
			   
		  }
			      
		});
		
		//
		// password change complete
		//

		res.send({ "auth" : false, "msg" : "Password Change Complete, Logging Out" });
		return;
		
	      } // if (authUser.account[i].username == username && authUser.account[i].passwordHash == passwordHash)
   
	    } // for (i in authUser.account)
	    
	    //
	    // no valid credentials found
	    //
	    
	    res.send({ "auth" : false, "msg" : "Password Change Error Code 3" });
	    return;
	
	  } else {
	    
	    res.send({ "auth" : false });
	    
	  }

	}); // pw_change

	//
	// post /logout
	//
    
	this.webserver_admin.post('/logout', function (req, res) {
	  
	  //utils.log.info(ts()+"LE880main.js logout req.body : " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  utils.log.info(ts()+"LE880main.js logout load authUser: " + util.inspect(authUser, {showHidden: false, depth: null}));
			   
	  if(req.body.browserID == authUser.browserIDok && req.body.browserUA == authUser.browserUAok){

	    authUser.username		= "logout";
	    authUser.passwordHash	= "logout";
	    authUser.browserIDok 	= "logout";
	    authUser.browserUAok 	= "logout";
	    
	    utils.log.info(ts()+"LE880main.js logout OK JSON.stringify(authUser): " + JSON.stringify(authUser));

	    fs.writeFile("/home/pi/LE880-Profile-T/authUser.json", JSON.stringify(authUser), (err) => {
	      
	      if (err){
		
		utils.log.error(ts()+"LE880main.js ERROR logout writeFile authUser.json err: " + err);
		
		res.send({ "auth" : false, "msg" : "Logout Error" });
		return;
		       
	      }
			  
	    });

	    res.send({"auth" : false });
	  
	  } else {
	    
	    res.send({"auth" : false });
	    
	  }
	
	}); // /logout

	
	
	/* unused start ***

	//
	// post /loginBrowserNotSupported
	//
    
	this.webserver_admin.post('/loginBrowserNotSupported', function (req, res) {
	  
	  //utils.log.info(ts()+"LE880main.js loginBrowserNotSupported req.body : " + util.inspect(req.body, {showHidden: false, depth: null}));
	  res.render('LE880postLogin', {"msg" : "Please use Chromium, Chrome, or Firefox browser."});
	    
	}); // /loginBrowserNotSupported

	*** unused end ***/
	
	//
	// post root "/" with vars
	//
	  
	this.webserver_admin.post('/', function (req, res) {
	  
	  //utils.log.info(ts()+"LE880main.js post root req.headers: " + util.inspect(req.headers, {showHidden: false, depth: null}));
	  //utils.log.info(ts()+"LE880main.js post root req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));
	  //utils.log.info(ts()+"LE880main.js post root process.env['NODE_TLS_REJECT_UNAUTHORIZED']: " + process.env["NODE_TLS_REJECT_UNAUTHORIZED"]);
	  
	  // req.headers['x-real-ip'] is not defined

	  var remoteAddressArr = req.connection.remoteAddress.split(':');
	  var remoteAddress = req.connection.remoteAddress.split(':')[remoteAddressArr.length-1].trim();
	  //utils.log.info(ts()+"LE880main.js post root remoteAddress: " + util.inspect(remoteAddress, {showHidden: false, depth: null}));
	  
	  //var jsonObj = { "remoteAddress" : remoteAddress };
	  //fs.writeFileSync(process.cwd() + "/public/ajax/remoteAddress.json", JSON.stringify(jsonObj));
	  
	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post root browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post root browserUA: " + browserUA);
	  
	  //var first_login = req.body.first_login;
	  //utils.log.info(ts()+"LE880main.js post root first_login: " + first_login);
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post root browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post root browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){
	    
	    if(req.body.first_login){
	      
	      if(req.body.first_login != ""){
	      
		var jsonObj = {"first_login" : req.body.first_login.toLowerCase()};
		utils.log.info(ts()+"LE880main.js post root first login JSON.stringify(jsonObj): " + JSON.stringify(jsonObj));
		res.render('LE880firstLogin', jsonObj);
		return;	
		
	      }    
	    
	    }
	    
	    res.render('LE880postRoot', {});
	    
	  } else {
	    
	    res.send({ "auth" : false });
	    
	  }
	    
        }); // this.webserver_admin.post('/'

	//
	// post menu
	//

	this.webserver_admin.post('/menu', function (req, res) {
	  
	  var choice = req.body.choice;
	  //utils.log.info(ts()+"LE880main.js post menu choice: " + choice);

	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post menu browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post menu browserUA: " + browserUA);	  
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post menu browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post menu browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){
	    
	    res.send({"auth" : true });
            
	  } else {
	    
	    res.send({"auth" : false });
	    
	  }
	    
        }); // this.webserver_admin.post('menu'
	
	//
	// post /UserChangeSettings
	//
	
        this.webserver_admin.post('/UserChangeSettings', function (req, res) {
	  	  
	  utils.log.info(ts()+"LE880main.js UserChangeSettings req.body : " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post UserChangeSettings browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post UserChangeSettings browserUA: " + browserUA);	  
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post UserChangeSettingsbrowserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post UserChangeSettings browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){

	    delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	    var config 	   = require(process.cwd() + "/LE880factoryConfig.json");

	    delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	    var configUser = require(process.cwd() + "/LE880userConfig.json");

        var ip_addr =utils.getIpAddress();

		config.RTSPUsername = req.body.RTSPUsername;
		config.RTSPPassword = req.body.RTSPPassword;
		config.RTSPPort     = req.body.RTSPPort;
		config.OutgoingAudioURL = "rtsp://"+req.body.RTSPUsername+":"+req.body.RTSPPassword+"@"+ip_addr+":"+req.body.RTSPPort+"/LE880";

		fs.writeFile("/home/pi/LE880-Profile-T/LE880factoryConfig.json", JSON.stringify(config), function writeJSON(err) {
		  if (err) return console.log(err);
		  //console.log(JSON.stringify(config));
		  //console.log('writing to/home/pi/LE880-Profile-T/LE880factoryConfig.json');
		});
	    	    
	    if(req.body.content == "btn_half_duplex" || 
	       req.body.content == "btn_full_duplex" || 
	       req.body.content == "btn_intercom_echo" || 
	       req.body.content == "btn_vms_echo" || 
	       req.body.content == "btn_vms_half_duplex" || 
	       req.body.content == "btn_vms_full_duplex")
	       
	    {

	      var userJSON;
		
	      fs.readFile(process.cwd() + "/LE880userConfig.json", (err, data) => {
		
		if (err){
		  utils.log.error(ts()+"LE880main.js UserChangeSettings intercomEcho error fs.readfile");
		  throw err;
		} else {
		
		  //utils.log.info(ts()+"LE880main.js UserChangeSettings intercomEcho data : " + util.inspect(data, {showHidden: false, depth: null}));
		  
		  userJSON = JSON.parse(data);
		  
		  //utils.log.info(ts()+"LE880main.js UserChangeSettings intercomEcho before userJSON : " + util.inspect(userJSON, {showHidden: false, depth: null}));
		  
		  //
		  // VMS
		  //
		  
		  var vout;
		  var vin;

		  if (req.body.content == "btn_vms_half_duplex" || req.body.content == "btn_vms_full_duplex"){
		    
		    utils.log.info(ts()+"LE880main.js post UserChangeSettings req.body.content: " + req.body.content);
		    utils.log.info(ts()+"LE880main.js post UserChangeSettings req.body.vms_half_full_duplex_state: " + req.body.vms_half_full_duplex_state);
		    
		    userJSON.vms_half_full_duplex_state = req.body.vms_half_full_duplex_state; // "half" or "full"

		    if(req.body.vms_half_full_duplex_state == "half"){ // listen only, set input_vms_app to 0
		      
		      //
		      // set sink_input to output_vms_level (enablespeaker)
		      // set source_output to 0 (disable mic)
		      // 
	      
		      vout 	= 0;
		      vin  	= parseInt(Number(config.input_vms_multiplier) * Number(configUser.input_vms_level)).toString();

		      setTimeout(function(){
			utils.log.info(ts()+"LE880main.js post UserChangeSettings sink-input to " + vout + "%");
			pulseaudio_cmd_response("pactl list sink-inputs", "UserChangeSettings", "output_vms_app", "set", vout + "%");
		      }, 500);
			      
		      setTimeout(function(){
			utils.log.info(ts()+"LE880main.js post UserChangeSettings source-output to " + vin + "%");
			pulseaudio_cmd_response("pactl list source-outputs", "UserChangeSettings", "input_vms_app", "set", vin + "%");
		      }, 500);

		    }
		    
		    if(req.body.vms_half_full_duplex_state == "full"){ // listen and talk, set input_vms_app to input_vms_level
		      
		      //
		      // set sink_input to output_vms_level (enable speaker)
		      // set source_output to input_vms_level (enable mic)
		      // 
	      
		      vout 	= parseInt(Number(config.output_vms_multiplier) * Number(configUser.output_vms_level)).toString();
		      vin  	= parseInt(Number(config.input_vms_multiplier) * Number(configUser.input_vms_level)).toString();
		      
		      setTimeout(function(){
			utils.log.info(ts()+"LE880main.js post UserChangeSettings set sink-input to " + vout + "%");
			pulseaudio_cmd_response("pactl list sink-inputs", "UserChangeSettings", "output_vms_app", "set", vout + "%");
		      }, 500);
			      
		      setTimeout(function(){
			utils.log.info(ts()+"LE880main.js post UserChangeSettings source-output to " + vin + "%");
			pulseaudio_cmd_response("pactl list source-outputs", "UserChangeSettings", "input_vms_app", "set", vin + "%");
		      }, 500);
		      		      
		    }

		  } // 	if (req.body.content == "btn_vms_half_duplex" || req.body.content == "btn_vms_full_duplex")	  
		  
		  else if (req.body.content == "btn_vms_echo"){
		    
		    userJSON.vmsEcho = req.body.echoState; // "true" or "false"
		    
		  }		  
		  
		  //
		  // intercom
		  //
		  
		  else if (req.body.content == "btn_half_duplex" || req.body.content == "btn_full_duplex"){
		    
		    utils.log.info(ts()+"LE880main.js post UserChangeSettings req.body.content: " + req.body.content);
		    utils.log.info(ts()+"LE880main.js post UserChangeSettings req.body.half_full_duplex_state: " + req.body.half_full_duplex_state);
		    
		    userJSON.half_full_duplex_state = req.body.half_full_duplex_state; // "half" or "full"
		    		  
		    if(req.body.half_full_duplex_state == "half"){ // listen only, set input_intercom_app to 0
		      
		      //
		      // set sink_input to output_intercom_level (enablespeaker)
		      // set source_output to 0 (disable mic)
		      // 
	      
		      vout 	= 0;
		      vin  	= parseInt(Number(config.input_intercom_multiplier) * Number(configUser.input_intercom_level)).toString();

		      setTimeout(function(){
			utils.log.info(ts()+"LE880main.js post UserChangeSettings sink-input to " + vout + "%");
			pulseaudio_cmd_response("pactl list sink-inputs", "UserChangeSettings", "output_intercom_app", "set", vout + "%");
		      }, 500);
			      
		      setTimeout(function(){
			utils.log.info(ts()+"LE880main.js post UserChangeSettings source-output to " + vin + "%");
			pulseaudio_cmd_response("pactl list source-outputs", "UserChangeSettings", "input_intercom_app", "set", vin + "%");
		      }, 500);

		    }
		    
		    if(req.body.half_full_duplex_state == "full"){ // listen and talk, set input_intercom_app to input_intercom_level
		      
		      //
		      // set sink_input to output_intercom_level (enable speaker)
		      // set source_output to input_intercom_level (enable mic)
		      // 
	      
		      vout 	= parseInt(Number(config.output_intercom_multiplier) * Number(configUser.output_intercom_level)).toString();
		      vin  	= parseInt(Number(config.input_intercom_multiplier) * Number(configUser.input_intercom_level)).toString();
		      
		      setTimeout(function(){
			utils.log.info(ts()+"LE880main.js post UserChangeSettings set sink-input to " + vout + "%");
			pulseaudio_cmd_response("pactl list sink-inputs", "UserChangeSettings", "output_intercom_app", "set", vout + "%");
		      }, 500);
			      
		      setTimeout(function(){
			utils.log.info(ts()+"LE880main.js post UserChangeSettings source-output to " + vin + "%");
			pulseaudio_cmd_response("pactl list source-outputs", "UserChangeSettings", "input_intercom_app", "set", vin + "%");
		      }, 500);
		      		      
		    }
		  
		  } // else if (req.body.content == "btn_half_duplex" || req.body.content == "btn_full_duplex")
		    
		  else if (req.body.content == "btn_intercom_echo"){
		    userJSON.intercomEcho = req.body.echoState; // "true" or "false"
		  }
		  
		  //utils.log.info(ts()+"LE880main.js UserChangeSettings intercomEcho after userJSON : " + util.inspect(userJSON, {showHidden: false, depth: null}));
		    
		  fs.writeFile(process.cwd() + "/LE880userConfig.json", JSON.stringify(userJSON), (err) => {
		
		    if (err){
		      utils.log.error(ts()+"LE880main.js ERROR UserChangeSettings intercomEcho fs.writeFile LE880userConfig.json");
		      throw err;
		    } else {
		      
		      //utils.log.info(ts()+"LE880main.js UserChangeSettings intercomEcho updated LE880userConfig.json: " + util.inspect(userJSON, {showHidden: false, depth: null}));
		      
		      res.send({ "auth" : true });
		      
		    } // fs.writeFile else
		    
		  }); // fs.writeFile
		    
		} //  fs.readFile else
		  
	      }); // fs.readFile	      
	    
	    } // if(req.body.content == "intercomEcho")

	    //
	    // audio
	    //
	    	    
	    if(req.body.content == "audio"){
	      
	      utils.log.info(ts()+"LE880main.js UserChangeSettings audio req.body.content : " + req.body.content);

	      var userJSON;
		
	      fs.readFile(process.cwd() + "/LE880userConfig.json", (err, data) => {
		
		if (err){
		  utils.log.error(ts()+"LE880main.js UserChangeSettings audio error fs.readfile");
		  throw err;
		} else {
		
		  utils.log.info(ts()+"LE880main.js UserChangeSettings data : " + util.inspect(data, {showHidden: false, depth: null}));
		  
		  userJSON = JSON.parse(data);
		  
		  utils.log.info(ts()+"LE880main.js UserChangeSettings audio before userJSON : " + util.inspect(userJSON, {showHidden: false, depth: null}));


		  
		  userJSON.AudioOptionsMedia2EncoderDefault 		= req.body.AudioOptionsMedia2Encoder;
		  userJSON.AudioOptionsStreamingContainerDefault 	= req.body.AudioOptionsStreamingContainer;

		  userJSON.RTSPUsername								= req.body.RTSPUsername;
		  userJSON.RTSPPassword 							= req.body.RTSPPassword;
		  userJSON.RTSPPort									= req.body.RTSPPort;
		  userJSON.OutgoingAudioURL                         = "rtsp://"+req.body.RTSPUsername+":"+req.body.RTSPPassword+"@"+ip_addr+":"+req.body.RTSPPort+"/LE880";
		  
		  userJSON.IncomingAudioURL 				= req.body.IncomingAudioURL;
		  userJSON.IncludeVideoOnvifDefault 			= req.body.IncludeVideoOnvif;
		  
		  userJSON.OutgoingUDPMulticastIP 			= req.body.OutgoingUDPMulticastIP;
		  userJSON.OutgoingUDPMulticastPort 			= req.body.OutgoingUDPMulticastPort;
		  
		  utils.log.info(ts()+"LE880main.js UserChangeSettings audio after userJSON : " + util.inspect(userJSON, {showHidden: false, depth: null}));
		  
		  var VMSsendStatus 	= "unknown";
		  var VMSrecvStatus 	= "unknown";
		  var cmd 		= null;
		  var out 		= null;  
		  var unique		= null;

		  //
		  // check for rtsp
		  //
		  
		  if(req.body.AudioOptionsStreamingContainer == "RTSP"){
		    
		    //
		    // kill streams other than rtsp
		    //

		    let cmd  = "sudo pkill -9 -f 'udpsink host'";

		    exec(cmd, (error, stdout, stderr) => {
			if (error) {
			    utils.log.error(ts()+`LE880main.js post UserChangeSettings audio UDP Multicast ERROR error: ${error.message}, cmd: ` + cmd);
			}
			if (stderr) {
			    utils.log.error(ts()+`LE880main.js post UserChangeSettings audio UDP Multicast ERROR stderr: ${stderr}, cmd: ` + cmd);
			}
			utils.log.info(ts()+`LE880main.js post UserChangeSettings audio UDP Multicast stdout: ${stdout}, cmd: ` + cmd);
		    });	
		    
		    //
		    // check to see if rtsp running
		    //
		    
		    cmd    = 'su - pi -c "ps aux"';
		    try {
		      out = execSync(cmd).toString();
		      //utils.log.info(ts()+'LE880main.js UserChangeSettings RTSP audio cmd: ' + cmd + ', out: ' + out);
		    }
		    catch (error) {
		      utils.log.warn(ts()+'LE880main.js UserChangeSettings audio RTSP PROCESS NOT FOUND cmd:' + cmd + ', error.toString(): ' + error.toString());
		    }
		    
		    unique = 'LE880-rtsp-server';
		    
		    if(out.indexOf(unique) >= 0){
		      
		      VMSsendStatus = "on";
		      
		      //no action required
		      
		      utils.log.info(ts()+"LE880main.js UserChangeSettings audio RTSP on unique: " + unique + " VMSsendStatus: " + VMSsendStatus);
		    
		    } else {
		      
		      VMSsendStatus = "off";
		      
		      _this.startRtsp();
		      
		      utils.log.info(ts()+"LE880main.js UserChangeSettings audio RTSP off unique: " + unique + " VMSsendStatus" + VMSsendStatus);
		    
		    }		    
		  
		  } // if(req.body.AudioOptionsStreamingContainer == "RTSP")
		  
		  //
		  // check for UDPMulticast
		  //
		  
		  if(req.body.AudioOptionsStreamingContainer == "UDPMulticast"){

		    //
		    // kill streams other than UDPMulticast
		    //
		    
		    utils.log.info(ts()+'LE880main.js UserChangeSettings UDPMulticast audio  _this.stopRtsp()');
		    _this.stopRtsp();
		    
		    //
		    // check to see if UDPMulticast is running
		    //
		    
		    cmd    = 'su - pi -c "ps aux"';
		    try {
		      out = execSync(cmd).toString();
		      //utils.log.info(ts()+'LE880main.js UserChangeSettings UDPMulticast audio cmd: ' + cmd + ', out: ' + out);
		    }
		    catch (error) {
		      utils.log.warn(ts()+'LE880main.js UserChangeSettings audio UDPMulticast PROCESS NOT FOUND cmd:' + cmd + ', error.toString(): ' + error.toString());
		    }
		    
		    unique = 'udpsink host';
		    
		    if(out.indexOf(unique) >= 0){
		      
		      VMSsendStatus = "on";
		      
		      //no action required
		      
		      utils.log.info(ts()+"LE880main.js UserChangeSettings audio UDPMulticast on unique: " + unique + " VMSsendStatus: " + VMSsendStatus);
		    
		    } else {
		      
		      VMSsendStatus = "off";
		      
		      //let cmd  = "gst-launch-1.0 pulsesrc device=alsa_input.platform-soc_sound.analog-stereo volume=1.0 ! ";
		      let cmd  = "gst-launch-1.0 pulsesrc device=alsa_input.platform-soc_sound.analog-stereo volume=" + paNumSrcVol + " ! ";
			  cmd += "mulawenc ! ";
			  cmd += "rtppcmupay ! ";
			  cmd += "udpsink host=224.1.2.1 auto-multicast=true port=5555 sync=false async=false";

		      let cmdPi = 'sudo su - pi -c "' + cmd + '"';
		      exec(cmdPi, (error, stdout, stderr) => {
			  if (error) {
			      utils.log.error(ts()+`LE880main.js post UserChangeSettings audio UDPMulticast ERROR error: ${error.message}, cmd: ` + cmd);
			  }
			  if (stderr) {
			      utils.log.error(ts()+`LE880main.js post UserChangeSettings audio UDPMulticast ERROR stderr: ${stderr}, cmd: ` + cmd);
			  }
			  utils.log.info(ts()+`LE880main.js post UserChangeSettings audio UDPMulticast stdout: ${stdout}, cmd: ` + cmd);
		      });	    
		      
		      utils.log.info(ts()+"LE880main.js UserChangeSettings audio UDPMulticast off unique: " + unique + " VMSsendStatus" + VMSsendStatus);
		    
		    }		
	  
		  } //if(req.body.AudioOptionsStreamingContainer == "UDPMulticast")		  
		  
		  
		  fs.writeFile(process.cwd() + "/LE880userConfig.json", JSON.stringify(userJSON), (err) => {
		
		    if (err){
		      utils.log.error(ts()+"LE880main.js ERROR UserChangeSettings audio fs.writeFile LE880userConfig.json");
		      throw err;
		    } else {
		      
		      utils.log.info(ts()+"LE880main.js UserChangeSettings updated LE880userConfig.json: " + util.inspect(userJSON, {showHidden: false, depth: null}));
		      
		      //
		      // build outgoing audio stream after settings are saved
		      //
		      
		      delete require.cache[require.resolve("../lib/AudioFactory")];
		      var AudioFactory = require("../lib/AudioFactory");
		      
		      var buildAudioFactoryJSONstr = AudioFactory.prototype.buildAudioFactory();
		      utils.log.info(ts()+"LE880main.js UserChangeSettings audio buildAudioFactoryJSONstr: " + buildAudioFactoryJSONstr);
		      
		      var buildAudioFactoryJSON = JSON.parse(buildAudioFactoryJSONstr);
		      
		      buildAudioFactoryJSON.auth = true;
		      
		      res.send(buildAudioFactoryJSON);
		      
		    } // fs.writeFile else
		    
		  }); // fs.writeFile
		    
		} //  fs.readFile else
		  
	      }); // fs.readFile

	    } // if(req.body.content == "audio")
	  
	    //
	    // Input Ports
	    //
	  
	    //
	    // Input Ports
	    //
	  
	    if(req.body.content.substr(0,2) == "IP"){
	      
			//utils.log.info(ts()+"LE880main.js UserChangeSettings IP req.body.content : " + req.body.content);
  
			var userJSON;
		  
			fs.readFile(process.cwd() + "/LE880userConfig.json", (err, data) => {
		  
		  if (err){
			utils.log.error(ts()+"LE880main.js UserChangeSettings IP error fs.readfile");
			throw err;
		  } else {
		  
			//utils.log.info(ts()+"LE880main.js UserChangeSettings data : " + util.inspect(data, {showHidden: false, depth: null}));
			
			userJSON = JSON.parse(data);
			
			//utils.log.info(ts()+"LE880main.js UserChangeSettings IP before userJSON : " + util.inspect(userJSON, {showHidden: false, depth: null}));
			
			userJSON[req.body.content + "_pupd_checked"] = req.body.pupd_checked;
			userJSON[req.body.content + "_deb_checked"]  = req.body.deb_checked;
			
			//utils.log.info(ts()+"LE880main.js UserChangeSettings IP after userJSON : " + util.inspect(userJSON, {showHidden: false, depth: null}));
			  
			fs.writeFile(process.cwd() + "/LE880userConfig.json", JSON.stringify(userJSON), (err) => {
		  
			  if (err){
				utils.log.error(ts()+"LE880main.js ERROR UserChangeSettings IP fs.writeFile LE880userConfig.json");
				throw err;
			  } else {
				
				//utils.log.info(ts()+"LE880main.js UserChangeSettings updated LE880userConfig.json: " + util.inspect(userJSON, {showHidden: false, depth: null}));
				
				res.send({ "auth" : true });
				
			  } // fs.writeFile else
			  
			}); // fs.writeFile
			  
		  } //  fs.readFile else
			
			}); // fs.readFile
  
		  } // if(req.body.content == "IP")	  
		
		  //
		  // Output Ports
		  //
  
		  if(req.body.content.substr(0,2) == "OP"){
			
			//utils.log.info(ts()+"LE880main.js UserChangeSettings OP req.body.content : " + req.body.content);
  
			var userJSON;
		  
			fs.readFile(process.cwd() + "/LE880userConfig.json", (err, data) => {
		  
		  if (err){
			utils.log.error(ts()+"LE880main.js UserChangeSettings OP error fs.readfile");
			throw err;
		  } else {
		  
			//utils.log.info(ts()+"LE880main.js UserChangeSettings data : " + util.inspect(data, {showHidden: false, depth: null}));
			
			userJSON = JSON.parse(data);
			
			//utils.log.info(ts()+"LE880main.js UserChangeSettings OP before userJSON : " + util.inspect(userJSON, {showHidden: false, depth: null}));
	
			userJSON[req.body.content + "_trig_checked"] = req.body.trig_checked;
			
			userJSON[req.body.content + "_mic_alertLevel0"]  = req.body.mic_alertLevel0;
			userJSON[req.body.content + "_mic_alertLevel1"]  = req.body.mic_alertLevel1;
			userJSON[req.body.content + "_mic_alertLevel2"]  = req.body.mic_alertLevel2;
			
			userJSON[req.body.content + "_OL_checked"]  = req.body.OL_checked;
			userJSON[req.body.content + "_Duration"]  = req.body.Duration;
			userJSON[req.body.content + "_HTTPS_checked"]  = req.body.HTTPS_checked;
			userJSON[req.body.content + "_POST_URL"]  = req.body.POST_URL;
			userJSON[req.body.content + "_k1"]  = req.body.k1;
			userJSON[req.body.content + "_v1"]  = req.body.v1;
			userJSON[req.body.content + "_k2"]  = req.body.k2;
			userJSON[req.body.content + "_v2"]  = req.body.v2;
			userJSON[req.body.content + "_k3"]  = req.body.k3;
			userJSON[req.body.content + "_v3"]  = req.body.v3;
			userJSON[req.body.content + "_k4"]  = req.body.k4;
			userJSON[req.body.content + "_v4"]  = req.body.v4;
			
			userJSON[req.body.content + "_recording_checked"]  = req.body.recording_checked;
			userJSON[req.body.content + "_recording_duration_before"]  = req.body.recording_duration_before;
			userJSON[req.body.content + "_recording_duration_after"]  = req.body.recording_duration_after;
			
			//utils.log.info(ts()+"LE880main.js UserChangeSettings OP after userJSON : " + util.inspect(userJSON, {showHidden: false, depth: null}));
  
  
			fs.writeFile(process.cwd() + "/LE880userConfig.json", JSON.stringify(userJSON), (err) => {
		  
			  if (err){
				utils.log.error(ts()+"LE880main.js ERROR UserChangeSettings OP fs.writeFile LE880userConfig.json");
				throw err;
			  } else {
				delete require.cache[require.resolve("../lib/LE880gpio")];	
				var gpio = require("/home/pi/LE880-Profile-T/lib/LE880gpio");
				gpio.prototype.buildLE880gpio();
				//utils.log.info(ts()+"LE880main.js UserChangeSettings updated LE880userConfig.json: " + util.inspect(userJSON, {showHidden: false, depth: null}));
				
				res.send({ "auth" : true });
				
			  } // fs.writeFile else
			  
			}); // fs.writeFile
			  
		  } //  fs.readFile else
			
			}); // fs.readFile
  
		  } // if(req.body.content == "OP")	 
		
		} else {
		  
		  res.send({ "auth" : false });
		  
		}
  
		  }); // this.webserver_admin.post('/UserChangeSettings')
	
	//
	// post /StreamFactory (only run for admin webpage window.onload)
	//
    
	this.webserver_admin.post('/StreamFactory', function (req, res) {
	    	  	  
	  //
	  // AudioFactory
	  //
	  
	  var AudioFactory = require("../lib/AudioFactory");
	  
	  var buildAudioFactoryJSONstr = AudioFactory.prototype.buildAudioFactory();
	  utils.log.info(ts()+"LE880main.js UserChangeSettings buildAudioFactoryJSONstr: " + buildAudioFactoryJSONstr);
	  
	  var buildAudioFactoryJSON = JSON.parse(buildAudioFactoryJSONstr);
	  
	  buildAudioFactoryJSON.auth = true;
	  
	  //utils.log.info(ts()+"LE880main.js StreamFactory buildAudioFactoryJSON: " + util.inspect(buildAudioFactoryJSON));
	  
	  // 
	  // configUser
	  //

	  delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	  var configUser = require(process.cwd() + "/LE880userConfig.json");
	  
	  buildAudioFactoryJSON.half_full_duplex_state    	= "full";
	  buildAudioFactoryJSON.vms_half_full_duplex_state  = "full";
	  buildAudioFactoryJSON.intercomEcho 			= configUser.intercomEcho;
	  buildAudioFactoryJSON.vmsEcho      			= configUser.vmsEcho;
	  buildAudioFactoryJSON.intercomRestartLoad      	= configUser.intercomRestartLoad;
	  buildAudioFactoryJSON.intercomRestartFail      	= configUser.intercomRestartFail;
	  buildAudioFactoryJSON.intercomPossibleFail      	= configUser.intercomPossibleFail;


	  intercomOnOffState 		= "off browser reloaded"; // intercom is off when webpage is reloaded
	  intercomStarted    		= "off browser reloaded"; // intercom is off when webpage is reloaded
	  intercomRestartLoad      	= configUser.intercomRestartLoad;
	  intercomRestartFail      	= configUser.intercomRestartFail;
	  intercomPossibleFail      	= configUser.intercomPossibleFail;
	  
	  utils.log.info(ts()+"\n\nLE880main.js StreamFactory start " + 
	    "\n intercomOnOffState: "   + intercomOnOffState + 
	    "\n audioCtxRemoteState: "  + audioCtxRemoteState + 
	    "\n audioCtxLocalState: "   + audioCtxLocalState + 
	    "\n intercomStarted: "      + intercomStarted + 
	    "\n intercomRestartLoad: "  + intercomRestartLoad + 
	    "\n intercomRestartFail: "  + intercomRestartFail + 
	    "\n intercomPossibleFail: " + intercomPossibleFail + 
	    "\n\n");
	    
	  //
	  // send response
	  //
	  
	  utils.log.info(ts()+"LE880main.js StreamFactory buildAudioFactoryJSON: " + util.inspect(buildAudioFactoryJSON));

	  res.send(buildAudioFactoryJSON);
	  
	  //
	  // reset intercomPossibleFail
	  //
	  
	  if (intercomPossibleFail == "true"){
	  
	    //
	    // update LE880userConfig.json
	    //
	    
	    configUser.intercomPossibleFail = "false";
	    intercomPossibleFail	    = "false";
	    
	    try {
	      //utils.log.debug(ts()+'LE880main.js post StreamFactory fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser)');
	      fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser));
	    }
	    catch (err) {
	      utils.log.error(ts()+'LE880main.js post StreamFactory ERROR fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser)\nerr: ' + err);
	    }	   

	    utils.log.info(ts()+"\n\nLE880main.js StreamFactory update LE880userConfig.json " + 
	      "\n intercomOnOffState: "   + intercomOnOffState + 
	      "\n audioCtxRemoteState: "  + audioCtxRemoteState + 
	      "\n audioCtxLocalState: "   + audioCtxLocalState + 
	      "\n intercomStarted: "      + intercomStarted + 
	      "\n intercomRestartLoad: "  + intercomRestartLoad + 
	      "\n intercomRestartFail: "  + intercomRestartFail + 
	      "\n intercomPossibleFail: " + intercomPossibleFail + 
	      "\n\n");

	  }
	    
	  
	}); // /StreamFactory
	
	//
	// post /Settings
	//
	
	this.webserver_admin.post('/Settings', function (req, res) {
	  
	  //utils.log.info(ts()+"LE880main.js Settings req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));
	  	  
	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post Settings browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post Settings browserUA: " + browserUA);	  
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post Settings browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post Settings browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){

	    var choice = req.body.choice;
	    
	    if(choice == 'systemSettings'){
	      
	      delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	      var config 		= require(process.cwd() + "/LE880factoryConfig.json");
	      
	      var serverIP = utils.getIpAddress();
	      var FirmwareVersion    = config.DeviceInformation.FirmwareVersion;
	      var jsonObj = { "auth" : true, "choice" : choice, "serverIP": serverIP, "FirmwareVersion" : FirmwareVersion };
	      return res.send(jsonObj);  	      
	    
	    } // if(choice == 'systemSettings')
	  	  
	  } else {
	    
	    res.send({ "auth" : false });
	    
	  }

	}); // /Settings
	
	//
	// listAudioFiles
	//
	
	this.webserver_admin.post('/listAudioFiles', function (req, res) {
	  
	  //utils.log.info(ts()+"LE880main.js post listAudioFiles req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post listAudioFiles browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post listAudioFiles browserUA: " + browserUA);
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post listAudioFiles browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post listAudioFiles browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){ // auth OK
	    
	    outJSON = { "auth" : true };
	    
	    delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	    var config 		= require(process.cwd() + "/LE880factoryConfig.json");

	    delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	    var configUser = require(process.cwd() + "/LE880userConfig.json");
	    
	    //
	    // create array with list of files
	    //
	    
	    var arr = [];
	    fs.readdirSync(config.alertWAV).forEach(fn => {
	      arr.push(fn);
	      //utils.log.info(ts()+"LE880main.js post listAudioFiles fn: " + fn);
	    });
	    
	    //
	    // create HTML with list of audio files
	    //
	    
	    var fn = "filename.wav";
	    
	    var html  = "";
	    
	    html  = "<table>";
	    
	    for(var i = 0; i < arr.length; i++){
	      
	      html += "<tr>";
	      
		html += "<td><button onclick='ad(\"" + arr[i] + "\")'>Download</button>";
		
		html += "&nbsp;&nbsp;<button onclick='rmaf(\"" + arr[i] + "\")'>Delete</button>";
		
		html += "</td>";

		html += "<td>" + arr[i];
		
		html += "</td>";
			      
	      html += "</tr>";
	    
	  }
	    
	    html += "</table>";
	    
	    outJSON.html = html;
	    
	    res.send(outJSON);
	    
	    return;
	  
	  } else {  // auth NOT OK
	    
	      try {
		res.send({ "auth" : false });
		utils.log.info(ts()+'LE880main.js post listAudioFiles auth NOT OK res.send({ "auth" : false })');
	      }
	      
	      catch (err) {
		utils.log.info(ts()+'LE880main.js post listAudioFiles auth NOT OK res.send({ "auth" : false }) err: ' + err);
	      }	    
	      
	      return;
	  }	  
	  
	}); // post listAudioFiles

	//
	// download audio files
	//

	this.webserver_admin.post('/ad', function (req, res) {
	  
	  //utils.log.info(ts()+"LE880main.js post ad req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post ad browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post ad browserUA: " + browserUA);
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post ad browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post ad browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){ // auth OK
	    
	    outJSON = { "auth" : true };
	    
	    delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	    var config 		= require(process.cwd() + "/LE880factoryConfig.json");

	    delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	    var configUser = require(process.cwd() + "/LE880userConfig.json");

	    var fpath = config.alertWAV + "/" + req.body.fn;
	    utils.log.info(ts()+"LE880main.js post ad res.download(" + fpath + ")");
	    
	    var fdata = fs.readFileSync(fpath);
	    utils.log.info(ts()+"LE880main.js post ad fdata.length: " + fdata.length);
	    //utils.log.info(ts()+"LE880main.js post ad fdata: " + fdata);
	    
	    outJSON.fn		= req.body.fn;
	    outJSON.fdata 	= fdata;
	    
	    res.send(outJSON);
	    
	    return;
	  
	  } else {  // auth NOT OK
	    
	      try {
		res.send({ "auth" : false });
		utils.log.info(ts()+'LE880main.js post ad auth NOT OK res.send({ "auth" : false })');
	      }
	      
	      catch (err) {
		utils.log.info(ts()+'LE880main.js post ad auth NOT OK res.send({ "auth" : false }) err: ' + err);
	      }	    
	      
	      return;
	  }	  
	  
	}); // post ad	

	//
	// remove audio files
	//

	this.webserver_admin.post('/rmaf', function (req, res) {
	  
	  //utils.log.info(ts()+"LE880main.js post rmaf req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post rmaf browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post rmaf browserUA: " + browserUA);
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post rmaf browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post rmaf browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){ // auth OK
	    
	    outJSON = { "auth" : true };
	    
	    delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	    var config 		= require(process.cwd() + "/LE880factoryConfig.json");

	    delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	    var configUser = require(process.cwd() + "/LE880userConfig.json");

	    var fpath = config.alertWAV + "/" + req.body.fn;
	    //utils.log.info(ts()+"LE880main.js post rmaf res.download(" + fpath + ")");
	    
	    try {
	      fs.unlinkSync(fpath)
	      utils.log.info(ts()+"LE880main.js post rmaf remove file: " + fpath);
	    } catch(err) {
	      utils.log.error(ts()+"LE880main.js post rmaf ERROR remove file: " + fpath + ", err: " + err);
	    }
	    
	    outJSON.fn		= req.body.fn;
	    
	    res.send(outJSON);
	    
	    return;
	  
	  } else {  // auth NOT OK
	    
	      try {
		res.send({ "auth" : false });
		utils.log.info(ts()+'LE880main.js post rmaf auth NOT OK res.send({ "auth" : false })');
	      }
	      
	      catch (err) {
		utils.log.info(ts()+'LE880main.js post rmaf auth NOT OK res.send({ "auth" : false }) err: ' + err);
	      }	    
	      
	      return;
	  }	  
	  
	}); // post rmaf	

	/* 
	 * server to client signal
	 * 
	 * post /s2cSignal
	 * 
	 * any server process can send a JSON message to the client
	 * by placing a file such as "out1.json" into the s2cSignalOut folder
	 * 
	 * the sending process must create a unique filename, e.g. "out1.json"
	 * 
	 * the JSON file must contain only one line with the format shown below:
	 * 
	 * {
	 * "sentFile" : "out1.json",					// name of JSON file sent (used for acknowledgment)
	 * "toClient" : "client process that JSON is intended for",	// required, e.g. "messageBar" or "webRTC"
	 * "toClientJSON" : { "k0" : "v0", "k1" : "v1" }		// optional
	 * "ts" : ts(), 						// optional, recommended
	 * "messageBar" : "html to be displayed on message bar", 	// optional
	 * }
	 * 
	 * s2cSignal will send the JSON files in the order that they are placed in the s2cSignalOut folder
	 * 
	 * s2cSignal will delete each JSON file after it has been sent to the client and acknowldged by the client
	 * 
	 */
	
	var s2cSignalTimeout = null;
	var watcher	     = null;
	
	var sentFile	     = "no_sentFile";
	var recvFile         = "no_recvFile";
	
	var outJSON	     = null; // last JSON sent to client
	var inJSON	     = null; // last JSON received from client
	
	var s2cSignalCount   = 0*1; // sent from client
	
	//
	// global vars within LE880export.prototype.setupWebserver start
	//
	
	var audioCtxRemoteState    = "not defined in server";
	var audioCtxLocalState     = "not defined in server";
	var intercomStarted	   = "not defined in server"; // can be set to false by /intercomOnOff
	var intercomRestartLoad    = "not defined in server";
	var intercomRestartFail    = "not defined in server"; // used by s2cSignal and StreamFactory
	var intercomPossibleFail   = "not defined in server";

	//
	// global vars within LE880export.prototype.setupWebserver end
	//
		  	
	//
	// rm prior s2cSignalOut files upon startup
	//
	
	var s2cSignalOutPath = process.cwd() + "/s2cSignalOut";
	var cmd = "sudo rm " + s2cSignalOutPath + "/*";
	
	try {
	  execSync(cmd);
	  utils.log.info(ts()+"LE880main.js s2cSignal success cmd : " + cmd);
	}
	
	catch (err) {
	  utils.log.info(ts()+"LE880main.js s2cSignal ERROR cmd : " + cmd + ", err: " + err);
	}	
	
	this.webserver_admin.post('/s2cSignal', function (req, res) {
	  
	  //utils.log.info(ts()+"LE880main.js post s2cSignal req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post s2cSignal browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post s2cSignal browserUA: " + browserUA);
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post s2cSignal browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post s2cSignal browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){ // auth OK
	    
	  //req.setTimeout(40000); // 40,000 mSec = 40 seconds (not sure if this causes s2cSignal to close)
	  	    	  
	  setTimeout(function(){ // 35,000 mSec = 35 seconds

	    try {
	      
	      if(req.body.audioCtxRemoteState){delete req.body.audioCtxRemoteState;}
	      if(req.body.audioCtxLocalState) {delete req.body.audioCtxLocalState;}
	      if(req.body.s2cSignalCount)     {delete req.body.s2cSignalCount;}
	      if(req){delete req.body;}
	      if(req){req = undefined;}
	      if(req){req = null;}
	      
	      if(res){res = undefined;}
	      if(res){res = null;}
	      
	      if(configUser){
		if(configUser.intercomRestartFail){delete configUser.intercomRestartFail;}
	      }
	      if(configUser){configUser = undefined;}
	      if(configUser){configUser = null;}
	      	      
	      if(config){config = undefined;}
	      if(config){config = null;}
	      
	      if(authUser){authUser = undefined;}
	      if(authUser){authUser = null;}
	      
	      if(outJSON){delete outJSON.s2cSignalCount;}
	      if(outJSON){outJSON = undefined;}
	      if(outJSON){outJSON = null;}
	      
	      /*
	      
	      //
	      // garbage collection if --expose-gc set in LE880_eth0
	      //
	      
	      try {
		global.gc();
		utils.log.info(ts()+"LE880main.js s2cSignal global.gc()");
	      }
	      
	      catch (err) {
		utils.log.info(ts()+"LE880main.js s2cSignal ERROR global.gc() err: " + err);
	      }
	      
	      */
	      
	      //utils.log.info(ts()+"LE880main.js s2cSignal delete vars which reference globals for garbage collection and return");
	      
	      return;
	      
	    }
	    
	    catch (err) {
	      utils.log.info(ts()+"LE880main.js s2cSignal ERROR delete vars err: " + err);
	    }
	    
	  }, 35000);

	    outJSON = { "auth" : true };

	    //utils.log.info(ts()+"LE880main.js post s2cSignal auth OK");
	    //utils.log.info(ts()+"LE880main.js s2cSignal recvFile: " + recvFile);
	    //utils.log.info(ts()+"LE880main.js s2cSignal sentFile: " + sentFile);	    
	    
	    //
	    // check if webrtc should be running in browser during heartbeat timeout
	    //
	    
	    audioCtxRemoteState = req.body.audioCtxRemoteState;
	    audioCtxLocalState  = req.body.audioCtxLocalState;

	    /*
	    utils.log.info(ts()+"\n\nLE880main.js s2cSignal start " + 
	      "\n intercomOnOffState: "   + intercomOnOffState + 
	      "\n audioCtxRemoteState: "  + audioCtxRemoteState + 
	      "\n audioCtxLocalState: "   + audioCtxLocalState + 
	      "\n intercomStarted: "      + intercomStarted + 
	      "\n intercomRestartLoad: "  + intercomRestartLoad + 
	      "\n intercomRestartFail: "  + intercomRestartFail + 
	      "\n intercomPossibleFail: " + intercomPossibleFail + 
	      "\n\n");
	      */
	      	    
	    if (intercomOnOffState == "on" && intercomStarted != "true" && audioCtxRemoteState == "running" && audioCtxLocalState == "running"){
	      
	      intercomStarted = "true";
	      
	      /*
	      utils.log.info(ts()+"\n\nLE880main.js s2cSignal set intercomStarted = true " + 
		"\n intercomOnOffState: "   + intercomOnOffState + 
		"\n audioCtxRemoteState: "  + audioCtxRemoteState + 
		"\n audioCtxLocalState: "   + audioCtxLocalState + 
		"\n intercomStarted: "      + intercomStarted + 
		"\n intercomRestartLoad: "  + intercomRestartLoad + 
		"\n intercomRestartFail: "  + intercomRestartFail + 
		"\n intercomPossibleFail: " + intercomPossibleFail + 
		"\n\n");      
		*/
		
	    }
	    
	    if (intercomOnOffState == "on" && intercomStarted == "true" && (audioCtxRemoteState != "running" || audioCtxLocalState != "running")){
	      
	      delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	      var config 		= require(process.cwd() + "/LE880factoryConfig.json");
	      //utils.log.info(ts()+"LE880main.js s2cSignal: " + util.inspect(config, {showHidden: false, depth: null}));
	      
	      delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	      var configUser 	= require(process.cwd() + "/LE880userConfig.json");
	      //utils.log.info(ts()+"LE880main.js s2cSignal : " + util.inspect(configUser, {showHidden: false, depth: null}));		      
	      
	      //
	      // intercom may have failed
	      //
	      
	      intercomStarted     	= "intercom may have failed";
	      intercomRestartFail 	= configUser.intercomRestartFail;

	      var restartIntercomFile 	= "restartIntercom_" + ts1() + ".json";
	      var s2cSignalOutFile 	= process.cwd() + "/s2cSignalOut/" + restartIntercomFile;
	      var restartIntercomJSON	= {"sentFile" : restartIntercomFile, 
		"messageBar" : "Restart Intercom", 
		"intercomRestartFail" : intercomRestartFail, 
		"ts" : ts1()};	 

	      try { fs.writeFileSync(s2cSignalOutFile, JSON.stringify(restartIntercomJSON)); }
	      catch (err) { utils.log.error(ts()+"LE880main.js s2cSignal restartIntercom test fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON))\nerr: ") + err};

	      //
	      // update LE880userConfig.json
	      //
	      
	      configUser.intercomPossibleFail = "true";
	      
	      try {
		//utils.log.debug(ts()+'LE880main.js post s2cSignalOut fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser)');
		fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser));
	      }
	      catch (err) {
		utils.log.error(ts()+'LE880main.js post s2cSignalOut ERROR fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser)\nerr: ' + err);
	      }	   	      
	      
	      /*
	      utils.log.info(ts()+"\n\nLE880main.js s2cSignal sent restartIntercom to browser" + 
		"\n intercomOnOffState: "   + intercomOnOffState + 
		"\n audioCtxRemoteState: "  + audioCtxRemoteState + 
		"\n audioCtxLocalState: "   + audioCtxLocalState + 
		"\n intercomStarted: "      + intercomStarted + 
		"\n intercomRestartLoad: "  + intercomRestartLoad + 
		"\n intercomRestartFail: "  + intercomRestartFail + 
		"\n intercomPossibleFail: " + intercomPossibleFail + 
		"\n\n");	
	      */
	      
	    }
	    
	    
	    if(recvFile === undefined || sentFile === undefined){
	      utils.log.error(ts()+"LE880main.js post s2cSignal recvFile === undefined || sentFile === undefined : sentFile = " + sentFile + ", recvFile = " + recvFile);
	      
	      res.send({ "auth" : true, "noop" : true });
	      return;
	    }
	    	    
	    inJSON   		= req.body;
	    recvFile 		= req.body.recvFile;
	    s2cSignalCount      = req.body.s2cSignalCount;
	    //utils.log.info(ts()+"LE880main.js post s2cSignal s2cSignalCount: " + s2cSignalCount);

	    if( sentFile != "no_sentFile" && (recvFile == sentFile) ){ // safe to delete sentFile
	      
	      //utils.log.info(ts()+"LE880main.js post s2cSignal attempt unlink sentFile = " + sentFile);
	      var unlinkFile = process.cwd() + "/s2cSignalOut/" + sentFile;
	      
	      try {
		
		var stats = fs.statSync(unlinkFile);
		fs.unlinkSync(unlinkFile);
		utils.log.info(ts()+"LE880main.js post s2cSignal completed unlink sentFile = " + sentFile);
		
		sentFile = "no_sentFile";
		recvFile = "no_recvFile";
		
	      }
	      
	      catch (err) {
		utils.log.info(ts()+"LE880main.js post s2cSignal ERROR unlink sentFile : " + sentFile + ", err; " + err);
		
		sentFile = "no_sentFile";
		recvFile = "no_recvFile";
	      }
	      
	    } else if ( sentFile != "no_sentFile" && (recvFile != sentFile) ){ // resend sentFile
	      
	      /* 
	       * There is a small chance that the client AJAX timeout can occur
	       *   while the server is processing the client request.
	       * 
	       * If the server responds after the client AJAX timeout
	       *   the server response will be ignored by the client.
	       * 
	       * This failure mode will not be corrected by TCP since
	       *   it is caused by the application.
	       * 
	       * The sentFile / recvFile acknowledgment resolves
	       *   this small chance of communications failure.
	       */
	      
	      //utils.log.info(ts()+"LE880main.js post s2cSignal resend sentFile : sentFile = " + sentFile + ", recvFile = " + recvFile);
	      
	      let rawdata = fs.readFileSync(process.cwd() + "/s2cSignalOut/" + sentFile);
	      outJSON = JSON.parse(rawdata);
	      
	      sentFile = outJSON.sentFile;
	      //utils.log.info(ts()+"LE880main.js post s2cSignal resend sentFile = " + sentFile);
	      
	      outJSON.s2cSignalCount = s2cSignalCount;
	      //utils.log.info(ts()+"LE880main.js post s2cSignal JSON.stringify(outJSON) = " + JSON.stringify(outJSON));
	      
	      res.send(outJSON);
	      return;	      
	      
	    }
	      
	    //
	    // now we can look for new JSON files in s2cSignalOut folder
	    //
	    
	    //utils.log.info(ts()+"LE880main.js post s2cSignal look for new file to send : sentFile = " + sentFile + ", recvFile = " + recvFile);

	    var s2cSignalOutPath = process.cwd() + "/s2cSignalOut";
	    //utils.log.info(ts()+"LE880main.js post s2cSignalOutPath : " + s2cSignalOutPath);
	    
	    if(watcher){watcher.close()}
	    
	    watcher = chokidar.watch(s2cSignalOutPath + "/*.json").on("add", (event, path) => {
	            
	      //utils.log.info(ts()+"LE880main.js post watch event: " + event);	      
	      //utils.log.info(ts()+"LE880main.js post watch JSON.stringify(path) : " + JSON.stringify(path));
	      
	      let rawdata = fs.readFileSync(event);
	      outJSON = JSON.parse(rawdata);
	      
	      sentFile = outJSON.sentFile;
	      //utils.log.info(ts()+"LE880main.js post s2cSignal send sentFile = " + sentFile);

	      //
	      // make sure that the filename in event matches the filename specified in the JSON
	      //
	      
	      if(pathParse(event).base != sentFile){
		
		fs.unlinkSync(event);
		utils.log.error(ts()+"LE880main.js post s2cSignal ERROR sentFile (" + sentFile + ") does not match pathParse(event).base (" + pathParse(event).base + ")");
		
	      }
	      
	      outJSON.s2cSignalCount = s2cSignalCount;
	      //utils.log.info(ts()+"LE880main.js post s2cSignal JSON.stringify(outJSON) = " + JSON.stringify(outJSON));
	      
	      try {
		res.send(outJSON);
		//utils.log.info(ts()+"LE880main.js post s2cSignal res.send(outJSON) = " + JSON.stringify(outJSON));
	      }
	      
	      catch (err) {
		utils.log.info(ts()+"LE880main.js post s2cSignal ERROR res.send(outJSON) event: " + event + ", err = " + err);
	      }
	      
	      return;
	      
	    }); // watcher
	    
	  } else {  // auth NOT OK
	    
	      try {
		res.send({ "auth" : false });
		utils.log.info(ts()+'LE880main.js post s2cSignal auth NOT OK res.send({ "auth" : false })');
	      }
	      
	      catch (err) {
		utils.log.info(ts()+'LE880main.js post s2cSignal auth NOT OK res.send({ "auth" : false }) err: ' + err);
	      }	    
	      
	      return;
	  }

	}); // /s2cSignal
	
	//
	// post testPOST
	//

	this.webserver_admin.post('/testPOST', function (req, res) {
	  	  
	  //utils.log.info(ts()+"LE880main.js testPOST req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  var jsonObj = req.body;
	  jsonObj.auth = true;
	  res.send(jsonObj);
	  
	  //utils.log.info(ts()+"LE880main.js testPOST request jsonObj: " + util.inspect(jsonObj, {showHidden: false, depth: null}));
	  
	  //
	  // use axios like cURL for HTTPS POST with same headers as AJAX
	  //
	  
	  var url = jsonObj.url; // url for alerts to remote computer
	  
	  //var outJSON = { "axiosK1" : "axiosV1" }; // for test
	  //var outStr  = JSON.stringify(outJSON);
	  
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
	      //utils.log.info(ts()+"LE880main.js testPOST axios post response: " + response);
	      //utils.log.info(ts()+"LE880main.js testPOST request response.data: " + util.inspect(response.data, {showHidden: false, depth: null}));
	      
	      //
	      // use s2cSignal to display on messageBar
	      //
	      
	      var msg  = "test POST received and processed by LE880 API";
	          msg += "<br><br>";
		  msg += JSON.stringify(response.data);
		  
	      //var msgJSON = { "toClient" : "messageBar", "messageBar" : msg };
		  
	      var msgJSON = { "sentFile" : "testPOST.json", "toClient" : "messageBar", "messageBar" : msg };

	      var s2cSignalOutFile = process.cwd() + "/s2cSignalOut/testPOST.json";
	      //utils.log.info(ts()+"LE880main.js testPOST s2cSignalOutFile : " + s2cSignalOutFile);

	      try { fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON)); }
	      catch (err) { utils.log.error(ts()+"LE880main.js testPOST ERROR fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON))\nerr: ") + err};
	      
	    })
	    
	    .catch(function (error) {
	      utils.log.error(ts()+"LE880main.js testPOST axios post error: " + error);
	    });
	  
	}); // post testPOST
	
	//
	// post api
	//

	this.webserver_admin.post('/api', function (req, res) {
	  	  
	  //utils.log.info(ts()+"LE880main.js api req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));
	  //utils.log.info(ts()+"LE880main.js api req.headers: " + util.inspect(req.headers, {showHidden: false, depth: null}));
	  
	  var jsonObj = req.body;
	  
	  jsonObj.apiResponse = "Received POST at " + ts1();
	  //jsonObj.auth = true;
	  
	  res.send(jsonObj);
	  
	}); // api
	
	//
	// post volChange
	//

	this.webserver_admin.post('/volChange', function (req, res) {
	  	  
	  //utils.log.info(ts()+"LE880main.js post volChange req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post volChange browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post volChange browserUA: " + browserUA);
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post volChange browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post volChange browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){ // auth OK
	    
	    //utils.log.info(ts()+"LE880main.js post volChange auth ok a: " + req.body.a + ", v: " + req.body.v);
	    
	    var cmd  = "";
	    
	    delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	    var config 		= require(process.cwd() + "/LE880factoryConfig.json");
	    //utils.log.info(ts()+"LE880main.js volChange config: " + util.inspect(config, {showHidden: false, depth: null}));
	    
	    delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	    var configUser 	= require(process.cwd() + "/LE880userConfig.json");
	    //utils.log.info(ts()+"LE880main.js volChange configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));	
	    
	    /*
	    var jsonObj 			= VMSstreamLevels();
	    var VMSpaNumSrcStream 		= jsonObj.VMSpaNumSrcStream;
	    var VMSpaNumSinkStream		= jsonObj.VMSpaNumSinkStream;
	    utils.log.info(ts()+"LE880main.js post volChange VMSpaNumSrcStream :" + VMSpaNumSrcStream + ", VMSpaNumSinkStream: " + VMSpaNumSinkStream);
	    var VMSpaGstSrcStream 		= jsonObj.VMSpaGstSrcStream;
	    var VMSpaGstSinkStream		= jsonObj.VMSpaGstSinkStream;
	    utils.log.info(ts()+"LE880main.js post volChange VMSpaGstSrcStream :" + VMSpaGstSrcStream + ", VMSpaGstSinkStream: " + VMSpaGstSinkStream);
	    */
	    
	    //
	    // VMS
	    //

	    var vout;
	    var vin;
	      	    
	    if(req.body.a == "VMSspeaker"){
	      	      
	      configUser.output_vms_level = req.body.v;

		  if(configUser.vms_half_full_duplex_state == "half"){ // listen only
			vout = 0;
			  } else { // listen and talk
				vout = parseInt(Number(config.output_vms_multiplier) * req.body.v);
			  }
	      

	      
	      //
	      // adjust output_vms_app stream volume
	      //
	      
	      setTimeout(function(){
		//utils.log.info(ts()+"LE880main.js post volChange VMSspeaker v: " + req.body.v + ", vol: " + vout);
		pulseaudio_cmd_response("pactl list sink-inputs", "volChange VMSspeaker", "output_vms_app", "set", vout + "%")
	      }, 500);
		
	    } 
	    
	    else if (req.body.a == "VMSmic"){
	      
	      configUser.input_vms_level = req.body.v;
	      

		vin  = parseInt(Number(config.input_vms_multiplier) * req.body.v);
	      
	      //
	      // adjust input_vms_app stream volume
	      //
	      
	      setTimeout(function(){
		//utils.log.info(ts()+"LE880main.js post volChange VMSmic v: " + req.body.v + ", vin: " + vin);
		pulseaudio_cmd_response("pactl list source-outputs", "volChange VMSmic", "input_vms_app", "set", vin + "%");
	      }, 500);
	      
	    }

	    else if (req.body.a == "vms_PTT_down"){ 
	      
	      //
	      // set sink_input to 0 (mute speaker)
	      // set source_output to input_vms_level (enable mic)
	      //
		  vin 	= 0;
		  vout 	= parseInt(Number(config.output_vms_multiplier) * Number(configUser.output_vms_level)).toString();

	      
	      //utils.log.info(ts()+"LE880main.js post volChange vms_PTT_down vout: " + vout + ", vin: " + vin);

	      setTimeout(function(){
		pulseaudio_cmd_response("pactl list sink-inputs", "volChange vms_PTT_down", "output_vms_app", "set", vout + "%");
	      }, 500);
	      
	      setTimeout(function(){
		pulseaudio_cmd_response("pactl list source-outputs", "volChange vms_PTT_down", "input_vms_app", "set", vin + "%");
	      }, 500);
	      
	    } // else if (req.body.a == "vms_PTT_down")    

	    else if (req.body.a == "vms_PTT_up"){
	      
	      //
	      // set sink_input to output_vms_level (enable speaker)
	      // set source_output to input_vms_level (enable mic if full duplex)
	      // 
      
	      if(configUser.vms_half_full_duplex_state == "half"){
		vout 	= 0;
		vin 	= parseInt(Number(config.input_vms_multiplier) * Number(configUser.input_vms_level)).toString();

	      } else {
		vin  	= parseInt(Number(config.input_vms_multiplier) * Number(configUser.input_vms_level)).toString();
		vout 	= parseInt(Number(config.output_vms_multiplier) * Number(configUser.output_vms_level)).toString();
	      }

	      setTimeout(function(){
		//utils.log.info(ts()+"LE880main.js post volChange vms_PTT_up set sink-input to " + vout + "%");
		pulseaudio_cmd_response("pactl list sink-inputs", "volChange vms_PTT_up", "output_vms_app", "set", vout + "%");
	      }, 500);
	      	      
	      setTimeout(function(){
		//utils.log.info(ts()+"LE880main.js post volChange vms_PTT_up set source-output to " + vin + "%");
		pulseaudio_cmd_response("pactl list source-outputs", "volChange vms_PTT_up", "input_vms_app", "set", vin + "%");
	      }, 500);

	    } // else if (req.body.a == "vms_PTT_up")
	    	    
	    //
	    // intercom
	    //
	    
	    else if(req.body.a == "speaker"){
	      
	      configUser.output_intercom_level  = req.body.v;
	      
	      vout 	= parseInt(Number(config.output_intercom_multiplier) * req.body.v);
	      
	      //
	      // adjust output_intercom_app stream volume
	      //
	      
	      setTimeout(function(){
		//utils.log.info(ts()+"LE880main.js post volChange speaker v: " + req.body.v + ", vout: " + vout);
		pulseaudio_cmd_response("pactl list sink-inputs", "volChange speaker", "output_intercom_app", "set", vout + "%")
	      }, 500);	      
	      
	    } 
	    
	    else if (req.body.a == "mic"){
	      
	      configUser.input_intercom_level  = req.body.v;
	      
	      vin  	= parseInt(Number(config.input_intercom_multiplier) * req.body.v);
	      
	      //
	      // adjust input_intercom_app stream volume
	      //
	      
	      setTimeout(function(){
		//utils.log.info(ts()+"LE880main.js post volChange mic v: " + req.body.v + ", vin: " + vin);
		pulseaudio_cmd_response("pactl list source-outputs", "volChange mic", "input_intercom_app", "set", vin + "%")
	      }, 500);
	      
	    }

	    else if (req.body.a == "PTT_down"){ 
	      
	      //
	      // set sink_input to 0 (mute speaker)
	      // set source_output to input_vms_level (enable mic)
	      //
		  vin 	= 0;
		  vout 	= parseInt(Number(config.output_intercom_multiplier) * Number(configUser.output_intercom_level)).toString();	      

	      
	      utils.log.info(ts()+"LE880main.js post volChange vms_PTT_down vout: " + vout + ", vin: " + vin);

	      setTimeout(function(){
		pulseaudio_cmd_response("pactl list sink-inputs", "volChange vms_PTT_down", "output_intercom_app", "set", vout + "%");
	      }, 500);
	      
	      setTimeout(function(){
		pulseaudio_cmd_response("pactl list source-outputs", "volChange vms_PTT_down", "input_intercom_app", "set", vin + "%");
	      }, 500);
	      
	    } // else if (req.body.a == "PTT_down")    

	    else if (req.body.a == "PTT_up"){

	      //
	      // set sink_input to output_intercom_level (enable speaker)
	      // set source_output to input_intercom_level (enable mic if full duplex)
	      // 
      
	      if(configUser.vms_half_full_duplex_state == "half"){
		vout 	= 0;
		vin 	= parseInt(Number(config.input_intercom_multiplier) * Number(configUser.input_intercom_level)).toString();
	      } else {
		vin  	= parseInt(Number(config.input_intercom_multiplier) * Number(configUser.input_intercom_level)).toString();
		vout 	= parseInt(Number(config.output_intercom_multiplier) * Number(configUser.output_intercom_level)).toString();
	      }

	      setTimeout(function(){
		//utils.log.info(ts()+"LE880main.js post volChange vms_PTT_up set sink-input to " + vout + "%");
		pulseaudio_cmd_response("pactl list sink-inputs", "volChange vms_PTT_up", "output_intercom_app", "set", vout + "%");
	      }, 500);
	      	      
	      setTimeout(function(){
		//utils.log.info(ts()+"LE880main.js post volChange vms_PTT_up set source-output to " + vin + "%");
		pulseaudio_cmd_response("pactl list source-outputs", "volChange vms_PTT_up", "input_intercom_app", "set", vin + "%");
	      }, 500);

	    } // else if (req.body.a == "PTT_up")
	    	    	    
	    else {
	      res.send({ "auth" : true, "status" : "error" });
	      return;
	    }
	    
	    //
	    // update LE880userConfig.json
	    //
	    
	    try {
	      //utils.log.debug(ts()+'LE880main.js post volChange fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser)');
	      fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser));
	    }
	    catch (err) {
	      utils.log.error(ts()+'LE880main.js post volChange ERROR fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser)\nerr: ' + err);
	    }	   
	    	    
	    res.send({ "auth" : true, "status" : "ok" });
	    
	  } else {  // auth NOT OK
	    res.send({ "auth" : false });
	  }
	  
	}); // volChange

	//
	// post intercomAutoStart
	//
	
	this.webserver_admin.post('/intercomAutoStart', function (req, res) {
	  	  
	  //utils.log.info(ts()+"LE880main.js post intercomAutoStart req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));

	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post intercomAutoStart browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post intercomAutoStart browserUA: " + browserUA);
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post intercomAutoStart browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post intercomAutoStart browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){ // auth OK
	    
	    if(req.body.intercomAutoStart){
	    
	      delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	      var configUser 	= require(process.cwd() + "/LE880userConfig.json");
	      //utils.log.info(ts()+"LE880main.js post intercomAutoStart 1 configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));	      	    
	    
	      configUser.intercomRestartLoad = req.body.intercomAutoStart;
	      //utils.log.info(ts()+"LE880main.js post intercomAutoStart 2 configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));	      	    
	      
	      fs.writeFile(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser), (err) => {
		if (err){
		  utils.log.error(ts()+"LE880main.js ERROR post intercomAutoStart (intercomRestartLoad) fs.writeFile configUser.intercomAutoStart err: " + err);
		  res.send({ "auth" : false, "msg" : "ERROR post intercomAutoStart (intercomRestartLoad) fs.writeFile configUser.intercomAutoStart" });
		  return;
		}
		utils.log.info(ts()+"LE880main.js SUCCESS post intercomAutoStart (intercomRestartLoad) fs.writeFile configUser.intercomAutoStart");
	      });	      

	    }
	    
	    res.send({ "auth" : true });
	    
	  } else {  // auth NOT OK
	    res.send({ "auth" : false });
	  }
	  
	}); // intercomAutoStart

	//
	// post intercomOnOff
	//
	
	var intercomOnOffState = "off";
	
	this.webserver_admin.post('/intercomOnOff', function (req, res) {
	  	  
	  //utils.log.info(ts()+"LE880main.js post intercomOnOff req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post intercomOnOff browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post intercomOnOff browserUA: " + browserUA);
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post intercomOnOff browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post intercomOnOff browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){ // auth OK
	    
	    utils.log.info(ts()+"LE880main.js post intercomOnOff auth ok intercom: " + req.body.intercomOnOff);
	    
	    var cmd = "";
	    
	    if(req.body.intercomOnOff == "on"){
	      
	      intercomOnOffState = "on";     
	      
	      delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	      var config 		= require(process.cwd() + "/LE880factoryConfig.json");
	      //utils.log.info(ts()+"LE880main.js intercomOnOff config: " + util.inspect(config, {showHidden: false, depth: null}));
	      
	      delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	      var configUser 	= require(process.cwd() + "/LE880userConfig.json");
	      //utils.log.info(ts()+"LE880main.js intercomOnOff configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));	      
	      
	      var LOG = config.LOG;
	      
	      // wss://192.168.199.203:8443
	      
	      var server 		= "wss://" + utils.getIpAddress() + ":" + config.WSSserverPort;
	      
	      //
	      // cmd_pkill must be execSync before cmd_pulseaudio
	      //

	      var cmd_pkill 		= "sudo pkill -9 -f 'LE880-webrtc-wm8960' >> "+LOG+"LE880-webrtc-pkill.log 2>&1";
	      
	      try {
		execSync(cmd_pkill);
		utils.log.info(ts()+"LE880main.js post intercomOnOff SUCCESS cmd_pkill: " + cmd_pkill);
	      }
	      catch (err) {
		utils.log.error(ts()+"LE880main.js post intercomOnOff ERROR err: " + err + "\ncmd_pkill: " + cmd_pkill);
	      }
	      
	      var vout;
	      var vin;
	      
	      //if(configUser.intercomEcho == "true"){
		
		utils.log.info(ts()+"LE880main.js post intercomOnOff intercomEcho == true");
		
		if (configUser.half_full_duplex_state == "half"){

		  //
		  // set sink_input to output_intercom_level (enablespeaker)
		  // set source_output to 0 (disable mic)
		  // 
	  
		  vout 	= parseInt(Number(config.output_intercom_multiplier) * Number(configUser.output_intercom_level)).toString();
		  vin  	= 0;

		  setTimeout(function(){
		    utils.log.info(ts()+"LE880main.js intercomOnOffs sink-input to " + vout + "%");
		    pulseaudio_cmd_response("pactl list sink-inputs", "UserChangeSettings", "output_intercom_app", "set", vout + "%");
		  }, 500);
			  
		  setTimeout(function(){
		    utils.log.info(ts()+"LE880main.js intercomOnOff source-output to " + vin + "%");
		    pulseaudio_cmd_response("pactl list source-outputs", "UserChangeSettings", "input_intercom_app", "set", vin + "%");
		  }, 500);
		  
		}

		if (configUser.half_full_duplex_state == "full"){

		  //
		  // set sink_input to output_intercom_level (enable speaker)
		  // set source_output to input_intercom_level (enable mic)
		  // 
	  
		  vout 	= parseInt(Number(config.output_intercom_multiplier) * Number(configUser.output_intercom_level)).toString();
		  vin  	= parseInt(Number(config.input_intercom_multiplier) * Number(configUser.input_intercom_level)).toString();
		  
		  setTimeout(function(){
		    utils.log.info(ts()+"LE880main.js intercomOnOff set sink-input to " + vout + "%");
		    pulseaudio_cmd_response("pactl list sink-inputs", "UserChangeSettings", "output_intercom_app", "set", vout + "%");
		  }, 500);
			  
		  setTimeout(function(){
		    utils.log.info(ts()+"LE880main.js intercomOnOff source-output to " + vin + "%");
		    pulseaudio_cmd_response("pactl list source-outputs", "UserChangeSettings", "input_intercom_app", "set", vin + "%");
		  }, 500);
		  
		}
		
		//
		// set browser speaker volume to zero which will change pulseaudio speaker volume
		//

		var sliderSpeakerFile 		= "sliderSpeaker.json";
		var s2cSignalOutFile 		= process.cwd() + "/s2cSignalOut/" + sliderSpeakerFile;
		var sliderSpeakerNow 		= 0;
		var JSONsliderSpeakerNow	= {"sentFile" : sliderSpeakerFile, "sliderSpeakerNow" : sliderSpeakerNow, "ts" : ts1()};	 

		utils.log.info(ts()+"LE880main.js post intercomOnOff JSON.stringify(JSONsliderSpeaker): " + JSON.stringify(JSONsliderSpeakerNow));
		utils.log.info(ts()+"LE880main.js post intercomOnOff sliderSpeakerNow s2cSignalOutFile: " + s2cSignalOutFile);
		
		try { fs.writeFileSync(s2cSignalOutFile, JSON.stringify(JSONsliderSpeakerNow)); }
		catch (err) { utils.log.error(ts()+"LE880main.js intercomOnOff fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON))\nerr: ") + err};
		
		//
		// intercom cmd
		//

		cmd  = "";
		//cmd += "GST_DEBUG=2,*pulse*:4,*audio*:4 ";
		
		if(configUser.intercomEcho == "true"){
		  cmd += "PULSE_PROP='filter.want=echo-cancel' ";
		}
		cmd += '/home/pi/LE880-Profile-T/c/LE880-webrtc-wm8960-pa-ec-00 --peer-id 880 --server ' + server + ' >> '+LOG+'LE880-webrtc-wm8960-pa-ec-00.log 2>&1 &';		
		
		//
		// allow time for volume to settle before starting webrtc
		//
		
		setTimeout(function(){
		  utils.log.info(ts()+"LE880main.js post intercomOnOff intercomEcho == true, start intercom");
		  pulseaudio_cmd(cmd, "intercomOnOff intercomEcho == true, start intercom")
		}, 6000); 
		
		//
		// allow time for webrtc to start then set speaker volume
		//
		
		setTimeout(function(){
		  
		  utils.log.info(ts()+"LE880main.js post intercomOnOff intercomEcho == true, set volume");      
		  
		  //
		  // increase browser sliderSpeaker which will change pulseaudio speaker volume
		  //

		  sliderSpeakerFile 		= "sliderSpeaker_" + ts1() + ".json";
		  s2cSignalOutFile 		= process.cwd() + "/s2cSignalOut/" + sliderSpeakerFile;
		  var sliderSpeakerSmooth     	= configUser.volSpeaker;
		  //ar sliderSpeakerSmooth     	= paNumSink;
		  var JSONsliderSpeakerSmooth 	= {
		    "sentFile" : sliderSpeakerFile, 
		    "sliderSpeakerSmooth" : sliderSpeakerSmooth, 
		    "interval_mSec" : 500,
		    "interval_num" : 12,
		    "ts" : ts()
		  };	 

		  utils.log.info(ts()+"LE880main.js post intercomOnOff intercomEcho == true JSON.stringify(JSONsliderSpeakerSmooth): " + JSON.stringify(JSONsliderSpeakerSmooth));
		  utils.log.info(ts()+"LE880main.js post intercomOnOff intercomEcho == true sliderSpeakerSmooth s2cSignalOutFile: " + s2cSignalOutFile);
		
		  try { fs.writeFileSync(s2cSignalOutFile, JSON.stringify(JSONsliderSpeakerSmooth)); }
		  catch (err) { utils.log.error(ts()+"LE880main.js intercomOnOff intercomEcho == true fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON))\nerr: ") + err};		  
		  
		}, 8000);
	    
	    } // if(req.body.intercomOnOff == "on")
	    
	    
	    else { // req.body.intercomOnOff == "off"
	      
	      intercomOnOffState = "off";
	      
	      intercomStarted    = "false";
	      
	      // LE880-webrtc-wm8960 killed above
	      
	    }
	    
	    res.send({ "auth" : true });
	    
	  } else {  // auth NOT OK
	    res.send({ "auth" : false });
	  }
	  
	}); // intercomOnOff

	//
	// post LE880toVMSAutoStart
	//

	/*
	
	this.webserver_admin.post('/LE880toVMSAutoStart', function (req, res) {
	  	  
	  utils.log.info(ts()+"LE880main.js post LE880toVMSAutoStart req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));

	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post LE880toVMSAutoStart browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post LE880toVMSAutoStart browserUA: " + browserUA);
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post LE880toVMSAutoStart browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post LE880toVMSAutoStart browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){ // auth OK
	    
	    if(req.body.LE880toVMSAutoStart){
	    
	      delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	      var configUser 	= require(process.cwd() + "/LE880userConfig.json");
	      utils.log.info(ts()+"LE880main.js post LE880toVMSAutoStart 1 configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));	      	    
	    
	      configUser.LE880toVMSAutoStart = req.body.LE880toVMSAutoStart;
	      utils.log.info(ts()+"LE880main.js post LE880toVMSAutoStart 2 configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));	      	    
	      
	      fs.writeFile(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser), (err) => {
		if (err){
		  utils.log.error(ts()+"LE880main.js ERROR post LE880toVMSAutoStart fs.writeFile configUser.LE880toVMSAutoStart err: " + err);
		  res.send({ "auth" : false, "msg" : "ERROR post LE880toVMSAutoStart fs.writeFile configUser.LE880toVMSAutoStart" });
		  return;
		}
		utils.log.info(ts()+"LE880main.js SUCCESS post LE880toVMSAutoStart (intercomRestartLoad) fs.writeFile configUser.LE880toVMSAutoStart");
	      });	      

	    }
	    
	    res.send({ "auth" : true });
	    
	  } else {  // auth NOT OK
	    res.send({ "auth" : false });
	  }
	  
	}); 
	
	*/
	
	// LE880toVMSAutoStart

	//
	// post VMSsendOnOff (controls startRtsp and stopRtsp)
	//

	
	
	this.webserver_admin.post('/VMSsendOnOff', function (req, res) {
	  	  
	  //utils.log.info(ts()+"LE880main.js post VMSsendOnOff req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post VMSsendOnOff browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post VMSsendOnOff browserUA: " + browserUA);
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post VMSsendOnOff browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post VMSsendOnOff browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){ // auth OK

	    utils.log.info(ts()+"LE880main.js post VMSsendOnOff auth ok VMSsendOnOffstate: " + req.body.VMSsendOnOffstate);
	    
	    var resJSONobj = JSON.parse('{ "auth" : true }');
	    
	    var msg = "";

	    if(req.body.VMSsendOnOffstate == "on"){
	      
	      cmd = "pactl list short sources";
	      pulseaudio_cmd(cmd, "VMSsendOnOff");

	      cmd = "pactl list short sinks";
	      pulseaudio_cmd(cmd, "VMSsendOnOff");	

	      var OutgoingAudioURL 	= req.body.OutgoingAudioURL;
	      var encoder 		= req.body.encoder;

	      delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	      var config 		= require(process.cwd() + "/LE880factoryConfig.json");
	      //utils.log.info(ts()+"LE880main.js post VMSsendOnOff config: " + util.inspect(config, {showHidden: false, depth: null}));
	      
	      delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	      var configUser 	= require(process.cwd() + "/LE880userConfig.json");
	      //utils.log.info(ts()+"LE880main.js post VMSsendOnOff configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));

	      //var paNumSrc  		= parseInt((Number(configUser.volMic)     * Number(config.volMicMultiplier))).toString();
	      //var paNumSrcVol 	= paNumSrc / 100;
	      
	      //var paNumSink 		= parseInt((Number(configUser.volSpeaker) * Number(config.volSpeakerMultiplier))).toString();
	      //var paNumSinkVol 	= paNumSink / 100;	
		  
		 // config.OutgoingAudioURL = "rtsp://"+req.body.RTSPUsername+":"+req.body.RTSPPassword+"@127.0.0.1:"+req.body.RTSPPort+"/LE880";

		
	      var jsonObj 			= VMSstreamLevels();
	      var VMSpaNumSrcStream 		= jsonObj.VMSpaNumSrcStream;
	      var VMSpaNumSinkStream		= jsonObj.VMSpaNumSinkStream;
	      utils.log.info(ts()+"LE880main.js startRtsp VMSpaNumSrcStream :" + VMSpaNumSrcStream + ", VMSpaNumSinkStream: " + VMSpaNumSinkStream);
	      var VMSpaGstSrcStream 		= jsonObj.VMSpaGstSrcStream;
	      var VMSpaGstSinkStream		= jsonObj.VMSpaGstSinkStream;
	      utils.log.info(ts()+"LE880main.js startRtsp VMSpaGstSrcStream :" + VMSpaGstSrcStream + ", VMSpaGstSinkStream: " + VMSpaGstSinkStream);

	      if (configUser.AudioOptionsStreamingContainerDefault == "RTSP") {
		
		msg += configUser.AudioOptionsStreamingContainerDefault;
		//utils.log.warn(ts()+"LE880main.js post VMSsendOnOff configUser.AudioOptionsStreamingContainerDefault " + msg);
		
		_this.startRtsp();
		utils.log.info(ts()+"LE880main.js post VMSsendOnOff LE880export.prototype.startRtsp");
	      
	      } else if (configUser.AudioOptionsStreamingContainerDefault == "UDPMulticast") {
	      
		//let cmd  = "gst-launch-1.0 pulsesrc device=alsa_input.platform-soc_sound.analog-stereo volume=1.0 ! ";
		let cmd  = "gst-launch-1.0 pulsesrc device=alsa_input.platform-soc_sound.analog-stereo volume=" + VMSpaGstSrcStream + " ! ";
		    cmd += "mulawenc ! ";
		    cmd += "rtppcmupay ! ";
		    cmd += "udpsink host=224.1.2.1 auto-multicast=true port=5555 sync=false async=false";

		let cmdPi = 'sudo su - pi -c "' + cmd + '"';
		exec(cmdPi, (error, stdout, stderr) => {
		    if (error) {
			utils.log.error(ts()+`LE880main.js post VMSsendOnOff : ${error.message}, cmd: ` + cmd);
		    }
		    if (stderr) {
			utils.log.error(ts()+`LE880main.js post VMSsendOnOff stderr: ${stderr}, cmd: ` + cmd);
		    }
		    utils.log.info(ts()+`LE880main.js post VMSsendOnOff stdout: ${stdout}, cmd: ` + cmd);
		});	    
		
	      } else if (configUser.AudioOptionsStreamingContainerDefault == "HTTP") {

		msg += "LE880 to VMS protocol not available: " + configUser.AudioOptionsStreamingContainerDefault;
		//utils.log.warn(ts()+"LE880main.js post VMSsendOnOff configUser.AudioOptionsStreamingContainerDefault " + msg);
		
		resJSONobj.errorMsg = msg; // not ok if not RTSP
		
	      } else {
		
		msg += "LE880 to VMS protocol not available: " + configUser.AudioOptionsStreamingContainerDefault;
		//utils.log.warn(ts()+ "LE880main.js post VMSsendOnOff configUser.AudioOptionsStreamingContainerDefault " + msg);
		resJSONobj.errorMsg = msg;
		
	      }

	    } else { // kill LE880 to VMS stream if VMSsendOnOff is set to off
	      
	      //
	      // kill all LE880 to vms streams
	      //
	      
	      let cmd = "sudo pkill -9 -f 'LE880-rtsp-server'"; //  rtsp
	      try {
		execSync(cmd);
		utils.log.info(ts()+'LE880main.js post VMSsendOnOff cmd: ' + cmd);
	      }
	      catch (error) {
		utils.log.info(ts()+'LE880main.js post VMSsendOnOff PROCESS NOT FOUND cmd:' + cmd + ', error.toString(): ' + error.toString());
	      }	      
	      
	      cmd = "sudo pkill -9 -f 'gst-launch-1.0 playbin audio-sink=fakesink'"; // rtsp race 
	      try {
		execSync(cmd);
		utils.log.info(ts()+'LE880main.js post VMSsendOnOff cmd: ' + cmd);
	      }
	      catch (error) {
		utils.log.info(ts()+'LE880main.js post VMSsendOnOff PROCESS NOT FOUND cmd:' + cmd + ', error.toString(): ' + error.toString());
	      }	  
	      
	      cmd = "sudo pkill -9 -f 'udpsink host'"; // UDPMulticast
	      try {
		execSync(cmd);
		utils.log.info(ts()+'LE880main.js post VMSsendOnOff cmd: ' + cmd);
	      }
	      catch (error) {
		utils.log.info(ts()+'LE880main.js post VMSsendOnOff PROCESS NOT FOUND cmd:' + cmd + ', error.toString(): ' + error.toString());
	      }	  
			    
	    } // kill LE880 to VMS stream if VMSsendOnOff is set to off

	    //utils.log.info(ts()+"LE880main.js post VMSsendOnOff JSON.stringify(resJSONobj): " + JSON.stringify(resJSONobj));
	    
	    res.send(resJSONobj);
	    
	  } else {  // auth NOT OK
	    res.send({ "auth" : false });
	  }
	  
	}); // VMSsendOnOff

	//
	// post VMStoLE880AutoStart
	//
	
	this.webserver_admin.post('/VMStoLE880AutoStart', function (req, res) {
	  	  
	  utils.log.info(ts()+"LE880main.js post VMStoLE880AutoStart req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));

	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post VMStoLE880AutoStart browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post VMStoLE880AutoStart browserUA: " + browserUA);
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post VMStoLE880AutoStart browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post VMStoLE880AutoStart browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){ // auth OK
	    
	    if(req.body.VMStoLE880AutoStart){
	    
	      delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	      var configUser 	= require(process.cwd() + "/LE880userConfig.json");
	      //utils.log.info(ts()+"LE880main.js post VMStoLE880AutoStart 1 configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));	      	    
	    
	      configUser.VMStoLE880AutoStart = req.body.VMStoLE880AutoStart;
	      //utils.log.info(ts()+"LE880main.js post VMStoLE880AutoStart 2 configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));	      	    
	      
	      fs.writeFile(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser), (err) => {
		if (err){
		  utils.log.error(ts()+"LE880main.js ERROR post VMStoLE880AutoStart fs.writeFile configUser.VMStoLE880AutoStart err: " + err);
		  res.send({ "auth" : false, "msg" : "ERROR post VMStoLE880AutoStart fs.writeFile configUser.VMStoLE880AutoStart" });
		  return;
		}
		utils.log.info(ts()+"LE880main.js SUCCESS post VMStoLE880AutoStart (intercomRestartLoad) fs.writeFile configUser.VMStoLE880AutoStart");
	      });	      

	    }
	    
	    res.send({ "auth" : true });
	    
	  } else {  // auth NOT OK
	    res.send({ "auth" : false });
	  }
	  
	}); // VMStoLE880AutoStart

	//
	// post VMSrecvOnOff
	//
	
	this.webserver_admin.post('/VMSrecvOnOff', function (req, res) {
	  	  
	  //utils.log.info(ts()+"LE880main.js post VMSrecvOnOff req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post VMSrecvOnOff browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post VMSrecvOnOff browserUA: " + browserUA);
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post VMSrecvOnOff browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post VMSrecvOnOff browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){ // auth OK

	    utils.log.info(ts()+"LE880main.js post VMSrecvOnOff auth ok VMSrecvOnOffstate: " + req.body.VMSrecvOnOffstate);

	    delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	    var config 		= require(process.cwd() + "/LE880factoryConfig.json");
	    //utils.log.info(ts()+"LE880main.js post VMSrecvOnOff config: " + util.inspect(config, {showHidden: false, depth: null}));
	    
	    delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	    var configUser 	= require(process.cwd() + "/LE880userConfig.json");
	    //utils.log.info(ts()+"LE880main.js post VMSrecvOnOff configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));

	    var LOG = config.LOG;
	    
	    if(req.body.VMSrecvOnOffstate == "on"){
	      
	      //cmd = "pactl list short sources";
	      //pulseaudio_cmd(cmd, "VMSrecvOnOff");

	      //cmd = "pactl list short sinks";
	      //pulseaudio_cmd(cmd, "VMSrecvOnOff");		      
	      
	      //var IncomingAudioURL 	= req.body.IncomingAudioURL.replace("!", "\!");
	      var IncomingAudioURL 	= req.body.IncomingAudioURL;
	      
	      var jsonObj 			= VMSstreamLevels();
	      var VMSpaNumSrcStream 		= jsonObj.VMSpaNumSrcStream;
	      var VMSpaNumSinkStream		= jsonObj.VMSpaNumSinkStream;
	      utils.log.info(ts()+"LE880main.js post VMSrecvOnOff VMSpaNumSrcStream :" + VMSpaNumSrcStream + ", VMSpaNumSinkStream: " + VMSpaNumSinkStream);
	      var VMSpaGstSrcStream 		= jsonObj.VMSpaGstSrcStream;
	      var VMSpaGstSinkStream		= jsonObj.VMSpaGstSinkStream;
	      utils.log.info(ts()+"LE880main.js post VMSrecvOnOff VMSpaGstSrcStream :" + VMSpaGstSrcStream + ", VMSpaGstSinkStream: " + VMSpaGstSinkStream);

	      //
	      // kill process if it exists
	      //
	      
	      var cmdKill = "sudo su - pi -c 'pkill -9 -f 'rtspsrc location' >> "+LOG+"LE880VMSrecvOn.sh.log 2>&1;'";
	      try {
	     	execSync(cmdKill);
	      }
	      catch (err){
		  utils.log.warn(ts()+"LE880main.js post VMSrecvOnOff " + cmdKill + ", err; " + err);
	      }   	      
	      
	      if(configUser.vmsEcho == "true"){
		
	 		var cmd  = '';
			//cmd += 'GST_DEBUG=4 ';
			cmd += 'PULSE_PROP="filter.want=echo-cancel" ';
			cmd += 'gst-launch-1.0 rtspsrc location=\'' + IncomingAudioURL + '\' ! \ ';
			cmd += 'rtppcmudepay ! \ ';
			cmd += 'mulawdec ! \ ';
			cmd += 'pulsesink device=alsa_output.platform-soc_sound.analog-stereo volume=' + VMSpaNumSinkStream + " ";
			cmd += 'stream-properties=props,filter.want=echo-cancel ';
			cmd += 'stream-properties=props,aec_method=webrtc ';
			cmd += '>>'+LOG+'LE880VMSrecvOn-echo-cancel.sh.log 2>&1 &';
				
		/*
			var cmd  = '';
			//cmd += 'GST_DEBUG=4 ';
			cmd += 'PULSE_PROP="filter.want=echo-cancel" ';
			cmd += 'gst-launch-1.0 rtspsrc location=\'' + IncomingAudioURL + '\' ! \ ';
			cmd += 'rtppcmudepay ! \ ';
			cmd += 'mulawdec ! \ ';
			cmd += 'audioconvert ! \ ';
			cmd += 'audioresample ! \ ';
			cmd += 'audio/x-raw, format=F32LE, rate=32000, channels=1 ! \ ';
			cmd += 'pulsesink device=alsa_output.platform-soc_sound.analog-stereo volume=' + paNumSinkVol + " ";
			cmd += 'stream-properties=props,filter.want=echo-cancel ';
			cmd += 'stream-properties=props,aec_method=webrtc ';
			cmd += '>>'+LOG+'LE880VMSrecvOn-echo-cancel.sh.log 2>&1 &';
			*/
			
			pulseaudio_cmd(cmd, "LE880main.js VMSrecvOnOff configUser.vmsEcho == true");
		
	      } else { // if(configUser.vmsEcho == "false")

		var cmd  = '';
		//cmd += 'GST_DEBUG=4 ';
		cmd += 'gst-launch-1.0 rtspsrc location=\'' + IncomingAudioURL + '\' ! \ ';
		cmd += 'rtppcmudepay ! \ ';
		cmd += 'mulawdec ! \ ';
		cmd += 'pulsesink device=alsa_output.platform-soc_sound.analog-stereo volume=' + VMSpaNumSinkStream + ' >> '+LOG+'LE880VMSrecvOn.sh.log 2>&1 &'; // wm8960 speaker

		/*
		var cmd  = '';
		//cmd += 'GST_DEBUG=4 ';
		cmd += 'gst-launch-1.0 rtspsrc location=\'' + IncomingAudioURL + '\' ! \ ';
		cmd += 'rtppcmudepay ! \ ';
		cmd += 'mulawdec ! \ ';
		cmd += 'audioconvert ! \ ';
		cmd += 'audioresample ! \ ';
		cmd += 'audio/x-raw, format=F32LE, rate=32000, channels=1 ! \ ';
			
		//cmd += 'pulsesink device=alsa_output.platform-soc_sound.analog-stereo > '+LOG+'LE880VMSrecvOn.sh.log 2>&1 &'; // wm8960 speaker
		cmd += 'pulsesink device=alsa_output.platform-soc_sound.analog-stereo volume=' + paNumSinkVol + ' >> '+LOG+'LE880VMSrecvOn.sh.log 2>&1 &'; // wm8960 speaker
		*/
		
		pulseaudio_cmd(cmd, "LE880main.js VMSrecvOnOff configUser.vmsEcho == false");
		
	      }
	      
	    } else { // req.body.VMSrecvOnOffstate != "on"
	      
	      var cmd = "sudo pkill -9 -f 'rtspsrc location' > "+LOG+"LE880VMSrecvOff.sh.log 2>&1";
	      pulseaudio_cmd(cmd, "LE880main.js VMSrecvOnOff req.body.VMSrecvOnOffstate != on, configUser.vmsEcho == true");
		 // var cmd = "sudo GST_DEBUG=1 /home/pi/LE880-Profile-T/rtspbc"
		 // execSync(cmd);
	      
	    }
	    
	    res.send({ "auth" : true });
	    
	  } else {  // auth NOT OK
	    res.send({ "auth" : false });
	  }
	  
	}); // VMSrecvOnOff

	//
	// post setDhcpStatic
	//

	this.webserver_admin.post('/setDhcpStatic', function (req, res) {
	  	  
	  utils.log.info(ts()+"LE880main.js post setDhcpStatic req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post setDhcpStatic browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post setDhcpStatic browserUA: " + browserUA);
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post setDhcpStatic browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post setDhcpStatic browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){ // auth OK
	    
	    delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	    var config 		= require(process.cwd() + "/LE880factoryConfig.json");
	    //utils.log.info(ts()+"LE880main.js post setDhcpStatic: config: " + util.inspect(config, {showHidden: false, depth: null}));
	    
	    delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	    var configUser 	= require(process.cwd() + "/LE880userConfig.json");
	    //utils.log.info(ts()+"LE880main.js post setDhcpStatic configUser: " + util.inspect(configUser, {showHidden: false, depth: null}));	    
	    
	    //
	    // save post vars into configUser
	    //
	    
	    configUser.dhcpStaticSelected 	= req.body.dhcpStaticSelected;
	    configUser.setStatic 		= req.body.setStatic;
	    configUser.setRouter 		= req.body.setRouter;
	    configUser.setDNS    		= req.body.setDNS;

	    try {
	      //utils.log.debug(ts()+'LE880main.js post setDhcpStatic fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser)');
	      fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser));
	    }
	    catch (err) {
	      utils.log.error(ts()+'LE880main.js post setDhcpStatic ERROR fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser)\nerr: ' + err);
	    }	   	    
	    
	    var resJSONobj = JSON.parse('{ "auth" : true }');
	    
	    if(req.body.dhcpStaticSelected == "DHCP") {
	      
	      utils.log.debug(ts()+'LE880main.js post setDhcpStatic req.body.dhcpStaticSelected == "DHCP"');
	      
	      resJSONobj.msg  = "Rebooting LE880 and setting DHCP.";
	      resJSONobj.msg += "<br>Your IP address may be changed by DHCP if you were using a static IP address.";
	      resJSONobj.msg += "<br>You may need to manually enter the DHCP generated IP address in your browser and log in.";
	      
	      res.send(resJSONobj);
	      
	      var cmd = "sudo cp /etc/dhcpcd_LE880.conf.backup /etc/dhcpcd.conf; sleep 5; sudo reboot;";
	      
	      try {
		exec(cmd);
	      }
	      catch (err) {
		utils.log.error(ts()+'LE880main.js post setDhcpStatic ERROR err: ' + err + '\nexec(cmd): ' + cmd);
	      }
	      
	    } else { // StaticIP
	      
	      utils.log.debug(ts()+'LE880main.js post setDhcpStatic req.body.dhcpStaticSelected == "StaticIP"');
	      
	      resJSONobj.msg = "Rebooting LE880 and setting static IP address."; 
	      resJSONobj.msg += "<br>You may need to manually enter the static IP address in your browser and log in.";

	      //
	      // modify /etc/dhcpcd.conf at line "# LE880 static IP config"
	      //
	      
	      try {
		//utils.log.debug(ts()+'LE880main.js post setDhcpStatic fs.readFileSync("/etc/dhcpcd.conf")');
		var strIn = fs.readFileSync("/etc/dhcpcd.conf");
	      }
	      catch (err) {
		utils.log.error(ts()+'LE880main.js post setDhcpStatic ERROR fs.readFileSync("/etc/dhcpcd.conf")\nerr: ' + err);
	      }

	      var arr = strIn.toString().split("\n");
	      
	      for (var i = 0; i < arr.length; i++) {
		
		//utils.log.debug(ts()+'LE880main.js post setDhcpStatic arr[' + i + ']: ' + arr[i]);
		
		if(arr[i] == "# LE880 static IP config:"){
		  utils.log.debug(ts()+'LE880main.js post MATCH setDhcpStatic arr[' + i + ']: ' + arr[i]);
		  break;
		}
	      }

	      /*
	      i		# LE880 static IP config:
	      i+1	#interface eth0
	      i+2	#static ip_address=192.168.0.10/24
	      i+3	#static ip6_address=fd51:42f8:caae:d92e::ff/64
	      i+4	#static routers=192.168.0.1
	      i+5	#static domain_name_servers=192.168.0.1 8.8.8.8 fd51:42f8:caae:d92e::1
	      */
	      
	      arr[i+1]   = "interface eth0";
	      arr[i+2]   = "static ip_address=" + req.body.setStatic + "/24";
	      arr[i+4]   = "static routers=" + req.body.setRouter;
	      arr[i+5]   = "static domain_name_servers=" + req.body.setDNS;

	      var strOut = arr.join("\n");
	    
	      try {
		//utils.log.debug(ts()+'LE880main.js post setDhcpStatic fs.writeFileSync("/etc/dhcpcd.conf", strOut)');
		fs.writeFileSync("/etc/dhcpcd.conf", strOut);
	      }
	      catch (err) {
		utils.log.error(ts()+'LE880main.js post setDhcpStatic ERROR fs.writeFileSync("/etc/dhcpcd.conf", strOut)\nerr: ' + err);
	      }
	      
	      res.send(resJSONobj);

	      var cmd = "sudo sleep 5; sudo reboot";
	      //var cmd = "whoami"; // for development only
	      
	      try { 
		exec(cmd);
	      }
	      catch (err){ 
		utils.log.error(ts()+"LE880main.js post setDhcpStatic ERROR err: " + err + "\nexec(cmd): " + cmd); 
		resJSONobj.msg = "Reboot error"; 
	      }
	      
	      //res.send(resJSONobj);
	      
	    } // else StaticIP 
	    
	  } else {  // auth NOT OK
	    res.send({ "auth" : false });
	  }
	  
	}); // setDhcpStatic

	//
	// post resetFactory
	//

	this.webserver_admin.post('/resetFactory', function (req, res) {
	  	  
	  //utils.log.info(ts()+"LE880main.js post resetFactory req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post resetFactory browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post resetFactory browserUA: " + browserUA);
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  //utils.log.info(ts()+"LE880main.js post resetFactory authUser.username: " + authUser.username);
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post resetFactory browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post resetFactory browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){ // auth OK

	    delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	    var config 		= require(process.cwd() + "/LE880factoryConfig.json");
	    //utils.log.info(ts()+"LE880main.js post resetFactory: config: " + util.inspect(config, {showHidden: false, depth: null}));
	    
	    delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	    var configUser 	= require(process.cwd() + "/LE880userConfig.json");
	    //utils.log.info(ts()+"LE880main.js post resetFactory configUser 1: " + util.inspect(configUser, {showHidden: false, depth: null}));
	    
	    //
	    // admin or superadmin only
	    //
	    
	    if(authUser.username == "user"){
	      
	      utils.log.info(ts()+"LE880main.js post resetFactory admin or superadmin required, authUser.username: " + authUser.username);
	      
	      var resJSONobj = JSON.parse('{ "auth" : true }');
	      
	      var msg  = "Reset to Factory Defaults may only be performed by admin or superadmin";	 

	      resJSONobj.resetFactoryAuthError = msg;
	      
	      utils.log.info(ts()+"LE880main.js post resetFactory admin or superadmin required, JSON.stringify(resJSONobj): " + JSON.stringify(resJSONobj));
	      
	      res.send(resJSONobj);
	      
	      return;	      

	    }
	    
	    //
	    // reset each key in configUser to config value
	    //
	    
	    var resJSONobj = JSON.parse('{ "auth" : true }');

	    Object.keys(configUser).forEach(key => {
		configUser[key] = config[key];
		resJSONobj[key] = config[key];
	    });
	    
	    //utils.log.info(ts()+"LE880main.js post resetFactory configUser 2: " + util.inspect(configUser, {showHidden: false, depth: null}));
	    
	    //
	    // save new configUser values
	    //

	    try { 
	      fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser));
	      //utils.log.info(ts()+'post resetFactory updated: fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser))');
	      //utils.log.debug(ts()+'post resetFactory JSON.stringify(configUser): ' + JSON.stringify(configUser));
	    }
	    catch (err) { 
	      utils.log.error(ts()+'post resetFactory fs.writeFileSync(process.cwd() + "/LE880userConfig.json", JSON.stringify(configUser))\nerr: ' + err);
	    }
	    
	    //
	    // copy authUserDefault.json to authUser.json
	    //

	    var cmd;
	    var out;
	    
	    try {
	      cmd = "cp " + process.cwd() + "/authUserDefault.json " + process.cwd() + "/authUser.json";
	      out = execSync(cmd).toString();
	      utils.log.info(ts()+"post resetFactory SUCCESS cmd: " + cmd + ", out : " + out);
	    }
	    catch (err) { 
	      utils.log.error(ts()+"post resetFactory ERROR cmd: " + cmd + ", out : " + out + ", err: " + err);
	    }
	    
	    //
	    // copy authAccountsDefault.json to authUser.json
	    //

	    try {
	      cmd = "cp " + process.cwd() + "/authAccountsDefault.json " + process.cwd() + "/authAccounts.json";
	      out = execSync(cmd).toString();
	      utils.log.info(ts()+"post resetFactory SUCCESS cmd: " + cmd + ", out : " + out);
	    }
	    catch (err) { 
	      utils.log.error(ts()+"post resetFactory ERROR cmd: " + cmd + ", out : " + out + ", err: " + err);
	    }	    

	    //
	    // send response and reboot
	    //

	    var resJSONobj = JSON.parse('{ "auth" : true }');
	    
	    /*
	    var msg  = "Resetting factory default configuation values, rebooting LE880, and setting DHCP.";
		msg += "<br>Your IP address may be changed by DHCP if you were using a static IP address.";
		msg += "<br>You may need to manually enter the DHCP generated IP address in your browser and log in.";	 

	    resJSONobj.resetFactory = msg;
	    */
	    
	    res.send(resJSONobj);
	    
	    //
	    // reboot
	    //

	    cmd = "sudo sleep 5; sudo reboot;";
	    
	    try {
	      exec(cmd);
	    }
	    catch (err) {
	      utils.log.error(ts()+'LE880main.js post resetFactory ERROR err: ' + err + '\nexec(cmd): ' + cmd);
	    }
	    
	  } else {  // auth NOT OK
	    res.send({ "auth" : false });
	  }
	  
	}); // resetFactory

	//
	// post reboot
	//

	this.webserver_admin.post('/reboot', function (req, res) {
	  	  
	  //utils.log.info(ts()+"LE880main.js post reboot req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post reboot browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post reboot browserUA: " + browserUA);
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post reboot browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post reboot browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){ // auth OK
	    
	    //
	    // admin or superadmin only
	    //
	    
	    if(authUser.username == "user"){
	      
	      utils.log.info(ts()+"LE880main.js post reboot admin or superadmin required, authUser.username: " + authUser.username);
	      
	      var resJSONobj = JSON.parse('{ "auth" : true }');
	      
	      var msg  = "Reboot may only be performed by admin or superadmin";	 

	      resJSONobj.rebootAuthError = msg;
	      
	      utils.log.info(ts()+"LE880main.js post reboot admin or superadmin required, JSON.stringify(resJSONobj): " + JSON.stringify(resJSONobj));
	      
	      res.send(resJSONobj);
	      
	      return;	      

	    }

	    var resJSONobj = JSON.parse('{ "auth" : true }');
	    
	    resJSONobj.msg  = "post reboot"; 
	    res.send(resJSONobj);

	    var cmd = "sleep 5 && sudo reboot";
	    
	    try { 
	      exec(cmd);
	      
	    }
	    catch (err) { 
	      utils.log.error(ts()+"LE880main.js post reboot ERROR err:" + err); 
	    }
	    
	  } else {  // auth NOT OK
	    res.send({ "auth" : false });
	  }
	  
	}); // reboot
		
	//
	// post swupload (via AJAX)
	//
	
	this.webserver_admin.post('/swupload', function (req, res) {
	  	  
	  //utils.log.info(ts()+"LE880main.js post swupload req.body: " + util.inspect(req.body, {showHidden: false, depth: null}));
	  
	  var browserID = req.body.browserID;
	  //utils.log.info(ts()+"LE880main.js post swupload browserID: " + browserID);
	  
	  var browserUA = req.body.browserUA;
	  //utils.log.info(ts()+"LE880main.js post swupload browserUA: " + browserUA);
	  
	  delete require.cache[require.resolve("../authUser.json")];
	  var authUser = require("../authUser.json");
	  
	  var browserIDok = authUser.browserIDok;
	  //utils.log.info(ts()+"LE880main.js post swupload browserIDok: " + browserIDok);
	  
	  var browserUAok = authUser.browserUAok;
	  //utils.log.info(ts()+"LE880main.js post swupload browserUAok: " + browserUAok);	 
			   
	  if(browserID == browserIDok && browserUA == browserUAok){ // auth OK
	    
	    var resJSONobj = JSON.parse('{ "auth" : true }');
	    
	    //
	    // admin or superadmin only
	    //
	    
	    if(authUser.username == "user"){
	      
	      utils.log.info(ts()+"LE880main.js post swupload admin or superadmin required, authUser.username: " + authUser.username);
	      
	      var msg  = "Software Upload may only be performed by admin or superadmin";	 

	      resJSONobj.swuploadAuthError = msg;
	      
	      utils.log.info(ts()+"LE880main.js post swupload admin or superadmin required, JSON.stringify(resJSONobj): " + JSON.stringify(resJSONobj));
	      
	      res.send(resJSONobj);
	      
	      return;	      

	    }
	    
	    delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	    var config 		= require(process.cwd() + "/LE880factoryConfig.json");
	    //utils.log.info(ts()+"LE880main.js post swupload: config: " + util.inspect(config, {showHidden: false, depth: null}));
	    
	    delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	    var configUser 	= require(process.cwd() + "/LE880userConfig.json");
	    //utils.log.info(ts()+"LE880main.js post swupload configUser: " + util.inspect(configUser, {showHidden: false, depth: null}));

	    var swuploadFileName = req.body.swuploadFileName;
	    utils.log.info(ts()+"LE880main.js post swupload swuploadFileName: " + swuploadFileName);
	    
	    var debPackage = swuploadFileName.split("_")[0];
	    utils.log.info(ts()+"LE880main.js post swupload debPackage: " + debPackage);
	    
	    utils.log.info(ts()+"LE880main.js post swupload req.body.swuploadFileContents.length: " + req.body.swuploadFileContents.length);
	    
	    if(req.body.swuploadFileContents.length < 100){
	      utils.log.info(ts()+"LE880main.js post swupload req.body.swuploadFileContents: " + req.body.swuploadFileContents);
	    }
	    	    
	    var swupdateFilePath	= config.swupdateRepoFolder + "/" + swuploadFileName;

	    utils.log.info(ts()+"LE880main.js post swupload swupdateFilePath: " + swupdateFilePath);


		outStr	= "";
	    cmd 	= "sudo rm -rf /var/lib/dpkg/info_silent";
	    
	    try {
	      outStr = execSync(cmd).toString();
	      utils.log.info(ts()+"LE880main.js Removing corrupted files SUCCESS execSync cmd: " + cmd + ", outStr: " + outStr);
	    }
	    catch (error) {
	      utils.log.error(ts()+"LE880main.js  Removing corrupted files  ERROR execSync error: " + error + ", outStr: " + outStr + ", cmd: " + cmd);
	      
	      //resJSONobj.msg  = "Software Update Error -1"; 
	     // res.send(resJSONobj);
	      return;
	    }	
       

		//
		// remove post files of corrupted package
		//
        
	    outStr	= "";
	    cmd 	= "sudo mv /var/lib/dpkg/info /var/lib/dpkg/info_silent";
	    
	    try {
	      outStr = execSync(cmd).toString();
	      utils.log.info(ts()+"LE880main.js Removing corrupted files SUCCESS execSync cmd: " + cmd + ", outStr: " + outStr);
	    }
	    catch (error) {
	      utils.log.error(ts()+"LE880main.js  Removing corrupted files  ERROR execSync error: " + error + ", outStr: " + outStr + ", cmd: " + cmd);
	      
	      //resJSONobj.msg  = "Software Update Error -1"; 
	     // res.send(resJSONobj);
	      return;
	    }	
		

		outStr	= "";
	    cmd 	= "sudo mkdir /var/lib/dpkg/info";
	    
	    try {
	      outStr = execSync(cmd).toString();
	      utils.log.info(ts()+"LE880main.js refreshing /var/lib/dpkg/info directory SUCCESS execSync cmd: " + cmd + ", outStr: " + outStr);
	    }
	    catch (error) {
	      utils.log.error(ts()+"LE880main.js  refreshing /var/lib/dpkg/info directory ERROR execSync error: " + error + ", outStr: " + outStr + ", cmd: " + cmd);
	      
	      //resJSONobj.msg  = "Software Update Error -1"; 
	     // res.send(resJSONobj);
	      return;
	    }	
		



	    //
	    // remove prior update files in swupdateRepoFolder
	    //
	    
	    outStr	= "";
	    cmd 	= "sudo rm -rf " + config.swupdateRepoFolder + "/*";
	    
	    try {
	      outStr = execSync(cmd).toString();
	      //utils.log.info(ts()+"LE880main.js post swupload SUCCESS execSync cmd: " + cmd + ", outStr: " + outStr);
	    }
	    catch (error) {
	      utils.log.error(ts()+"LE880main.js post swupload ERROR execSync error: " + error + ", outStr: " + outStr + ", cmd: " + cmd);
	      
	      resJSONobj.msg  = "Software Update Error 1"; 
	      res.send(resJSONobj);
	      return;
	      
	    }

	    //
	    // save swuploadFileContents and start update process
	    //
	    
	    var outStr		= "";
	    var cmd 		= "none";
		var reboot_check = "";
	    	    
	    try {
	      fs.writeFileSync(swupdateFilePath, req.body.swuploadFileContents, "binary");
	      utils.log.info(ts()+"LE880main.js post swupload SUCCESS fs.writeFileSync(swupdateFilePath, req.body.swuploadFileContents");
	    }
	    catch (error) {
	      utils.log.error(ts()+"LE880main.js post swupload ERROR fs.writeFileSync error: " + error);
	      
	      resJSONobj.msg  = "Software Update Error 2"; 
	      res.send(resJSONobj);
	      return;
	      
	    }
	    
	    //
	    // sudo dpkg-scanpackages . /dev/null | gzip -c9 > Packages.gz
	    //

	    outStr	= "";
	    cmd 	= "cd " + config.swupdateRepoFolder + " && sudo dpkg-scanpackages . /dev/null | gzip -c9 > Packages.gz";
	    
	    try {
	      outStr = execSync(cmd).toString();
	      utils.log.info(ts()+"LE880main.js post swupload SUCCESS execSync cmd: " + cmd + ", outStr: " + outStr);
	    }
	    catch (error) {
	      utils.log.error(ts()+"LE880main.js post swupload ERROR execSync error: " + error + ", outStr: " + outStr + ", cmd: " + cmd);
	      
	      resJSONobj.msg  = "Software Update Error 3"; 
	      res.send(resJSONobj);
	      return;
	      
	    }
	    	    
	    //
	    // sudo apt update
	    //
	    
	    outStr	= "";
	    cmd 	= "sudo apt update"
	    
	    try {
	      outStr = execSync(cmd).toString();
	      utils.log.info(ts()+"LE880main.js post swupload SUCCESS execSync cmd: " + cmd + ", outStr: " + outStr);
	    }
	    catch (error) {
	      utils.log.error(ts()+"LE880main.js post swupload ERROR execSync error: " + error + ", outStr: " + outStr + ", cmd: " + cmd);
	      
	      resJSONobj.msg  = "Software Update Error 4"; 
	      res.send(resJSONobj);
	      return;
	      
	    }

	    //
	    // sudo apt install -y debPackage
	    //
	    
	    outStr	= "";
	    
	    //cmd 	= "sudo apt install -y " + config.swupdateCommand;
	    cmd 	= "sudo apt install -y " + debPackage;
	    
	    try {
	      outStr = execSync(cmd).toString();
	      utils.log.info(ts()+"LE880main.js post swupload SUCCESS execSync cmd: " + cmd + ", outStr: " + outStr);
		  reboot_check += outStr;
	    }
	    catch (error) {
	      utils.log.error(ts()+"LE880main.js post swupload ERROR execSync cmd: " + cmd + "\nerror: " + error + "\noutStr: " + outStr);
	      
	      resJSONobj.msg  = "Software Update Error 5"; 
	      res.send(resJSONobj);
	      return;
	      
	    }


		outStr	= "";
	    
	    //cmd 	= "sudo apt install -y " + config.swupdateCommand;
	    cmd 	= "sudo mv /var/lib/dpkg/info/ /var/lib/dpkg/info_silent";
	    
	    try {
	      outStr = execSync(cmd).toString();
	     // utils.log.info(ts()+"LE880main.js post swupload SUCCESS execSync cmd: " + cmd + ", outStr: " + outStr);
	    }
	    catch (error) {
	      //utils.log.error(ts()+"LE880main.js post swupload ERROR execSync cmd: " + cmd + "\nerror: " + error + "\noutStr: " + outStr);
	      
	      //resJSONobj.msg  = "Software Update Error 5"; 
	      //res.send(resJSONobj);
	      return;
	      
	    }



		outStr	= "";
	    
	    //cmd 	= "sudo apt install -y " + config.swupdateCommand;
	    cmd 	= "sudo rm -rf /var/lib/dpkg/info";
	    
	    try {
	      outStr = execSync(cmd).toString();
	     // utils.log.info(ts()+"LE880main.js post swupload SUCCESS execSync cmd: " + cmd + ", outStr: " + outStr);
	    }
	    catch (error) {
	      //utils.log.error(ts()+"LE880main.js post swupload ERROR execSync cmd: " + cmd + "\nerror: " + error + "\noutStr: " + outStr);
	      
	      //resJSONobj.msg  = "Software Update Error 5"; 
	      //res.send(resJSONobj);
	      return;
	      
	    }


		outStr	= "";
	    
	    //cmd 	= "sudo apt install -y " + config.swupdateCommand;
	    cmd 	= "sudo mv /var/lib/dpkg/info_silent /var/lib/dpkg/info";
	    
	    try {
	      outStr = execSync(cmd).toString();
	     // utils.log.info(ts()+"LE880main.js post swupload SUCCESS execSync cmd: " + cmd + ", outStr: " + outStr);
	    }
	    catch (error) {
	      //utils.log.error(ts()+"LE880main.js post swupload ERROR execSync cmd: " + cmd + "\nerror: " + error + "\noutStr: " + outStr);
	      
	      //resJSONobj.msg  = "Software Update Error 5"; 
	      //res.send(resJSONobj);
	      return;
	      
	    }



	    if(	reboot_check.includes("Setting up")){

	      resJSONobj.successMsg = "The software package has been installed and the LE880 will reboot in 5 seconds.";
	      res.send(resJSONobj);
	      
	      //
	      // reboot
	      //

	      cmd = "sudo sleep 5; sudo reboot;";
	      
	      try {
		exec(cmd);
	      }
	      catch (err) {
		utils.log.error(ts()+'LE880main.js post swupload ERROR err: ' + err + '\nexec(cmd): ' + cmd);
	      }
	      
	      return;
	      
	    }


		if(reboot_check.includes("is already the newest version")){
			resJSONobj.successMsg = "The software package is already the newest version.";
			//res.send(resJSONobj);
			//return;
		  }		

	    	    
	    res.send(resJSONobj);
	  
	  } else {  // auth NOT OK
	    res.send({ "auth" : false });
	  }
	  
	}); // swupload

    }; // LE880export.prototype.setupWebserver
    
    //
    // build SPA page
    //
      
    LE880export.prototype.getLE880SPApage = function (filePath, options, callback) {
    
    //LE880export.prototype.getLE880SPApage = function (filePath, callback) {
      
	utils.log.info(ts()+"LE880main.js getLE880SPApage filePath: " + filePath + ", JSON.stringify(options): " + JSON.stringify(options));
        
	var _this = this;
	
        fs.readFile(filePath, function (err, content) { // LE880postRoot.ntl = SPA page after login
            
	    if (err)
                return callback(new Error(err.message));
	    
	    var rendered = content.toString();
	    //utils.log.info(ts()+"LE880main.js getLE880SPApage 1 rendered: " + rendered);
	    
	    //
	    // LE880postRoot.ntl
	    //
	    
	    if(filePath.indexOf("LE880postRoot.ntl") >= 0){

	      const MediaPlayers = require("./MediaPlayers");
	      var MediaPlayersHTML = MediaPlayers.prototype.buildMediaPlayersHTML;
	      //utils.log.info(ts()+"LE880main.js MediaPlayersHTML: " + MediaPlayersHTML);
	      rendered = rendered.replace('{{MediaPlayersHTML}}', MediaPlayersHTML);	    
	      //utils.log.info(ts()+"LE880main.js getLE880SPApage MediaPlayers rendered: " + rendered);
	      
	      const AudioSettings = require("./AudioSettings");
	      var audioHTML = AudioSettings.prototype.buildAudioSettingsHTML;
	      //utils.log.info(ts()+"LE880main.js audioHTML: " + audioHTML);
	      rendered = rendered.replace('{{audioHTML}}', audioHTML);

	      const InputGPIOSettings = require("./InputGPIOSettings");
	      var inputGPIOHTML = InputGPIOSettings.prototype.buildInputGPIOSettingsHTML;
	      rendered = rendered.replace('{{inputGPIOHTML}}', inputGPIOHTML);
		      
	      const OutputGPIOSettings = require("./OutputGPIOSettings");
	      var outputGPIOHTML = OutputGPIOSettings.prototype.buildOutputGPIOSettingsHTML;
	      rendered = rendered.replace('{{outputGPIOHTML}}', outputGPIOHTML);
	      
	      var helpHTML = "<p>This is where we explain how things work.</p>";
	      //utils.log.info(ts()+"LE880main.js helpHTML: " + helpHTML);
	      rendered = rendered.replace('{{helpHTML}}', helpHTML);
	      
	      //
	      // config values
	      //
	      
	      delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	      var config 		= require(process.cwd() + "/LE880factoryConfig.json");
	      //utils.log.info(ts()+"LE880main.js startRtsp config: " + util.inspect(config, {showHidden: false, depth: null}));
	      
	      delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	      var configUser 	= require(process.cwd() + "/LE880userConfig.json");
	      //utils.log.info(ts()+"LE880main.js startRtsp configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));
	      
	      delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	      var authUser 	= require(process.cwd() + "/authUser.json");
	      //utils.log.info(ts()+"LE880main.js startRtsp configUser : " + util.inspect(authUser, {showHidden: false, depth: null}));	      	    	    
	      
	      rendered = rendered.replace(/\{\{Reset_to_Factory_Defaults_min\}\}/g, config.Reset_to_Factory_Defaults_min);
	      rendered = rendered.replace(/\{\{Reboot_min\}\}/g, config.Reboot_min);
	      rendered = rendered.replace(/\{\{Reboot_max\}\}/g, config.Reboot_max);
	      
	      if(configUser.dhcpStaticSelected == "DHCP"){
		rendered = rendered.replace(/\{\{DHCP_checked\}\}/g, "checked");
		rendered = rendered.replace(/\{\{staticIP_checked\}\}/g, "");
	      } else {
		rendered = rendered.replace(/\{\{DHCP_checked\}\}/g, "");
		rendered = rendered.replace(/\{\{StaticIP_checked\}\}/g, "checked");
	      }
	      
	      rendered = rendered.replace(/\{\{setStatic\}\}/g, configUser.setStatic);
	      rendered = rendered.replace(/\{\{setRouter\}\}/g, configUser.setRouter);
	      rendered = rendered.replace(/\{\{setDNS\}\}/g   , configUser.setDNS);
	      
	      rendered = rendered.replace(/\{\{OPLED_mic_alertLevel0\}\}/g   , configUser.OPLED_mic_alertLevel0);
	      rendered = rendered.replace(/\{\{OPLED_mic_alertLevel1\}\}/g   , configUser.OPLED_mic_alertLevel1);
	      rendered = rendered.replace(/\{\{OPLED_mic_alertLevel2\}\}/g   , configUser.OPLED_mic_alertLevel2);

	      rendered = rendered.replace(/\{\{OP1_mic_alertLevel0\}\}/g   , configUser.OP1_mic_alertLevel0);
	      rendered = rendered.replace(/\{\{OP1_mic_alertLevel1\}\}/g   , configUser.OP1_mic_alertLevel1);
	      rendered = rendered.replace(/\{\{OP1_mic_alertLevel2\}\}/g   , configUser.OP1_mic_alertLevel2);	    
	      
	      rendered = rendered.replace(/\{\{OP2_mic_alertLevel0\}\}/g   , configUser.OP2_mic_alertLevel0);
	      rendered = rendered.replace(/\{\{OP2_mic_alertLevel1\}\}/g   , configUser.OP2_mic_alertLevel1);
	      rendered = rendered.replace(/\{\{OP2_mic_alertLevel2\}\}/g   , configUser.OP2_mic_alertLevel2);	    
	      
	      rendered = rendered.replace(/\{\{OP3_mic_alertLevel0\}\}/g   , configUser.OP3_mic_alertLevel0);
	      rendered = rendered.replace(/\{\{OP3_mic_alertLevel1\}\}/g   , configUser.OP3_mic_alertLevel1);
	      rendered = rendered.replace(/\{\{OP3_mic_alertLevel2\}\}/g   , configUser.OP3_mic_alertLevel2);	    
	      
	      rendered = rendered.replace(/\{\{OP4_mic_alertLevel0\}\}/g   , configUser.OP4_mic_alertLevel0);
	      rendered = rendered.replace(/\{\{OP4_mic_alertLevel1\}\}/g   , configUser.OP4_mic_alertLevel1);
	      rendered = rendered.replace(/\{\{OP4_mic_alertLevel2\}\}/g   , configUser.OP4_mic_alertLevel2);
	      
	      rendered = rendered.replace(/\{\{currentUser\}\}/g           , authUser.username);
	      
	      //
	      // VMS stream levels
	      //
	      
	      rendered = rendered.replace(/\{\{VMSvolMic\}\}/g           , configUser.input_vms_level);
	      rendered = rendered.replace(/\{\{VMSvolSpeaker\}\}/g       , configUser.output_vms_level);
	      
	      //
	      // Intercom stream levels
	      //
	      
	      rendered = rendered.replace(/\{\{volMic\}\}/g           , configUser.input_intercom_level);
	      rendered = rendered.replace(/\{\{volSpeaker\}\}/g       , configUser.output_intercom_level);	      
	      
	    } // if(filePathindexOf("LE880postRoot.ntl") >= 0)
	    	    
	    //
	    // LE880firstLogin.ntl
	    //
	    
	    if(filePath.indexOf("LE880firstLogin.ntl") >= 0){
	      
	      //utils.log.info(ts()+"LE880main.js getLE880SPApage LE880firstLogin.ntl JSON.stringify(options): " + JSON.stringify(options));
	      rendered = rendered.replace(/\{\{first_login\}\}/g   , options.first_login);
	      //utils.log.info(ts()+"LE880main.js getLE880SPApage LE880firstLogin.ntl rendered: " + rendered);
	    
	    } // if(filePathindexOf("LE880firstLogin.ntl") >= 0)
	    
	    //
	    // return page
	    //
	    
	    //utils.log.info(ts()+"LE880main.js getLE880SPApage 2 rendered: " + rendered);
	    
	    return callback(null, rendered);
	    
        }); // fs.readFile(filePath, function (err, content)
	
    }; // LE880export.prototype.getLE880SPApage

    //
    // startRtsp - controlled by VMSsendOnOff and Onvif
    //

    LE880export.prototype.startRtsp = function () {
      
      //
      // do not kill or restartn if running
      //

      var unique 	= 'LE880-rtsp-server';
      var rtspStatus	= null;
      
      var cmd  = 'su - pi -c "ps aux"';
      var out;
      
      try {
	out = execSync(cmd).toString();
	//utils.log.info(ts()+'LE880main.js startRtsp cmd: ' + cmd + ', out: ' + out);
      }
      catch (error) {
	utils.log.warn(ts()+'LE880main.js PROCESS NOT FOUND cmd:' + cmd + ', error.toString(): ' + error.toString());
      }
	  
      if(out.indexOf(unique) >= 0){
	rtspStatus = "on";
	//utils.log.info(ts()+"LE880main.js startRtsp " + unique + " rtspStatus: " + rtspStatus);
      } else {
	rtspStatus = "off";
	//utils.log.info(ts()+"LE880main.js startRtsp " + unique + " rtspStatus: " + rtspStatus);
      }
      
      if(rtspStatus == "on"){
	utils.log.warn(ts()+"LE880main.js startRtsp LE880-rtsp-server is already running, do not kill or restart");
	return;
      }

      delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
      var config 		= require(process.cwd() + "/LE880factoryConfig.json");
      //utils.log.info(ts()+"LE880main.js startRtsp config: " + util.inspect(config, {showHidden: false, depth: null}));
      
      delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
      var configUser 	= require(process.cwd() + "/LE880userConfig.json");
      //utils.log.info(ts()+"LE880main.js startRtsp configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));

      var jsonObj 			= VMSstreamLevels();
      var VMSpaNumSrcStream 		= jsonObj.VMSpaNumSrcStream;
      var VMSpaNumSinkStream		= jsonObj.VMSpaNumSinkStream;
      utils.log.info(ts()+"LE880main.js startRtsp VMSpaNumSrcStream :" + VMSpaNumSrcStream + ", VMSpaNumSinkStream: " + VMSpaNumSinkStream);
      var VMSpaGstSrcStream 		= jsonObj.VMSpaGstSrcStream;
      var VMSpaGstSinkStream		= jsonObj.VMSpaGstSinkStream;
      utils.log.info(ts()+"LE880main.js startRtsp VMSpaGstSrcStream :" + VMSpaGstSrcStream + ", VMSpaGstSinkStream: " + VMSpaGstSinkStream);
    
      var LOG = config.LOG;
      
      if (config.RTSPServer == 3){
	
	utils.log.info(ts()+"LE880main.js startRtsp configUser.IncludeVideoOnvifDefault: " + configUser.IncludeVideoOnvifDefault);	  
	
	//
	// kill all LE880 to vms streams ???
	//
	
	if(configUser.IncludeVideoOnvifDefault == "Video&Audio") {
	  
	  if(configUser.vmsEcho == "true"){ // video & audio, with echo-cancel
	    
	    var cmd = "" +
	    "GST_DEBUG=4 " +
	    "PULSE_PROP='filter.want=echo-cancel' " +
	    "/home/pi/LE880-Profile-T/c/LE880-rtsp-server-02 " +

	   " --port=" + configUser.RTSPPort +
	    " --username=" + configUser.RTSPUsername +
	    " --password=" + configUser.RTSPPassword +
	    //" --mount=" + config.RTSPName +   
	  " \" videotestsrc ! " +
	    "textoverlay text=\'Louroe Electronics LE880' color=0 valignment=top halignment=center font-desc=36 ! " + 
	     "video/x-raw,width=320,height=240,framerate=1/1 ! " +
	     "x264enc aud=false ! " +
	     "rtph264pay name=pay0" +

	    
	     //"pulsesrc device=alsa_input.platform-soc_sound.analog-stereo do-timestamp=true volume=0.1 " +
	   " pulsesrc device=\"alsa_input.platform-soc_sound.analog-stereo\" volume=" + VMSpaGstSrcStream + " " +
	     
	     "stream-properties=props,filter.want=echo-cancel " + 
	     "stream-properties=props,aec_method=webrtc ! " +
	     "audio/x-raw, rate=8000, channels=1, format=S16LE ! " +
	      "queue ! " +  
	     "audioconvert ! " + 
	     "audioresample ! " + 
	     "mulawenc ! " +
	     "rtppcmupay name=pay1 \" " +   

	     " >> "+LOG+"LE880-rtsp-server-video-audio-echo-cancel.log 2>&1 &";	      
	  
	  } else { // video & audio, no echo-cancel
	    
	    
	    // "audio/x-mulaw, rate=8000, channels=1 ! " fails
	  
	    var cmd = "" +
	    //"GST_DEBUG=4 " +
	    "/home/pi/LE880-Profile-T/c/LE880-rtsp-server-02" +
	

		" --port=" + configUser.RTSPPort +
	    " --username=" + configUser.RTSPUsername +
	    " --password=" + configUser.RTSPPassword +
	    //" --mount=" + config.RTSPName +
	    " \"videotestsrc ! " +
	    "textoverlay text=\'Louroe Electronics LE880' color=0 valignment=top halignment=center font-desc=36 ! " + 
	     "video/x-raw,width=320,height=240,framerate=1/1 ! " +
	     "x264enc aud=false ! " +
	     "rtph264pay name=pay0 pt=96 rtpsession " +
	     
	     //"pulsesrc device=alsa_input.platform-soc_sound.analog-stereo do-timestamp=true volume=0.1 ! " +
	     "pulsesrc device=alsa_input.platform-soc_sound.analog-stereo do-timestamp=true volume=" + VMSpaGstSrcStream + " ! " +

	     // virtVMSMic.monitor
	     //"pulsesrc device=virtVMSMic.monitor do-timestamp=true volume=" + paNumSrcVol + " " +
	     	     
	     "audio/x-raw, rate=8000, channels=1, format=S16LE ! " +
	     "mulawenc ! " +
	     "rtppcmupay pt=97 name=pay1 rtpsession \" " +  
	     " >> "+LOG+"LE880-rtsp-server-video-audio.log 2>&1 &";
	     
	  }
	  
	} else { // audio only
	  
	  if(configUser.vmsEcho == "true"){ // audio only with echo-cancel
	    
	    var cmd = "" +
	    //"GST_DEBUG=4 " +
	    "PULSE_PROP='filter.want=echo-cancel' " +
	    "/home/pi/LE880-Profile-T/c/LE880-rtsp-server-02" +
	    " --port=" + configUser.RTSPPort +
	    " --username=" + configUser.RTSPUsername +
	    " --password=" + configUser.RTSPPassword +
	    //" --mount=" + config.RTSPName +
	    
	   // " 'pulsesrc device=alsa_input.platform-soc_sound.analog-stereo do-timestamp=true volume=0.1 " +
	    " 'pulsesrc device=alsa_input.platform-soc_sound.analog-stereo do-timestamp=true volume=" + VMSpaGstSrcStream + " " +

	    "stream-properties=props,filter.want=echo-cancel " +
	    "stream-properties=props,aec_method=webrtc ! " +
	    "audio/x-raw, rate=8000, channels=1, format=S16LE ! " +
	    "queue ! " +
	    "mulawenc ! " +
	    "rtppcmupay pt=96 name=pay0 rtpsession '" +
	    " >> "+LOG+"LE880-rtsp-server-audio-only-echo-cancel.log 2>&1 &";	      
	    
	  } else { // audio only, no echo-cancel

	    var cmd = "" +
	    //"GST_DEBUG=4 " +
	    "/home/pi/LE880-Profile-T/c/LE880-rtsp-server-02" +
	    " --port=" + configUser.RTSPPort +
	    " --username=" + configUser.RTSPUsername +
	    " --password=" + configUser.RTSPPassword +
	    //" --mount=" + config.RTSPName +
	    
	    //" 'pulsesrc device=alsa_input.platform-soc_sound.analog-stereo do-timestamp=true volume=0.1 ! " +
	    " 'pulsesrc device=alsa_input.platform-soc_sound.analog-stereo do-timestamp=true volume=" + VMSpaGstSrcStream + " ! " +
	    
	    "audio/x-raw, rate=8000, channels=1, format=S16LE ! " +
	    "queue ! " +
	    "mulawenc ! " +
	    "rtppcmupay pt=96 name=pay0 rtpsession '" +
	    " >> "+LOG+"LE880-rtsp-server-audio-only.log 2>&1 &";
	    
	  }
	  
	} // else  if(configUser.IncludeVideoOnvifDefault == "Video&Audio")
	
	//
	// https://gitlab.freedesktop.org/gstreamer/gst-rtsp-server/-/issues/115
	//
	// this helps exacqVision to play the rtsp stream and to stop and restart
	//
	// gst-launch-1.0 playbin audio-sink=fakesink uri=rtsp://LE880:LE880@127.0.0.1:8096/LE880
	//
	
	if(configUser.IncludeVideoOnvifDefault == "Video&Audio"){
	  
	  //
	  // Video&Audio has a longer start-up time
	  //
	  
	  var delay_1 = 2000;
	  var delay_2 = 8000;
	  
	} else { // audio only
	  
	  var delay_1 = 1000;
	  var delay_2 = 2000;	  
	  
	}
	
	var cmdRace  = "";

	if(1==1){
	  
	  setTimeout(function(){
	  
	    cmdRace  = "";
	    cmdRace += "GST_DEBUG=2 ";
	    cmdRace += "gst-launch-1.0 playbin audio-sink=fakesink uri='rtsp://";
	    cmdRace += configUser.RTSPUsername + ":" + configUser.RTSPPassword + "@127.0.0.1:";
	    cmdRace += configUser.RTSPPort + "/" + configUser.RTSPName + "'";
	    cmdRace += "  >> "+LOG+"LE880-rtsp-race-1.log 2>&1 &";
	    
	    
	    //cmdRace = "gst-discoverer-1.0 rtsp://LE880:LE880@127.0.0.1:8096/LE880 &";
	      
	    utils.log.debug(ts()+"LE880main.js startRtsp cmdRace 1: " + util.inspect(cmdRace, {showHidden: false, depth: null}));
	  
	    // async
	    
	    exec(cmdRace, (error, stdout, stderr) => {
	      
		if (error) {
		    utils.log.error(ts()+`LE880main.js startRtsp cmdRace 1 error: ${error.message}, cmdRace: ` + cmdRace);
		    return;
		}
		if (stderr) {
		    utils.log.error(ts()+`LE880main.js startRtsp stderr: cmdRace 1 ${stderr}, cmdRace: ` + cmdRace);
		    return;
		}
		utils.log.info(ts()+`LE880main.js startRtsp cmdRace 1 stdout: ${stdout}, cmdRace: ` + cmdRace);
	    
	    });
	  
	  }, delay_1);
	  
	}

	//
	// pulseaudio must be run as pi
	//

	var semaphoreFile = process.cwd() + "/pulseaudio_cmd/rtsp-server_" + ts1() + ".cmd";
	
	try {
	  fs.writeFileSync(semaphoreFile, cmd);
	  utils.log.info(ts()+"LE880main.js post startRtsp SUCCESS fs.writeFileSync() semaphoreFile: " + semaphoreFile + "\ncmd: " + cmd);
	  //this.rtspServer = true;
	}
	catch (err) {
	  utils.log.error(ts()+"LE880main.js post startRtsp ERROR fs.writeFileSync() semaphoreFile: " + semaphoreFile + "\nerr: " + err + "\ncmd: " + cmd);
	  //this.rtspServer = false;
	}	

	//
	// set output_vms_app
	//

	let newVol = parseInt(Number(config.output_vms_multiplier) * Number(configUser.output_vms_level)).toString();	
	
	setTimeout(function(){
	  utils.log.info(ts()+"LE880main.js startRtsp set output_vms_app stream level: " + newVol + "%");
	  pulseaudio_cmd_response("pactl list sink-inputs", "set output_vms_app stream level", "output_vms_app", "set", newVol + "%");
	}, 2000);	

	if(1==1){
	  
	  setTimeout(function(){
	  
	    cmdRace  = "";
	    cmdRace += "GST_DEBUG=2 ";
	    cmdRace += "gst-launch-1.0 playbin audio-sink=fakesink uri='rtsp://";
	    cmdRace += config.RTSPUsername + ":" + config.RTSPPassword + "@127.0.0.1:";
	    cmdRace += config.RTSPPort + "/" + config.RTSPName + "'";
	    cmdRace += "  >> "+LOG+"LE880-rtsp-race-2.log 2>&1 &";
		
	    utils.log.debug(ts()+"LE880main.js startRtsp cmdRace 2: " + util.inspect(cmdRace, {showHidden: false, depth: null}));
	    
	    semaphoreFile = process.cwd() + "/pulseaudio_cmd/rtsp-server_" + ts1() + ".cmd";
	    
	    // async
	    
	    exec(cmdRace, (error, stdout, stderr) => {
	      
		if (error) {
		    utils.log.error(ts()+`LE880main.js startRtsp cmdRace 2 error: ${error.message}, cmdRace: ` + cmdRace);
		    return;
		}
		if (stderr) {
		    utils.log.error(ts()+`LE880main.js startRtsp stderr: cmdRace 2 ${stderr}, cmdRace: ` + cmdRace);
		    return;
		}
		utils.log.info(ts()+`LE880main.js startRtsp cmdRace 2 stdout: ${stdout}, cmdRace: ` + cmdRace);
	     });
	     
	  }, delay_2);
	  
	}
			  
      } // if (this.config.RTSPServer == 3)
	
    }; // LE880export.prototype.startRtsp
    
    LE880export.prototype.stopRtsp = function () {
      
      // see also post VMSsendOnOff "make sure"
      
      var cmd = "sudo pkill -9 -f 'LE880-rtsp-server'";
      try {
	execSync(cmd);
	utils.log.info(ts()+'LE880main.js stopRtsp cmd: ' + cmd);
      }
      catch (error) {
	utils.log.info(ts()+'LE880main.js stopRtsp PROCESS NOT FOUND cmd: ' + cmd + ', error.toString(): ' + error.toString());
      }	      
      
      cmd = "sudo pkill -9 -f 'gst-launch-1.0 playbin audio-sink=fakesink'"; // rtsp race
      try {
	execSync(cmd);
	utils.log.info(ts()+'LE880main.js stopRtsp cmd: ' + cmd);
      }
      catch (error) {
	utils.log.info(ts()+'LE880main.js stopRtsp PROCESS NOT FOUND cmd: ' + cmd + ', error.toString(): ' + error.toString());
      }
      
    };  LE880export.prototype.stopRtsp
    
    //
    // WSSserver
    //
    
    LE880export.prototype.startWSSserver = function () {
      
	delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	var config 		= require(process.cwd() + "/LE880factoryConfig.json");
	//utils.log.info(ts()+"LE880main.js startWSSserver config: " + util.inspect(config, {showHidden: false, depth: null}));
	
	delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	var configUser 	= require(process.cwd() + "/LE880userConfig.json");
	//utils.log.info(ts()+"LE880main.js startWSSserver configUser: " + util.inspect(configUser, {showHidden: false, depth: null}));
	
	var LOG = config.LOG;
	
	if (this.WSSserver) {
            utils.log.warn(ts()+"LE880main.js startWSSserver Cannot start WSSserver, already running");
            return;
        }
        
	utils.log.info(ts()+"LE880main.js startWSSserver Starting WSSserver at wss://" + utils.getIpAddress() + ":" + config.WSSserverPort);
	
	var cmdKill = "sudo pkill -9 -f 'LE880-webrtc-wss'";
	try {
	  execSync(cmdKill);
	}
	catch (err){
	  utils.log.warn(ts()+"LE880main.js " + cmdKill + ", err; " + err);
	}
	
	var cmd = 'su - pi -c "/home/pi/LE880-Profile-T/c/LE880-webrtc-wss-server-00.py --addr ' + utils.getIpAddress() + ' --port ' + config.WSSserverPort + '"';
	utils.log.debug(ts()+"LE880main.js startWSSserver cmd: " + cmd);
	
	this.WSSserver = exec(cmd);
        
	if (this.WSSserver) {
	  
            //this.WSSserver.stdout.on('data', function (data) { return utils.log.detail(ts()+"LE880main.js startWSSserver stdout: %s", data); });
            this.WSSserver.stdout.on('data', function (data) { return fs.writeFile(LOG+"LE880WSSstdout.log", data, (err) => {if (err) throw err;}); });
	    
	    //this.WSSserver.stderr.on('data', function (data) { return utils.log.detail(ts()+"LE880main.js startWSSserver stderr: %s", data); });
            this.WSSserver.stderr.on('data', function (data) { return fs.writeFile(LOG+"LE880WSSstderr.log", data, (err) => {if (err) throw err;}); });
	    
	    //this.WSSserver.on('error', function (err) { return utils.log.error(ts()+"LE880main.js startWSSserver error: %s", err); });
            this.WSSserver.on('error', function (error)        { return fs.writeFile(LOG+"LE880WSSerr.log", error, (err) => {if (err) throw err;}); });
	    
	    this.WSSserver.on('exit', function (code, signal) {
                if (code)
                    utils.log.debug(ts()+"LE880main.js WSSserver exited with code: %s", code);
                else
                    utils.log.debug(ts()+"LE880main.js WSSserver exited without code");
            });
        }

	
    }; // LE880export.prototype.startWSSserver
    
    LE880export.prototype.stopWSSserver = function () {
        if (this.WSSserver) {
            utils.log.info(ts()+"LE880main.js stopWSSserver Stopping WSSserver");
            this.WSSserver.kill();
            this.WSSserver = null;
        }
    };
    
    return LE880export;
    
}());

module.exports = LE880export;
