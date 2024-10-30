"use strict";
const utils_1 	= require('./utils');
const fs 	= require('fs');
const parser 	= require('body-parser');
const utils 	= utils_1.Utils.utils;
const util 	= require('util'); // inspect

function ts(){
  return new Date().YYYYMMDDHHMMSSmmm() + " : ";
}

function ts1(){
  return new Date().YYYYMMDDHHMMSSmmm();
}

var OutputGPIOSettingsExport = (function () {
      
  function OutputGPIOSettingsExport() {
    this.buildOutputGPIOSettingsHTML();
  }
    
  OutputGPIOSettingsExport.prototype.buildOutputGPIOSettingsHTML = function (userSettings) {
        
    delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
    var configUser = require(process.cwd() + "/LE880userConfig.json");

    var filePath = process.cwd() + "/views/OutputPort.html";
    //utils.log.info(ts()+"OutputGPIOSettings.js filePath: " + filePath);
    
    var content = fs.readFileSync(filePath);
    var html	= "";
    var htmlAll = "";

    //
    // LED
    //

    html = content.toString();
    //utils.log.info(ts()+"OutputGPIOSettings.js content str: " + str);
        
    html = html.replace(/\{\{portNumber\}\}/g, "LED");
    //utils.log.info(ts()+"OutputGPIOSettings.js portNumber str: " + str);
    
    html = html.replace(/\{\{portLabel\}\}/g, "LED");
    //utils.log.info(ts()+"OutputGPIOSettings.js portLabel str: " + str);
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OPLED_trig_checked: " + configUser.OPLED_trig_checked);
    
    if(configUser.OPLED_trig_checked == "disable"){
      html = html.replace(/\{\{disable_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{disable_checked\}\}/g, "");
    }    
    
    if(configUser.OPLED_trig_checked == "mic"){
      html = html.replace(/\{\{mic_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{mic_checked\}\}/g, "");
    }       
    
    if(configUser.OPLED_trig_checked == "stream"){
      html = html.replace(/\{\{stream_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{stream_checked\}\}/g, "");
    }   

    if(configUser.OPLED_trig_checked == "IP1"){
      html = html.replace(/\{\{IP1_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP1_checked\}\}/g, "");
    }  
    
    if(configUser.OPLED_trig_checked == "IP2"){
      html = html.replace(/\{\{IP2_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP2_checked\}\}/g, "");
    } 
    
    if(configUser.OPLED_trig_checked == "IP3"){
      html = html.replace(/\{\{IP3_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP3_checked\}\}/g, "");
    } 
    
    if(configUser.OPLED_trig_checked == "IP4"){
      html = html.replace(/\{\{IP4_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP4_checked\}\}/g, "");
    }     
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OPLED_OL_checked: " + configUser.OPLED_OL_checked);
    
    if(configUser.OPLED_OL_checked == "high"){
      html = html.replace(/\{\{high_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{high_checked\}\}/g, "");
    }       
    
    if(configUser.OPLED_OL_checked == "low"){
      html = html.replace(/\{\{low_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{low_checked\}\}/g, "");
    } 
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OPLED_Duration: " + configUser.OPLED_Duration);
    
    html = html.replace(/\{\{duration_value\}\}/g, configUser.OPLED_Duration);
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OPLED_HTTPS_checked: " + configUser.OPLED_HTTPS_checked);    

    //
    // recording
    //

    if(configUser.OPLED_recording_checked == "disabled"){
      html = html.replace(/\{\{recording_disabled_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{recording_disabled_checked\}\}/g, "");
    }     

    if(configUser.OPLED_recording_checked == "enabled"){
      html = html.replace(/\{\{recording_enabled_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{recording_enabled_checked\}\}/g, "");
    }     
    
    html = html.replace(/\{\{recording_duration_value_before\}\}/g, configUser.OPLED_recording_duration_before);
    html = html.replace(/\{\{recording_duration_value_after\}\}/g, configUser.OPLED_recording_duration_after);
    
    
    
    if(configUser.OPLED_HTTPS_checked == "disabled"){
      html = html.replace(/\{\{prot_disabled_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{prot_disabled_checked\}\}/g, "");
    }     

    if(configUser.OPLED_HTTPS_checked == "https"){
      html = html.replace(/\{\{prot_https_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{prot_https_checked\}\}/g, "");
    } 

    /*
    if(configUser.OPLED_HTTPS_checked == "http"){
      html = html.replace(/\{\{prot_http_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{prot_http_checked\}\}/g, "");
    }
    */
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OPLED_POST_URL: " + configUser.OPLED_POST_URL);
    
    html = html.replace(/\{\{POST_URL_value\}\}/g, configUser.OPLED_POST_URL);
    
    html = html.replace(/\{\{k1_value\}\}/g, configUser.OPLED_k1);
    html = html.replace(/\{\{v1_value\}\}/g, configUser.OPLED_v1);
    
    html = html.replace(/\{\{k2_value\}\}/g, configUser.OPLED_k2);
    html = html.replace(/\{\{v2_value\}\}/g, configUser.OPLED_v2);
    
    html = html.replace(/\{\{k3_value\}\}/g, configUser.OPLED_k3);
    html = html.replace(/\{\{v3_value\}\}/g, configUser.OPLED_v3);
    
    html = html.replace(/\{\{k4_value\}\}/g, configUser.OPLED_k4);
    html = html.replace(/\{\{v4_value\}\}/g, configUser.OPLED_v4);
        
    htmlAll += html;   
           
    //
    // Output Port 1
    //

    html = content.toString();
    //utils.log.info(ts()+"OutputGPIOSettings.js content str: " + str);
        
    html = html.replace(/\{\{portNumber\}\}/g, "1");
    //utils.log.info(ts()+"OutputGPIOSettings.js portNumber str: " + str);
    
    html = html.replace(/\{\{portLabel\}\}/g, "Output Port 1");
    //utils.log.info(ts()+"OutputGPIOSettings.js portLabel str: " + str);
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP1_trig_checked: " + configUser.OP1_trig_checked);
    
    if(configUser.OP1_trig_checked == "disable"){
      html = html.replace(/\{\{disable_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{disable_checked\}\}/g, "");
    }    
    
    if(configUser.OP1_trig_checked == "mic"){
      html = html.replace(/\{\{mic_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{mic_checked\}\}/g, "");
    }       
    
    if(configUser.OP1_trig_checked == "stream"){
      html = html.replace(/\{\{stream_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{stream_checked\}\}/g, "");
    }   

    if(configUser.OP1_trig_checked == "IP1"){
      html = html.replace(/\{\{IP1_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP1_checked\}\}/g, "");
    }  
    
    if(configUser.OP1_trig_checked == "IP2"){
      html = html.replace(/\{\{IP2_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP2_checked\}\}/g, "");
    } 
    
    if(configUser.OP1_trig_checked == "IP3"){
      html = html.replace(/\{\{IP3_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP3_checked\}\}/g, "");
    } 
    
    if(configUser.OP1_trig_checked == "IP4"){
      html = html.replace(/\{\{IP4_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP4_checked\}\}/g, "");
    }     
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP1_OL_checked: " + configUser.OP1_OL_checked);
    
    if(configUser.OP1_OL_checked == "high"){
      html = html.replace(/\{\{high_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{high_checked\}\}/g, "");
    }       
    
    if(configUser.OP1_OL_checked == "low"){
      html = html.replace(/\{\{low_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{low_checked\}\}/g, "");
    } 
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP1_Duration: " + configUser.OP1_Duration);
    
    html = html.replace(/\{\{duration_value\}\}/g, configUser.OP1_Duration);
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP1_HTTPS_checked: " + configUser.OP1_HTTPS_checked);    



    //
    // recording
    //

    if(configUser.OP1_recording_checked == "disabled"){
      html = html.replace(/\{\{recording_disabled_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{recording_disabled_checked\}\}/g, "");
    }     

    if(configUser.OP1_recording_checked == "enabled"){
      html = html.replace(/\{\{recording_enabled_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{recording_enabled_checked\}\}/g, "");
    }     
    
    html = html.replace(/\{\{recording_duration_value_before\}\}/g, configUser.OP1_recording_duration_before);
    html = html.replace(/\{\{recording_duration_value_after\}\}/g, configUser.OP1_recording_duration_after);
 
 
    if(configUser.OP1_HTTPS_checked == "disabled"){
      html = html.replace(/\{\{prot_disabled_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{prot_disabled_checked\}\}/g, "");
    }     

    if(configUser.OP1_HTTPS_checked == "https"){
      html = html.replace(/\{\{prot_https_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{prot_https_checked\}\}/g, "");
    } 

    /*
    if(configUser.OP1_HTTPS_checked == "http"){
      html = html.replace(/\{\{prot_http_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{prot_http_checked\}\}/g, "");
    }
    */
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP1_POST_URL: " + configUser.OP1_POST_URL);
    
    html = html.replace(/\{\{POST_URL_value\}\}/g, configUser.OP1_POST_URL);
    
    html = html.replace(/\{\{k1_value\}\}/g, configUser.OP1_k1);
    html = html.replace(/\{\{v1_value\}\}/g, configUser.OP1_v1);
    
    html = html.replace(/\{\{k2_value\}\}/g, configUser.OP1_k2);
    html = html.replace(/\{\{v2_value\}\}/g, configUser.OP1_v2);
    
    html = html.replace(/\{\{k3_value\}\}/g, configUser.OP1_k3);
    html = html.replace(/\{\{v3_value\}\}/g, configUser.OP1_v3);
    
    html = html.replace(/\{\{k4_value\}\}/g, configUser.OP1_k4);
    html = html.replace(/\{\{v4_value\}\}/g, configUser.OP1_v4);    
    
    htmlAll += html;   
    
    //
    // Output Port 2
    //

    html = content.toString();
    //utils.log.info(ts()+"OutputGPIOSettings.js content str: " + str);
        
    html = html.replace(/\{\{portNumber\}\}/g, "2");
    //utils.log.info(ts()+"OutputGPIOSettings.js portNumber str: " + str);
    
    html = html.replace(/\{\{portLabel\}\}/g, "Output Port 2");
    //utils.log.info(ts()+"OutputGPIOSettings.js portLabel str: " + str);
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP2_trig_checked: " + configUser.OP2_trig_checked);
    
    if(configUser.OP2_trig_checked == "disable"){
      html = html.replace(/\{\{disable_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{disable_checked\}\}/g, "");
    }    
    
    if(configUser.OP2_trig_checked == "mic"){
      html = html.replace(/\{\{mic_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{mic_checked\}\}/g, "");
    }       
    
    if(configUser.OP2_trig_checked == "stream"){
      html = html.replace(/\{\{stream_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{stream_checked\}\}/g, "");
    }   

    if(configUser.OP2_trig_checked == "IP1"){
      html = html.replace(/\{\{IP1_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP1_checked\}\}/g, "");
    }  
    
    if(configUser.OP2_trig_checked == "IP2"){
      html = html.replace(/\{\{IP2_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP2_checked\}\}/g, "");
    } 
    
    if(configUser.OP2_trig_checked == "IP3"){
      html = html.replace(/\{\{IP3_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP3_checked\}\}/g, "");
    } 
    
    if(configUser.OP2_trig_checked == "IP4"){
      html = html.replace(/\{\{IP4_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP4_checked\}\}/g, "");
    }     
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP2_OL_checked: " + configUser.OP2_OL_checked);
    
    if(configUser.OP2_OL_checked == "high"){
      html = html.replace(/\{\{high_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{high_checked\}\}/g, "");
    }       
    
    if(configUser.OP2_OL_checked == "low"){
      html = html.replace(/\{\{low_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{low_checked\}\}/g, "");
    } 
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP2_Duration: " + configUser.OP2_Duration);
    
    html = html.replace(/\{\{duration_value\}\}/g, configUser.OP2_Duration);
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP2_HTTPS_checked: " + configUser.OP2_HTTPS_checked);    



    //
    // recording
    //

    if(configUser.OP2_recording_checked == "disabled"){
      html = html.replace(/\{\{recording_disabled_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{recording_disabled_checked\}\}/g, "");
    }     

    if(configUser.OP2_recording_checked == "enabled"){
      html = html.replace(/\{\{recording_enabled_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{recording_enabled_checked\}\}/g, "");
    }     
    
    html = html.replace(/\{\{recording_duration_value_before\}\}/g, configUser.OP2_recording_duration_before);
    html = html.replace(/\{\{recording_duration_value_after\}\}/g, configUser.OP2_recording_duration_after);
 
 
    if(configUser.OP2_HTTPS_checked == "disabled"){
      html = html.replace(/\{\{prot_disabled_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{prot_disabled_checked\}\}/g, "");
    }     

    if(configUser.OP2_HTTPS_checked == "https"){
      html = html.replace(/\{\{prot_https_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{prot_https_checked\}\}/g, "");
    } 

    /*
    if(configUser.OP2_HTTPS_checked == "http"){
      html = html.replace(/\{\{prot_http_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{prot_http_checked\}\}/g, "");
    }
    */
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP2_POST_URL: " + configUser.OP2_POST_URL);
    
    html = html.replace(/\{\{POST_URL_value\}\}/g, configUser.OP2_POST_URL);
    
    html = html.replace(/\{\{k1_value\}\}/g, configUser.OP2_k1);
    html = html.replace(/\{\{v1_value\}\}/g, configUser.OP2_v1);
    
    html = html.replace(/\{\{k2_value\}\}/g, configUser.OP2_k2);
    html = html.replace(/\{\{v2_value\}\}/g, configUser.OP2_v2);
    
    html = html.replace(/\{\{k3_value\}\}/g, configUser.OP2_k3);
    html = html.replace(/\{\{v3_value\}\}/g, configUser.OP2_v3);
    
    html = html.replace(/\{\{k4_value\}\}/g, configUser.OP2_k4);
    html = html.replace(/\{\{v4_value\}\}/g, configUser.OP2_v4);    
    
    htmlAll += html;      

    //
    // Output Port 3
    //

    html = content.toString();
    //utils.log.info(ts()+"OutputGPIOSettings.js content str: " + str);
        
    html = html.replace(/\{\{portNumber\}\}/g, "3");
    //utils.log.info(ts()+"OutputGPIOSettings.js portNumber str: " + str);
    
    html = html.replace(/\{\{portLabel\}\}/g, "Output Port 3");
    //utils.log.info(ts()+"OutputGPIOSettings.js portLabel str: " + str);
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP3_trig_checked: " + configUser.OP3_trig_checked);
    
    if(configUser.OP3_trig_checked == "disable"){
      html = html.replace(/\{\{disable_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{disable_checked\}\}/g, "");
    }    
    
    if(configUser.OP3_trig_checked == "mic"){
      html = html.replace(/\{\{mic_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{mic_checked\}\}/g, "");
    }       
    
    if(configUser.OP3_trig_checked == "stream"){
      html = html.replace(/\{\{stream_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{stream_checked\}\}/g, "");
    }   

    if(configUser.OP3_trig_checked == "IP1"){
      html = html.replace(/\{\{IP1_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP1_checked\}\}/g, "");
    }  
    
    if(configUser.OP3_trig_checked == "IP2"){
      html = html.replace(/\{\{IP2_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP2_checked\}\}/g, "");
    } 
    
    if(configUser.OP3_trig_checked == "IP3"){
      html = html.replace(/\{\{IP3_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP3_checked\}\}/g, "");
    } 
    
    if(configUser.OP3_trig_checked == "IP4"){
      html = html.replace(/\{\{IP4_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP4_checked\}\}/g, "");
    }     
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP3_OL_checked: " + configUser.OP3_OL_checked);
    
    if(configUser.OP3_OL_checked == "high"){
      html = html.replace(/\{\{high_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{high_checked\}\}/g, "");
    }       
    
    if(configUser.OP3_OL_checked == "low"){
      html = html.replace(/\{\{low_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{low_checked\}\}/g, "");
    } 
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP3_Duration: " + configUser.OP3_Duration);
    
    html = html.replace(/\{\{duration_value\}\}/g, configUser.OP3_Duration);
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP3_HTTPS_checked: " + configUser.OP3_HTTPS_checked);    



    //
    // recording
    //

    if(configUser.OP3_recording_checked == "disabled"){
      html = html.replace(/\{\{recording_disabled_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{recording_disabled_checked\}\}/g, "");
    }     

    if(configUser.OP3_recording_checked == "enabled"){
      html = html.replace(/\{\{recording_enabled_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{recording_enabled_checked\}\}/g, "");
    }     
    
    html = html.replace(/\{\{recording_duration_value_before\}\}/g, configUser.OP3_recording_duration_before);
    html = html.replace(/\{\{recording_duration_value_after\}\}/g, configUser.OP3_recording_duration_after);
 
 
    if(configUser.OP3_HTTPS_checked == "disabled"){
      html = html.replace(/\{\{prot_disabled_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{prot_disabled_checked\}\}/g, "");
    }     

    if(configUser.OP3_HTTPS_checked == "https"){
      html = html.replace(/\{\{prot_https_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{prot_https_checked\}\}/g, "");
    } 

    /*
    if(configUser.OP3_HTTPS_checked == "http"){
      html = html.replace(/\{\{prot_http_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{prot_http_checked\}\}/g, "");
    }
    */
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP3_POST_URL: " + configUser.OP3_POST_URL);
    
    html = html.replace(/\{\{POST_URL_value\}\}/g, configUser.OP3_POST_URL);
    
    html = html.replace(/\{\{k1_value\}\}/g, configUser.OP3_k1);
    html = html.replace(/\{\{v1_value\}\}/g, configUser.OP3_v1);
    
    html = html.replace(/\{\{k2_value\}\}/g, configUser.OP3_k2);
    html = html.replace(/\{\{v2_value\}\}/g, configUser.OP3_v2);
    
    html = html.replace(/\{\{k3_value\}\}/g, configUser.OP3_k3);
    html = html.replace(/\{\{v3_value\}\}/g, configUser.OP3_v3);
    
    html = html.replace(/\{\{k4_value\}\}/g, configUser.OP3_k4);
    html = html.replace(/\{\{v4_value\}\}/g, configUser.OP3_v4);        
    
    htmlAll += html;    
    
    //
    // Output Port 4
    //
  
    html = content.toString();
    //utils.log.info(ts()+"OutputGPIOSettings.js content str: " + str);
    
    html = html.replace(/\{\{portNumber\}\}/g, "4");
    //utils.log.info(ts()+"OutputGPIOSettings.js portNumber str: " + str);
    
    html = html.replace(/\{\{portLabel\}\}/g, "Output Port 4");
    //utils.log.info(ts()+"OutputGPIOSettings.js portLabel str: " + str); 
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP4_trig_checked: " + configUser.OP4_trig_checked);
    
    if(configUser.OP4_trig_checked == "disable"){
      html = html.replace(/\{\{disable_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{disable_checked\}\}/g, "");
    }    
    
    if(configUser.OP4_trig_checked == "mic"){
      html = html.replace(/\{\{mic_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{mic_checked\}\}/g, "");
    }       
    
    if(configUser.OP4_trig_checked == "stream"){
      html = html.replace(/\{\{stream_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{stream_checked\}\}/g, "");
    }   

    if(configUser.OP4_trig_checked == "IP1"){
      html = html.replace(/\{\{IP1_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP1_checked\}\}/g, "");
    }  
    
    if(configUser.OP4_trig_checked == "IP2"){
      html = html.replace(/\{\{IP2_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP2_checked\}\}/g, "");
    } 
    
    if(configUser.OP4_trig_checked == "IP3"){
      html = html.replace(/\{\{IP3_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP3_checked\}\}/g, "");
    } 
    
    if(configUser.OP4_trig_checked == "IP4"){
      html = html.replace(/\{\{IP4_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{IP4_checked\}\}/g, "");
    }     
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP4_OL_checked: " + configUser.OP4_OL_checked);
    
    if(configUser.OP4_OL_checked == "high"){
      html = html.replace(/\{\{high_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{high_checked\}\}/g, "");
    }       
    
    if(configUser.OP4_OL_checked == "low"){
      html = html.replace(/\{\{low_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{low_checked\}\}/g, "");
    } 
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP4_Duration: " + configUser.OP4_Duration);
    
    html = html.replace(/\{\{duration_value\}\}/g, configUser.OP4_Duration);



    //
    // recording
    //

    if(configUser.OP4_recording_checked == "disabled"){
      html = html.replace(/\{\{recording_disabled_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{recording_disabled_checked\}\}/g, "");
    }     

    if(configUser.OP4_recording_checked == "enabled"){
      html = html.replace(/\{\{recording_enabled_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{recording_enabled_checked\}\}/g, "");
    }     
    
    html = html.replace(/\{\{recording_duration_value_before\}\}/g, configUser.OP4_recording_duration_before);
    html = html.replace(/\{\{recording_duration_value_after\}\}/g, configUser.OP4_recording_duration_after);
 
     
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP4_HTTPS_checked: " + configUser.OP4_HTTPS_checked);    

    if(configUser.OP4_HTTPS_checked == "disabled"){
      html = html.replace(/\{\{prot_disabled_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{prot_disabled_checked\}\}/g, "");
    }     

    if(configUser.OP4_HTTPS_checked == "https"){
      html = html.replace(/\{\{prot_https_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{prot_https_checked\}\}/g, "");
    } 

    /*
    if(configUser.OP4_HTTPS_checked == "http"){
      html = html.replace(/\{\{prot_http_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{prot_http_checked\}\}/g, "");
    }
    */
    
    //utils.log.info(ts()+"OutputGPIOSettings.js configUser.OP4_POST_URL: " + configUser.OP4_POST_URL);
    
    html = html.replace(/\{\{POST_URL_value\}\}/g, configUser.OP4_POST_URL);
    
    html = html.replace(/\{\{k1_value\}\}/g, configUser.OP4_k1);
    html = html.replace(/\{\{v1_value\}\}/g, configUser.OP4_v1);
    
    html = html.replace(/\{\{k2_value\}\}/g, configUser.OP4_k2);
    html = html.replace(/\{\{v2_value\}\}/g, configUser.OP4_v2);
    
    html = html.replace(/\{\{k3_value\}\}/g, configUser.OP4_k3);
    html = html.replace(/\{\{v3_value\}\}/g, configUser.OP4_v3);
    
    html = html.replace(/\{\{k4_value\}\}/g, configUser.OP4_k4);
    html = html.replace(/\{\{v4_value\}\}/g, configUser.OP4_v4);        
    
    htmlAll += html;
    
    //
    // all
    //   
        
    return htmlAll;
    
  }; // OutputGPIOSettingsExport.prototype.buildOutputGPIOSettingsHTML
  
  return OutputGPIOSettingsExport;
    
}());

module.exports = OutputGPIOSettingsExport;
