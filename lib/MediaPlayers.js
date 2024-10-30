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

var MediaPlayersExport = (function () {
      
  function MediaPlayersExport(userSettings) {
    this.buildMediaPlayersHTML(userSettings);
  }
    
  MediaPlayersExport.prototype.buildMediaPlayersHTML = function (userSettings) {
        
    delete require.cache[require.resolve("../public/ajax/userSettings.json")];
    var userSettings = require("../public/ajax/userSettings.json");

    var filePath = process.cwd() + "/views/MediaPlayers.html";
    //utils.log.info(ts()+"MediaPlayers.js filePath: " + filePath);
    
    var content = fs.readFileSync(filePath);
    //utils.log.info(ts()+"MediaPlayers.js content: " + content);
    
    var html = content.toString();

    html = html.replace('{{MediaPlayersHTML}}', content);
    
    return html;
    
  }; // MediaPlayersExport.prototype.buildMediaPlayersHTML
  
  return MediaPlayersExport;
    
}());

module.exports = MediaPlayersExport;
