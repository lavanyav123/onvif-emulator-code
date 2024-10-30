"use strict";
const utils_1 			= require('./utils');
const fs 			= require('fs');
const utils 			= utils_1.Utils.utils;
const util 			= require('util'); // inspect
const chokidar 			= require('chokidar');

const pathParse 		= require('path-parse');
const { exec, execSync } 	= require("child_process");

const axios 			= require('axios')
const https 			= require('https');

const Promise  			= require('promise');

function ts(){
  return new Date().YYYYMMDDHHMMSSmmm() + " : ";
}

function ts1(){
  return new Date().YYYYMMDDHHMMSSmmm();
}

const Gpio 	= require('onoff').Gpio;

const OPLED 	= new Gpio(12, 'out');		// J8-32
const OP1 		= new Gpio(26,  'out');		// J8-37 
const OP2		= new Gpio(16, 'out');		// J8-36 
const OP3 		= new Gpio(13, 'out');		// J8-33 
const OP4 		= new Gpio(6, 'out');		// J8-31

const time = new Date();

var triggerLEDcount=0;
var triggerOP1count=0;
var triggerOP2count=0;
var triggerOP3count=0;
var triggerOP4count=0;
var timeNowLED = 0;
var timeLastLED = 0;
var timeNow = 0;
var timeLast = 0;	

function ms(t0){
  
  //utils.log.info(ts()+"LE880alerts.js ms() t0: " + t0);
  
  if(t0.substr(-4) == ".raw"){
    t0 = t0.substr(-40,23);
  }

  var t1			= t0.replace("_","T").substr(-40,19);
  //utils.log.info(ts()+"LE880alerts.js ms() t1: " + t1);

  var t2			= Date.parse(t1);
  //utils.log.info(ts()+"LE880alerts.js ms() t2: " + t2);

  var t3			= t0.substr(-3);
  //utils.log.info(ts()+"LE880alerts.js ms() t3: " + t3);

  var t4			= Number(t2) + Number(t3);
  //utils.log.info(ts()+"LE880alerts.js ms() t4: " + t4);  
  
  return t4;
  
} // ms()

function rm0x(string){
  
  if(string.substr(0,2) == "0x"){
    string = string.substr(2);
  } 
  
  return string;
    
} // rm0x()

function changeEndianness(string, numBytes){
  
  string = rm0x(string);
        
  const result = [];
  let len = string.length - 2;
  
  while (len >= 0) {
    result.push(string.substr(len, 2));
    len -= 2;
  }
  
  return "0x" + result.join('').padStart(numBytes, "0");
  
} // changeEndianness()

var LE880alerts = (function () {
  
  var watcher 	= null;
    
  function LE880alerts() {
    
      //utils.log.info(ts()+"LE880alerts.js");
      
      if(watcher){watcher.close()}
      
      //
      // now we can look for new JSON files in alertsOut folder
      //
      
      var alertsOutPath = process.cwd() + "/alertsOut";
      //utils.log.info(ts()+"LE880alerts.js alertsOutPath : " + alertsOutPath);
      
      //
      // remove old alerts json files upon start-up
      //
      
      var cmd = "sudo rm " + alertsOutPath + "/*";
      
      try {
	execSync(cmd);
	utils.log.info(ts()+"LE880alerts.js success cmd : " + cmd);
      }
      
      catch (err) {
	utils.log.info(ts()+"LE880alerts.js ERROR catch cmd : " + cmd + ", err: " + err);
      }
      
      watcher = chokidar.watch(alertsOutPath + "/*.json").on("add", (event, path) => {
	      
	utils.log.info(ts()+"LE880alerts.js watch event: " + event);	      
	//utils.log.info(ts()+"LE880alerts.js watch JSON.stringify(path) : " + JSON.stringify(path));
	
	var rawdata = fs.readFileSync(event);
	utils.log.info(ts()+"LE880alerts.js rawdata = " + rawdata);
	
	try {
	  var jsonObj = JSON.parse(rawdata);
	  //utils.log.info(ts()+"LE880alerts.js JSON.parse(rawdata) JSON.stringify(jsonObj): " + JSON.stringify(jsonObj));
	}
	catch(err){
	  utils.log.info(ts()+"LE880alerts.js ERROR JSON.parse(rawdata) rawdata: " + rawdata + ", err: " + err);
	  return;
	}
	
	//
	// unlink event
	//

	try {
	  fs.unlinkSync(event);
	  utils.log.info(ts()+"LE880alerts.js completed unlink event = " + event);
	}
	
	catch(err) {
	    utils.log.error(ts()+"LE880alerts.js ERROR fs.unlinkSync(event): " + event);
	}	
	
	//
	// process alert
	//

	delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
	var config 		= require(process.cwd() + "/LE880factoryConfig.json");
	//utils.log.info(ts()+"LE880alerts.js config: " + util.inspect(config, {showHidden: false, depth: null}));
	
	delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	var configUser 	= require(process.cwd() + "/LE880userConfig.json");
	//utils.log.info(ts()+"LE880alerts.js configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));	      
	
	//
	// HTTP POST
	//
	
	var url    = "";
	var outStr = "";
	
	if(jsonObj.Alert.includes("OPLED") && configUser.OPLED_trig_checked == "mic" && configUser.OPLED_HTTPS_checked == "https"){
	  
	  url = configUser.OPLED_POST_URL;
	  
	  outStr  = '{';
	  outStr += '"' + configUser.OPLED_k1 + '" : "' + configUser.OPLED_v1 + '", ';
	  outStr += '"' + configUser.OPLED_k2 + '" : "' + configUser.OPLED_v2 + '", ';
	  outStr += '"' + configUser.OPLED_k3 + '" : "' + configUser.OPLED_v3 + '", ';
	  outStr += '"' + configUser.OPLED_k4 + '" : "' + configUser.OPLED_v4 + '", ';
	  outStr += '"Alert" : "' + jsonObj.Alert + '", ';
	  outStr += '"AlertLevel" : "' + jsonObj.AlertLevel + '", ';
	  outStr += '"Mag" : "' + jsonObj.mag + '", ';
	  outStr += '"ts_uSec" : "' + jsonObj.ts_uSec + '"';
	  outStr += '}';
	}

	if(jsonObj.Alert.includes("OP1") && configUser.OP1_trig_checked == "mic" && configUser.OP1_HTTPS_checked == "https"){
	  
	  url = configUser.OP1_POST_URL;
	  
	  outStr  = '{';
	  outStr += '"' + configUser.OP1_k1 + '" : "' + configUser.OP1_v1 + '", ';
	  outStr += '"' + configUser.OP1_k2 + '" : "' + configUser.OP1_v2 + '", ';
	  outStr += '"' + configUser.OP1_k3 + '" : "' + configUser.OP1_v3 + '", ';
	  outStr += '"' + configUser.OP1_k4 + '" : "' + configUser.OP1_v4 + '", ';
	  outStr += '"Alert" : "' + jsonObj.Alert + '", ';
	  outStr += '"AlertLevel" : "' + jsonObj.AlertLevel + '", ';
	  outStr += '"Mag" : "' + jsonObj.mag + '", ';
	  outStr += '"ts_uSec" : "' + jsonObj.ts_uSec + '"';
	  outStr += '}';
	}
	
	if(jsonObj.Alert.includes("OP2") && configUser.OP2_trig_checked == "mic" && configUser.OP2_HTTPS_checked == "https"){
	  
	  url = configUser.OP2_POST_URL;
	  
	  outStr  = '{';
	  outStr += '"' + configUser.OP2_k1 + '" : "' + configUser.OP2_v1 + '", ';
	  outStr += '"' + configUser.OP2_k2 + '" : "' + configUser.OP2_v2 + '", ';
	  outStr += '"' + configUser.OP2_k3 + '" : "' + configUser.OP2_v3 + '", ';
	  outStr += '"' + configUser.OP2_k4 + '" : "' + configUser.OP2_v4 + '", ';
	  outStr += '"Alert" : "' + jsonObj.Alert + '", ';
	  outStr += '"AlertLevel" : "' + jsonObj.AlertLevel + '", ';
	  outStr += '"Mag" : "' + jsonObj.mag + '", ';
	  outStr += '"ts_uSec" : "' + jsonObj.ts_uSec + '"';
	  outStr += '}';
	}	

	if(jsonObj.Alert.includes("OP3") && configUser.OP3_trig_checked == "mic" && configUser.OP3_HTTPS_checked == "https"){
	  
	  url = configUser.OP3_POST_URL;
	  
	  outStr  = '{';
	  outStr += '"' + configUser.OP3_k1 + '" : "' + configUser.OP3_v1 + '", ';
	  outStr += '"' + configUser.OP3_k2 + '" : "' + configUser.OP3_v2 + '", ';
	  outStr += '"' + configUser.OP3_k3 + '" : "' + configUser.OP3_v3 + '", ';
	  outStr += '"' + configUser.OP3_k4 + '" : "' + configUser.OP3_v4 + '", ';
	  outStr += '"Alert" : "' + jsonObj.Alert + '", ';
	  outStr += '"AlertLevel" : "' + jsonObj.AlertLevel + '", ';
	  outStr += '"Mag" : "' + jsonObj.mag + '", ';
	  outStr += '"ts_uSec" : "' + jsonObj.ts_uSec + '"';
	  outStr += '}';
	}

	if(jsonObj.Alert.includes("OP4") && configUser.OP4_trig_checked == "mic" && configUser.OP4_HTTPS_checked == "https"){
	  
	  url = configUser.OP4_POST_URL;
	  
	  outStr  = '{';
	  outStr += '"' + configUser.OP4_k1 + '" : "' + configUser.OP4_v1 + '", ';
	  outStr += '"' + configUser.OP4_k2 + '" : "' + configUser.OP4_v2 + '", ';
	  outStr += '"' + configUser.OP4_k3 + '" : "' + configUser.OP4_v3 + '", ';
	  outStr += '"' + configUser.OP4_k4 + '" : "' + configUser.OP4_v4 + '", ';
	  outStr += '"Alert" : "' + jsonObj.Alert + '", ';
	  outStr += '"AlertLevel" : "' + jsonObj.AlertLevel + '", ';
	  outStr += '"Mag" : "' + jsonObj.mag + '", ';
	  outStr += '"ts_uSec" : "' + jsonObj.ts_uSec + '"';
	  outStr += '}';
	}	
			
	//utils.log.info(ts()+"LE880alerts.js outStr : " + outStr);
	
	if(url != ""){ // ok to send HTTP POST
	
	  //
	  // use axios like cURL for HTTPS POST with same headers as AJAX
	  //
		
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
	      
	      //utils.log.info(ts()+"LE880alerts.js JSON.stringify(response.data) : " + JSON.stringify(response.data));
	      
	      //
	      // use s2cSignal to display on messageBar
	      //
	      
	      var msg  = "Microphone alert sent via HTTP POST to " + url;
		  msg += "<br><br>";
		  msg += "HTTP POST data:";
		  msg += "<br><br>";
		  msg += outStr;
		  msg += "<br><br>";
		  msg += "Response data:";
		  msg += "<br><br>";
		  msg += JSON.stringify(response.data);
				  
	      //var msgJSON = { "sentFile" : "micAlert.json", "toClient" : "messageBar", "messageBar" : msg };
	      var msgJSON = { "sentFile" : pathParse(event).base, "toClient" : "messageBar", "messageBar" : msg };

	      //var s2cSignalOutFile = process.cwd() + "/s2cSignalOut/micAlert.json";
	      var s2cSignalOutFile = process.cwd() + "/s2cSignalOut/" + pathParse(event).base;
	      
	      //utils.log.info(ts()+"LE880alerts.js  s2cSignalOutFile : " + s2cSignalOutFile);

	      try { fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON)); }
	      catch { utils.log.error(ts()+"LE880alerts.js testPOST fs.writeFileSync(s2cSignalOutFile, JSON.stringify(msgJSON))")};
	      
	    })
	    
	    .catch(function (error) {
	      utils.log.error(ts()+"LE880alerts.js axios post error: " + error);
	    });
	    
	} // if(url != "")
	
	//
	// Output Ports
	//
	var maxcount=250;
	var OPrec     = null;
	var secBefore = 5;
	var secAfter  = 5;
	timeLast=time.getSeconds();

	if(jsonObj.Alert.includes("OPLED") && configUser.OPLED_trig_checked == "mic" && configUser.OPLED_Duration > 0){
	  
	  if(configUser.OPLED_recording_checked == "enabled"){
	    OPrec     = "OPLED";
	    secBefore = configUser.OPLED_recording_duration_before;
	    secAfter  = configUser.OPLED_recording_duration_after;
	  }

	  triggerLEDcount+=1;
	  if(triggerLEDcount == 1)
	  {
	  OPLED.writeSync(1);
	  setTimeout(function()
	  				{OPLED.writeSync(0);
					triggerLEDcount=0;}, configUser.OPLED_Duration * 1000);	
	  }

 
	


	/*  OPLED.writeSync(1);
	  cmd = "sleep "+configUser.OPLED_Duration;
	  execSync(cmd);
	  OPLED.writeSync(0);
	  cmd = "sleep "+configUser.OPLED_Duration;
	  execSync(cmd);
	  */	  

	}
	
	if(jsonObj.Alert.includes("OP1") && configUser.OP1_trig_checked == "mic" && configUser.OP1_Duration > 0){
	  
	  if(configUser.OP1_recording_checked == "enabled"){
	    OPrec     = "OP1";
	    secBefore = configUser.OP1_recording_duration_before;
	    secAfter  = configUser.OP1_recording_duration_after;
	  }
	  	  
	/*  OPLED.writeSync(1);
	  cmd = "sleep "+configUser.OP1_Duration;
	  execSync(cmd);
	  OPLED.writeSync(0);
	  cmd = "sleep "+configUser.OP1_Duration;
	  execSync(cmd);
	  */	

	  //setTimeout(function(){},configUser.OP1_Duration * 1000);
	  triggerOP1count+=1;
	  utils.log.info(ts()+"LE880alerts.js  flag2 : " + triggerOP1count);
	  if(triggerOP1count==1)
	  {
	  OP1.writeSync(1);
	  setTimeout(function()
	  		{OP1.writeSync(0);
				triggerOP1count=0;}, configUser.OP1_Duration * 1000);	
	  } 

     
	}

	if(jsonObj.Alert.includes("OP2") && configUser.OP2_trig_checked == "mic" && configUser.OP2_Duration > 0){
	  
	  if(configUser.OP2_recording_checked == "enabled"){
	    OPrec    = "OP2";
	    secBefore = configUser.OP2_recording_duration_before;
	    secAfter  = configUser.OP2_recording_duration_after;
	  }
	  triggerOP2count+=1;
	  if(triggerOP2count==1)
	  {	  
	  OP2.writeSync(1);
	  setTimeout(function()
	  		{OP2.writeSync(0);
			triggerOP2count=0;}, configUser.OP2_Duration * 1000);	
	  } 
  
	}
	
	if(jsonObj.Alert.includes("OP3") && configUser.OP3_trig_checked == "mic" && configUser.OP3_Duration > 0){
	  
	  if(configUser.OP3_recording_checked == "enabled"){
	    OPrec     = "OP3";
	    secBefore = configUser.OP3_recording_duration_before;
	    secAfter  = configUser.OP3_recording_duration_after;
	  }
	  triggerOP3count+=1;
	  if(triggerOP3count==1)
	  {	  	  
	  OP3.writeSync(1);	
	  setTimeout(function()
	  		{OP3.writeSync(0);
			triggerOP3count=0;}, configUser.OP3_Duration * 1000);	
	  } 

	}
	
	if(jsonObj.Alert.includes("OP4") && configUser.OP4_trig_checked == "mic" && configUser.OP4_Duration > 0){
	  
	  if(configUser.OP4_recording_checked == "enabled"){
	    OPrec     = "OP4";
	    secBefore = configUser.OP4_recording_duration_before;
	    secAfter  = configUser.OP4_recording_duration_after;
	  }
	  triggerOP4count+=1;
	  if(triggerOP4count==1)	  	  
	  {
	  OP4.writeSync(1);
	  setTimeout(function()
	  		{OP4.writeSync(0);
			triggerOP4count=0;}, configUser.OP4_Duration * 1000);
	  } 	
	}
		
	if(OPrec){
	
	  //
	  // save audio, wait for mSecAfter
	  //
	  // 2021-03-16_16:40:11.893160.raw
	  //
	  
	  var tsNow		= ts1();
	
	  var nowNum 		= Number(ms(tsNow));
	  //utils.log.info(ts()+"LE880alerts.js nowNum:     " + nowNum);
	  
	  var mSecBefore		= Number( nowNum - (secBefore * 1000) ); // 5 is secBefore from configUser
	  //utils.log.info(ts()+"LE880alerts.js mSecBefore: " + mSecBefore);
	  
	  var mSecAfter 		= Number( nowNum + (secAfter * 1000) );
	  //utils.log.info(ts()+"LE880alerts.js mSecAfter:  " + mSecAfter);
	  
	  var alertBuf 		= "/home/pi/LE880-Profile-T/alertBuf";
	  var alertWAV 		= "/home/pi/LE880-Profile-T/alertWAV";
	  var wavFile		= alertWAV + "/" + OPrec + "_mic_alert_" + tsNow + ".wav";	
	  
	  var delay		= Number(secAfter * 1000);
	  
	  var saveAudioReset 	= setTimeout(function(){

	    var files = fs.readdirSync(alertBuf);
	    
	    var list = [];
	    
	    var raw  = [];
	    
	    var i = 0*1;

	    for (var file of files) {
	      
	      var msf = Number(ms(file));
	      
	      if( msf > mSecBefore && msf < mSecAfter ){
		//utils.log.info(ts()+"LE880alerts.js i:" + i.toString().padStart(4,"0") + " ms(file) (" + msf + ") > mSecBefore (" + mSecBefore + "), file: " + file);
		//utils.log.info(ts()+"LE880alerts.js " + (msf - mSecBefore) / 1000 );
		list.push(file);
		i++;
		
	      } // if( msf > mSecBefore && msf < mSecAfter )
	      
	    } // for (var file of files)  
	    
	    list.sort();
	     
	    //
	    // create wav file 44 byte header using length = (i-1) * 3200
	    //
	    // http://soundfile.sapp.org/doc/WaveFormat/
	    //
	    
	    var ChunkSize = 36 + ((i-1) * 3200);
	    //utils.log.info(ts()+"LE880alerts.js ChunkSize: " + ChunkSize);
	    
	    var ChunkSizeHex	= "0x" + ChunkSize.toString(16).padStart(8, "0");
	    //utils.log.info(ts()+"LE880alerts.js ChunkSizeHex: " + ChunkSizeHex);
	    
	    var ChunkSizeHexLE	= changeEndianness(ChunkSizeHex, 8);
	    //utils.log.info(ts()+"LE880alerts.js ChunkSizeHexLE: " + ChunkSizeHexLE);

	    var Subchunk2Size = (i-1) * 3200;
	    //utils.log.info(ts()+"LE880alerts.js Subchunk2Size: " + Subchunk2Size);
	    
	    var Subchunk2SizeHex	= "0x" + Subchunk2Size.toString(16).padStart(8, "0");
	    //utils.log.info(ts()+"LE880alerts.js Subchunk2SizeHex: " + Subchunk2SizeHex);
	    
	    var Subchunk2SizeHexLE	= changeEndianness(Subchunk2SizeHex, 8);
	    //utils.log.info(ts()+"LE880alerts.js Subchunk2SizeHexLE: " + Subchunk2SizeHexLE);

	    var hd = [];

	    hd.push(rm0x("0x52494646"));		// ChunkID 		"RIFF"			BE	0

	    hd.push(rm0x(ChunkSizeHexLE));	// ChunkSize		36 + data.length	LE	4 	36 + ((i-1) * 3200)

	    hd.push(rm0x("0x57415645"));		// Format		"WAVE"			BE	8

	    hd.push(rm0x("0x666d7420"));		// Subchunk1ID		"fmt "			BE	12

	    hd.push(rm0x("0x10000000"));		// Subchunk1Size	16	0x00000010	LE	16

	    hd.push(rm0x("0x0100"));		// AudioFormat		1	0x0001		LE	20

	    hd.push(rm0x("0x0100"));		// NumChannels		1	0x0001		LE	22

	    hd.push(rm0x("0x803E0000"));		// SampleRate		16000	0x3E80		LE	24

	    hd.push(rm0x("0x007D0000"));		// ByteRate		32000	0x7D00		LE	28

	    hd.push(rm0x("0x0200"));		// BlockAlign		2	0x0002		LE	32

	    hd.push(rm0x("0x1000"));		// BitsPerSample	16	0x0010		LE	34
	    
	    hd.push(rm0x("0x64617461"));		// Subchunk2ID		"data"			BE	36
	    
	    hd.push(rm0x(Subchunk2SizeHexLE));	// Subchunk2Size	data.length		LE	40	((i-1) * 3200)
	    
	    /*
	    for(var i = 0; i < hd.length; i++){
	      utils.log.info(ts()+"LE880alerts.js hd[" + i + "]: " + hd[i]);
	    }
	    */
	    
	    var hdStr = "".concat(...hd);
	    //utils.log.info(ts()+"LE880alerts.js hdStr: " + hdStr);
	    
	    var hdHex = new Buffer.from(hdStr, "hex");
	    //utils.log.info(ts()+"LE880alerts.js hdHex: " + hdHex);
	    
	    try {
	      fs.appendFileSync(wavFile, hdHex);
	      utils.log.info(ts()+"LE880alerts.js OK hdHex appendFileSync " + wavFile + ", hdHex: " + hdHex);
	    }
	    
	    catch (err){
	      utils.log.info(ts()+"LE880alerts.js ERROR hdStr appendFileSync err:" + err + " " + wavFile);
	    }	  

	    //
	    // create wav file by appending sorted list of raw files
	    //
	    
	    var fileData = null;
	    
	    var i = 0*1;
	    for(var f of list){
	      
	      //utils.log.info(ts()+"LE880alerts.js list i:" + i.toString().padStart(4,"0") + " f: " + f);
	      
	      try {
		
		fileData = fs.readFileSync(alertBuf + "/" + f);
		//utils.log.info(ts()+"LE880alerts.js list i:" + i.toString().padStart(4,"0") + " OK readFileSync " + alertBuf + "/" + f);
		
		try {
		  fs.appendFileSync(wavFile, fileData);
		  //utils.log.info(ts()+"LE880alerts.js list i:" + i.toString().padStart(4,"0") + " OK appendFileSync " + wavFile);
		}
		
		catch (err){
		  utils.log.info(ts()+"LE880alerts.js list i:" + i.toString().padStart(4,"0") + " appendFileSync err:" + err + " " + wavFile);
		}
		
	      }
		
	      catch (err) {
		utils.log.info(ts()+"LE880alerts.js list i:" + i.toString().padStart(4,"0") + " readFileSync err: " + err + " " + alertBuf + "/" + f);
	      }
	      
	      i++;
	      
	    } // for(var f of list)
		  
	  }, delay);
	
	} // if(OPrec)
	
      }); // watcher      
      
  } // function LE880alerts()
  
   return LE880alerts;
    
}());

module.exports = LE880alerts;
