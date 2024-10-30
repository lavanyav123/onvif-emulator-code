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

var InputGPIOSettingsExport = (function () {
      
  function InputGPIOSettingsExport() {
    this.buildInputGPIOSettingsHTML();
  }
    
  InputGPIOSettingsExport.prototype.buildInputGPIOSettingsHTML = function (userSettings) {
        
    delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
    var configUser = require(process.cwd() + "/LE880userConfig.json");

    var filePath = process.cwd() + "/views/InputPort.html";
    //utils.log.info(ts()+"InputGPIOSettings.js filePath: " + filePath);
    
    var content = fs.readFileSync(filePath);
    var html	= "";
    var htmlAll = "";
       
    //
    // Reset
    //

    html = content.toString();
    //utils.log.info(ts()+"InputGPIOSettings.js content str: " + str);
        
    html = html.replace(/\{\{portNumber\}\}/g, "Reset");
    //utils.log.info(ts()+"InputGPIOSettings.js portNumber str: " + str);
    
    html = html.replace(/\{\{portLabel\}\}/g, "Reset Button");
    //utils.log.info(ts()+"InputGPIOSettings.js portLabel str: " + str);
    
    //utils.log.info(ts()+"InputGPIOSettings.js configUser.IPReset_pupd_checked: " + configUser.IPReset_pupd_checked);
    
    if(configUser.IPReset_pupd_checked == "pu"){
      html = html.replace(/\{\{pu_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{pu_checked\}\}/g, "");
    }

    if(configUser.IPReset_pupd_checked == "pd"){
      html = html.replace(/\{\{pd_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{pd_checked\}\}/g, "");
    }  
    
    if(configUser.IPReset_pupd_checked == "no"){
      html = html.replace(/\{\{no_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{no_checked\}\}/g, "");
    }
    
    //utils.log.info(ts()+"InputGPIOSettings.js configUser.IPReset_deb_checked: " + configUser.IPReset_deb_checked);
    
    if(configUser.IPReset_deb_checked == "0"){
      html = html.replace(/\{\{0_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{0_checked\}\}/g, "");
    }

    if(configUser.IPReset_deb_checked == "100"){
      html = html.replace(/\{\{100_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{100_checked\}\}/g, "");
    }  
    
    if(configUser.IPReset_deb_checked == "200"){
      html = html.replace(/\{\{200_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{200_checked\}\}/g, "");
    }  
    
    if(configUser.IPReset_deb_checked == "300"){
      html = html.replace(/\{\{300_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{300_checked\}\}/g, "");
    }  
    
    if(configUser.IPReset_deb_checked == "400"){
      html = html.replace(/\{\{400_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{400_checked\}\}/g, "");
    }    
    
    if(configUser.IPReset_deb_checked == "500"){
      html = html.replace(/\{\{500_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{500_checked\}\}/g, "");
    }      
    
    htmlAll += html;

    //
    // Input Port 1
    //

    html = content.toString();
    //utils.log.info(ts()+"InputGPIOSettings.js content str: " + str);
        
    html = html.replace(/\{\{portNumber\}\}/g, "1");
    //utils.log.info(ts()+"InputGPIOSettings.js portNumber str: " + str);
    
    html = html.replace(/\{\{portLabel\}\}/g, "Input Port 1");
    //utils.log.info(ts()+"InputGPIOSettings.js portLabel str: " + str); 
    
    //utils.log.info(ts()+"InputGPIOSettings.js configUser.IP1_pupd_checked: " + configUser.IP1_pupd_checked);
    
    if(configUser.IP1_pupd_checked == "pu"){
      html = html.replace(/\{\{pu_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{pu_checked\}\}/g, "");
    }

    if(configUser.IP1_pupd_checked == "pd"){
      html = html.replace(/\{\{pd_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{pd_checked\}\}/g, "");
    }  
    
    if(configUser.IP1_pupd_checked == "no"){
      html = html.replace(/\{\{no_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{no_checked\}\}/g, "");
    }
    
    //utils.log.info(ts()+"InputGPIOSettings.js configUser.IP1_deb_checked: " + configUser.IP1_deb_checked);
    
    if(configUser.IP1_deb_checked == "0"){
      html = html.replace(/\{\{0_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{0_checked\}\}/g, "");
    }

    if(configUser.IP1_deb_checked == "100"){
      html = html.replace(/\{\{100_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{100_checked\}\}/g, "");
    }  
    
    if(configUser.IP1_deb_checked == "200"){
      html = html.replace(/\{\{200_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{200_checked\}\}/g, "");
    }  
    
    if(configUser.IP1_deb_checked == "300"){
      html = html.replace(/\{\{300_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{300_checked\}\}/g, "");
    }  
    
    if(configUser.IP1_deb_checked == "400"){
      html = html.replace(/\{\{400_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{400_checked\}\}/g, "");
    }    
    
    if(configUser.IP1_deb_checked == "500"){
      html = html.replace(/\{\{500_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{500_checked\}\}/g, "");
    }          
    
    htmlAll += html;   
    
    //
    // Input Port 2
    //

    html = content.toString();
    //utils.log.info(ts()+"InputGPIOSettings.js content str: " + str);
        
    html = html.replace(/\{\{portNumber\}\}/g, "2");
    //utils.log.info(ts()+"InputGPIOSettings.js portNumber str: " + str);
    
    html = html.replace(/\{\{portLabel\}\}/g, "Input Port 2");
    //utils.log.info(ts()+"InputGPIOSettings.js portLabel str: " + str);  

    //utils.log.info(ts()+"InputGPIOSettings.js configUser.IP2_pupd_checked: " + configUser.IP2_pupd_checked);
    
    if(configUser.IP2_pupd_checked == "pu"){
      html = html.replace(/\{\{pu_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{pu_checked\}\}/g, "");
    }

    if(configUser.IP2_pupd_checked == "pd"){
      html = html.replace(/\{\{pd_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{pd_checked\}\}/g, "");
    }  
    
    if(configUser.IP2_pupd_checked == "no"){
      html = html.replace(/\{\{no_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{no_checked\}\}/g, "");
    }
    
    //utils.log.info(ts()+"InputGPIOSettings.js configUser.IP2_deb_checked: " + configUser.IP2_deb_checked);
    
    if(configUser.IP2_deb_checked == "0"){
      html = html.replace(/\{\{0_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{0_checked\}\}/g, "");
    }

    if(configUser.IP2_deb_checked == "100"){
      html = html.replace(/\{\{100_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{100_checked\}\}/g, "");
    }  
    
    if(configUser.IP2_deb_checked == "200"){
      html = html.replace(/\{\{200_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{200_checked\}\}/g, "");
    }  
    
    if(configUser.IP2_deb_checked == "300"){
      html = html.replace(/\{\{300_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{300_checked\}\}/g, "");
    }  
    
    if(configUser.IP2_deb_checked == "400"){
      html = html.replace(/\{\{400_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{400_checked\}\}/g, "");
    }    
    
    if(configUser.IP2_deb_checked == "500"){
      html = html.replace(/\{\{500_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{500_checked\}\}/g, "");
    }          
        
    htmlAll += html;      

    //
    // Input Port 3
    //

    html = content.toString();
    //utils.log.info(ts()+"InputGPIOSettings.js content str: " + str);
        
    html = html.replace(/\{\{portNumber\}\}/g, "3");
    //utils.log.info(ts()+"InputGPIOSettings.js portNumber str: " + str);
    
    html = html.replace(/\{\{portLabel\}\}/g, "Input Port 3");
    //utils.log.info(ts()+"InputGPIOSettings.js portLabel str: " + str);

    //utils.log.info(ts()+"InputGPIOSettings.js configUser.IP3_pupd_checked: " + configUser.IP3_pupd_checked);
    
    if(configUser.IP3_pupd_checked == "pu"){
      html = html.replace(/\{\{pu_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{pu_checked\}\}/g, "");
    }

    if(configUser.IP3_pupd_checked == "pd"){
      html = html.replace(/\{\{pd_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{pd_checked\}\}/g, "");
    }  
    
    if(configUser.IP3_pupd_checked == "no"){
      html = html.replace(/\{\{no_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{no_checked\}\}/g, "");
    }
    
    //utils.log.info(ts()+"InputGPIOSettings.js configUser.IP3_deb_checked: " + configUser.IP3_deb_checked);
    
    if(configUser.IP3_deb_checked == "0"){
      html = html.replace(/\{\{0_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{0_checked\}\}/g, "");
    }

    if(configUser.IP3_deb_checked == "100"){
      html = html.replace(/\{\{100_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{100_checked\}\}/g, "");
    }  
    
    if(configUser.IP3_deb_checked == "200"){
      html = html.replace(/\{\{200_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{200_checked\}\}/g, "");
    }  
    
    if(configUser.IP3_deb_checked == "300"){
      html = html.replace(/\{\{300_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{300_checked\}\}/g, "");
    }  
    
    if(configUser.IP3_deb_checked == "400"){
      html = html.replace(/\{\{400_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{400_checked\}\}/g, "");
    }    
    
    if(configUser.IP3_deb_checked == "500"){
      html = html.replace(/\{\{500_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{500_checked\}\}/g, "");
    }          
        
    htmlAll += html;    
    
    //
    // Input Port 4
    //
  
    html = content.toString();
    //utils.log.info(ts()+"InputGPIOSettings.js content str: " + str);
    
    html = html.replace(/\{\{portNumber\}\}/g, "4");
    //utils.log.info(ts()+"InputGPIOSettings.js portNumber str: " + str);
    
    html = html.replace(/\{\{portLabel\}\}/g, "Input Port 4");
    //utils.log.info(ts()+"InputGPIOSettings.js portLabel str: " + str); 

    //utils.log.info(ts()+"InputGPIOSettings.js configUser.IP4_pupd_checked: " + configUser.IP4_pupd_checked);
    
    if(configUser.IP4_pupd_checked == "pu"){
      html = html.replace(/\{\{pu_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{pu_checked\}\}/g, "");
    }

    if(configUser.IP4_pupd_checked == "pd"){
      html = html.replace(/\{\{pd_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{pd_checked\}\}/g, "");
    }  
    
    if(configUser.IP4_pupd_checked == "no"){
      html = html.replace(/\{\{no_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{no_checked\}\}/g, "");
    }
    
    //utils.log.info(ts()+"InputGPIOSettings.js configUser.IP4_deb_checked: " + configUser.IP4_deb_checked);
    
    if(configUser.IP4_deb_checked == "0"){
      html = html.replace(/\{\{0_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{0_checked\}\}/g, "");
    }

    if(configUser.IP4_deb_checked == "100"){
      html = html.replace(/\{\{100_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{100_checked\}\}/g, "");
    }  
    
    if(configUser.IP4_deb_checked == "200"){
      html = html.replace(/\{\{200_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{200_checked\}\}/g, "");
    }  
    
    if(configUser.IP4_deb_checked == "300"){
      html = html.replace(/\{\{300_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{300_checked\}\}/g, "");
    }  
    
    if(configUser.IP4_deb_checked == "400"){
      html = html.replace(/\{\{400_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{400_checked\}\}/g, "");
    }    
    
    if(configUser.IP4_deb_checked == "500"){
      html = html.replace(/\{\{500_checked\}\}/g, "checked");
    } else {
      html = html.replace(/\{\{500_checked\}\}/g, "");
    }     
             
    htmlAll += html;
    
    //
    // all
    //   
        
    return htmlAll;
    
  }; // InputGPIOSettingsExport.prototype.buildInputGPIOSettingsHTML
  
  return InputGPIOSettingsExport;
    
}());

module.exports = InputGPIOSettingsExport;
