"use strict";
const utils_1 = require('./utils');
const fs = require('fs');
const parser = require('body-parser');
const utils = utils_1.Utils.utils;
const util = require('util'); // inspect
const { exec, execSync } = require("child_process");

function ts(){
  return new Date().YYYYMMDDHHMMSSmmm() + " : ";
}

var AudioSettingsExport = (function () {
      
  function AudioSettingsExport() {
    this.buildAudioSettingsHTML();
  }
    
  AudioSettingsExport.prototype.buildAudioSettingsHTML = function () {

    //
    // Audio Settings only runs on browser admin webpage window.onload
    //
    // reset LE880 to Browser Intercom on admin webpage window.onload
    //
    // LE880 to Browser Intercom
    //

    delete require.cache[require.resolve(process.cwd() + "/LE880factoryConfig.json")];
    var config = require(process.cwd() + "/LE880factoryConfig.json");
    //utils.log.info(ts()+"AudioSettings config: " + util.inspect(config, {showHidden: false, depth: null}));
    
    delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
    var configUser = require(process.cwd() + "/LE880userConfig.json");
    //utils.log.info(ts()+"AudioSettings configUser: " + util.inspect(configUser, {showHidden: false, depth: null}));

    var LOG = config.LOG;
    var cmd = null;
    var out = null;

    cmd = "sudo pkill -9 -f 'LE880-webrtc-wm8960' >> "+LOG+"LE880-webrtc-pkill.log 2>&1";
    try {
      out = execSync(cmd).toString();
      //utils.log.info(ts()+'AudioSettings.js cmd: ' + cmd + ', out: ' + out);
    }
    catch (error) {
      utils.log.warn(ts()+'AudioSettings.js PROCESS NOT FOUND cmd: ' + cmd + '\nerror.toString(): ' + error.toString());
    }

    var html = '';

    html += '<table><tbody>';
              
      html += '<tr>';
	html += '<td class="AudioLabel">LE880 to VMS Send:</td>';
//	html += '<td class="AudioButton"><button class="buttonAudioOnOff" id="buttonLE880toVMSAutoStart" onclick="LE880toVMSAutoStart()">Set Auto Start</button></td>';
	html += '<td class="AudioButton"><button class="buttonAudioOnOff" id="buttonVMSsendOnOff" onclick="VMSsendOnOff()">Enable</button></td>';
      html += '</tr>';

    html += '</table></tbody>';    

    html += '<table><tbody>';

    html += '<tr>';
    html += '<td class="AudioLabel">LE880 to VMS Send Username:</td>';
    html += '<td class="AudioURL"><input class="AudioURLOutput" type="input" id="RTSPUsername" value="'+ config.RTSPUsername +'"></td>';
        html += '</tr>';    

    html += '<tr>';
    html += '<td class="AudioLabel">LE880 to VMS Send Password:</td>';
    html += '<td class="AudioURL"><input class="AudioURLOutput" type="input" id="RTSPPassword" value="'+ config.RTSPPassword +'"></td>';
        html += '</tr>';          

    html += '<tr>';
    html += '<td class="AudioLabel">LE880 to VMS Send Port:</td>';
    html += '<td class="AudioURL"><input class="AudioURLOutput" type="input" id="RTSPPort" value="'+ config.RTSPPort +'"></td>';
        html += '</tr>';            

      html += '<tr>';
	html += '<td class="AudioLabel">LE880 to VMS Send URL:</td>';
	html += '<td class="AudioURL" id="OutgoingAudioURL">LE880 to VMS URL</td>';
      html += '</tr>';
          
      html += '<tr>';
	html += '<td class="AudioLabel">LE880 Send UDP Multicast IP:</td>';
	html += '<td class="AudioURL"><input class="AudioURLInput" type="input" id="OutgoingUDPMulticastIP" value="' + configUser.OutgoingUDPMulticastIP + '"></td>';
      html += '</tr>';

      html += '<tr>';
	html += '<td class="AudioLabel">LE880 Send UDPMulticast Port:</td>';
	html += '<td class="AudioURL"><input class="AudioURLInput" type="input" id="OutgoingUDPMulticastPort" value="' + configUser.OutgoingUDPMulticastPort + '"></td>';
      html += '</tr>';
                  
    html += '</table></tbody>';

    html += '<table><tbody>';
    
      html += '<tr>';
	html += '<td class="AudioLabel">VMS to LE880 Receive:</td>';
	//html += '<td class="AudioButton"><button class="buttonAudioOnOff" id="buttonVMStoLE880AutoStart" onclick="VMStoLE880AutoStart()">Set Auto Start</button></td>';
	html += '<td class="AudioButtonOnOff"><button class="buttonAudioOnOff" id="buttonVMSrecvOnOff" onclick="VMSrecvOnOff()">Enable</button></td>';
	
	html += '<td id="VMSloopback"><a href="javascript:VMSloopback();">Use Loopback Test URL</a></td>';
	
      html += '</tr>';

    html += '</table></tbody>';    

    html += '<table><tbody>';
    
      html += '<tr>';
	html += '<td class="AudioLabel">VMS to LE880 Receive URL:</td>';
	html += '<td class="AudioURL"><input type="input" class="AudioURLInput" id="IncomingAudioURL" value="' + configUser.IncomingAudioURL + '"></td>';
      html += '</tr>';

    html += '</table></tbody>';    

    html += '<table><tbody>';
    
      html += '<tr>';
	html += '<td class="AudioLabel">LE880 to Browser Intercom:</td>';
	//html += '<td class="AudioButton"><button class="buttonAudioOnOff" id="buttonIntercomAutoStart" onclick="intercomAutoStart()">Set Auto Start</button></td>';
	html += '<td class="AudioButtonOnOff"><button class="buttonAudioOnOff" id="buttonIntercomOnOff" onclick="intercomOnOff()">Enable</button></td>';
      
	html += '<td id="browserwillreload">&nbsp;</td>';
      
      html += '</tr>';
    
    html += '</table></tbody>';
    
    html += '<hr>';
    
    //
    // LE880 to VMS URL settings
    //
        
    html += '<table><tbody>';

    var arr 		= config.AudioOptionsMedia2Encoder;
    //utils.log.info(ts()+"AudioSettings AudioSettings.js configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));
    var def		= configUser.AudioOptionsMedia2EncoderDefault;
    //utils.log.info(ts()+"AudioSettings def : " + def);

    var propLabel	= "LE880 to VMS Send Audio Stream";
    var propName	= "AudioOptionsMedia2Encoder";
    html += '<tr><td colspan="2" class="audioCheckbox">' + propLabel + '</td></tr>';
    
    //html += '<tr><td colspan="2" class="audioCheckbox">&nbsp;</td></tr>';
	  
    
    /*
    
    var propLabel	= "Encoder";
    var propName	= "AudioOptionsMedia2Encoder";
    html += '<tr><td colspan="2" class="audioCheckbox">' + propLabel + '</td></tr>';

    var checked = "";

    arr.forEach ( x => {
      
     if(x == def){var checked = "checked"} else {var checked = ""}
     
     //utils.log.info(ts()+"AudioSettings x : " + x);
     //utils.log.info(ts()+"AudioSettings def : " + def);
     //utils.log.info(ts()+"AudioSettings checked : " + checked);
     
     html += '\n<tr>';
     html += '<td><input type="radio" name="' + propName + '" id="'+ x + '" value="' + x + '" ' + checked + '>';
     html += '<label for="' + x + '">' + x + '</label></td>';
       html += '</tr>';
       
    });

    */
    
    //
    // protocol
    //
    
    var arr 		= config.AudioOptionsStreamingContainer;
    var def		= configUser.AudioOptionsStreamingContainerDefault;

    var propLabel	= "Protocol (Streaming Container)";
    var propName	= "AudioOptionsStreamingContainer";
    html += '<tr><td colspan="2" class="audioCheckbox">' + propLabel + '</td></tr>';

    arr.forEach ( x => {
      
      if(x == def){var checked = "checked"} else {var checked = ""}

      utils.log.info(ts()+"AudioSettings x : " + x);
      utils.log.info(ts()+"AudioSettings def : " + def);
      utils.log.info(ts()+"AudioSettings checked : " + checked);

      html += '\n<tr>';
      html += '<td><input type="radio" name="' + propName + '" id="'+ x + '" value="' + x + '" ' + checked + '>';
      html += '<label for="' + x + '">' + x + '</label></td>';
      html += '</tr>';
       
    });
    
    //
    // IncludeVideoOnvif
    //

    //var arr 		= configUser.IncludeVideoOnvif;
    var arr 		= config.IncludeVideoOnvif;
    //utils.log.info(ts()+"AudioSettings.js config.IncludeVideoOnvif : " + util.inspect(arr, {showHidden: false, depth: null}));
    
    if(configUser.IncludeVideoOnvifDefault){
      var def = configUser.IncludeVideoOnvifDefault;
    } else {
      var def = config.IncludeVideoOnvifDefault;
    }
    //utils.log.info(ts()+"AudioSettings.js def : " + def);

    //var propLabel	= "LE880 to VMS Send Audio Stream";
    //var propName	= "AudioOptionsMedia2Encoder";
    //html += '<tr><td colspan="2" class="audioCheckbox">' + propLabel + '</td></tr>';
    
    //html += '<tr><td colspan="2" class="audioCheckbox">&nbsp;</td></tr>';
	  
    var propLabel	= "Include Video in RTSP Stream for Onvif Compatibility";
    var propName	= "IncludeVideoOnvif";
    html += '<tr><td colspan="2" class="audioCheckbox">' + propLabel + '</td></tr>';

    var checked = "";

    arr.forEach ( x => {
      
     if(x == def){var checked = "checked"} else {var checked = ""}
     
     //utils.log.info(ts()+"AudioSettings x : " + x);
     //utils.log.info(ts()+"AudioSettings def : " + def);
     //utils.log.info(ts()+"AudioSettings checked : " + checked);
     
     html += '\n<tr>';
     html += '<td><input type="radio" name="' + propName + '" id="'+ x + '" value="' + x + '" ' + checked + '>';
     html += '<label for="' + x + '">' + x + '</label></td>';
       html += '</tr>';
       
    });

    html += '</tbody></table>';

    return html;

  };

  return AudioSettingsExport;      
    
}());

module.exports = AudioSettingsExport;
