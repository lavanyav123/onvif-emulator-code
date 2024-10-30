"use strict";
var utils_1 = require('./utils');
var soap = require('soap');

var utils = utils_1.Utils.utils;
const util = require('util'); // inspect
const xmlFormat = require('xml-formatter');

function ts(){
  return new Date().YYYYMMDDHHMMSSmmm() + " : ";
}

function ts1(){
  return new Date().YYYYMMDDHHMMSSmmm();
}

var NOT_IMPLEMENTED = {
    Fault: {
        attributes: {
            'xmlns:ter': 'http://www.onvif.org/ver10/error',
        },
        Code: {
            Value: "soap:Sender",
            Subcode: {
                Value: "ter:NotAuthorized",
            },
        },
        Reason: {
            Text: {
                attributes: {
                    'xml:lang': 'en',
                },
                $value: 'Sender not Authorized',
            }
        }
    }
};

   
var SoapService = (function () {
  
    //function SoapService(config, server) {
      
    //function SoapService(config, configUser, server) {
      
    function SoapService(config, server) {
      
	//utils.log.info(ts()+"SoapService.js function SoapService");
      
        //this.webserver = server;
	this.server = server;
	
	//utils.log.info(ts()+"SoapService.js server 1: " + util.inspect(server, {showHidden: false, depth: null}));
	
        this.config = config;
	//utils.log.info(ts()+"SoapService.js config 1: " + util.inspect(config, {showHidden: false, depth: null}));
	
	//delete require.cache[require.resolve(process.cwd() + "/LE880userConfig.json")];
	//var configUser 	= require(process.cwd() + "/LE880userConfig.json");
	//utils.log.info(ts()+"SoapService.js configUser : " + util.inspect(configUser, {showHidden: false, depth: null}));	
	//this.configUser = configUser;
	
        this.serviceInstance = null;
        this.startedCallbacks = [];
        this.isStarted = false;
        this.serviceOptions = {
            path: '',
            services: null,
            xml: null,
            wsdlPath: '',
            onReady: function () { }
        };
    }
    
    SoapService.prototype.starting = function () { };
    
    SoapService.prototype.started = function () { };
      
    SoapService.prototype.start = function () {
      
        var _this = this;
        this.starting();
	
	//utils.log.info(ts()+"SoapService.js this.server 2: " + util.inspect(this.server, {showHidden: false, depth: null}));
	//this.config = config;
	//utils.log.info(ts()+"SoapService.js start this.config 2: " + util.inspect(this.config, {showHidden: false, depth: null}));
	
        utils.log.info(ts()+"SoapService.js start Binding %s to " + this.config.OnvifHTTPorHTTPS + "://%s:%s%s", this.constructor.name, utils.getIpAddress(), this.config.OnvifServicePort, this.serviceOptions.path);
        
	var onReady = this.serviceOptions.onReady;
        this.serviceOptions.onReady = function () {
	  
	    utils.log.info(ts()+"SoapService.js onReady");
            
	    _this._started();
            onReady();
        };
	
	//utils.log.info(ts()+"SoapService.js this.server 3: " + this.server);
	
        //this.serviceInstance = soap.listen(this.webserver, this.serviceOptions);
	this.serviceInstance = soap.listen(this.server, this.serviceOptions);
	
        this.serviceInstance.on('headers', function (headers, methodName) {
            if (methodName === "GetSystemDateAndTime")
                return;
		
            //if (_this.config.Username) {
	    if (_this.config.RTSPUsername) {

        delete require.cache[require.resolve("/home/pi/LE880-Profile-T/LE880factoryConfig.json")];
		var credentials = require("/home/pi/LE880-Profile-T/LE880factoryConfig.json");
        	      
                var token = headers.Security.UsernameToken;
		
                var user = token.Username;
		utils.log.debug(ts()+"SoapService.js user: " + user);
		
                var password = (token.Password.$value || token.Password);
		utils.log.debug(ts()+"SoapService.js password: " + password);
		
                var nonce = (token.Nonce.$value || token.Nonce);
                var created = token.Created;


                //var onvif_username = _this.config.Username;
		var onvif_username = credentials.RTSPUsername;
        utils.log.debug(ts()+"SoapService.js onvif_username: " + onvif_username);   
		
                //var onvif_password = _this.config.Password;
		var onvif_password = credentials.RTSPPassword;
                utils.log.debug(ts()+"SoapService.js onvif_password: " + onvif_password);     
		
                var crypto = require('crypto');
                var pwHash = crypto.createHash('sha1');
                var rawNonce = new Buffer.from(nonce || '', 'base64');
                var combined_data = Buffer.concat([rawNonce,
                    Buffer.from(created, 'ascii'), Buffer.from(onvif_password, 'ascii')]);
                pwHash.update(combined_data);
                var generated_password = pwHash.digest('base64');
                utils.log.debug(ts()+"SoapService.js generated_password: " + generated_password);      
                var password_ok = (user === onvif_username && password === generated_password);
                if (password_ok == false) {
                    utils.log.info(ts()+'SoapService.js Invalid username/password with ' + methodName);
                    throw NOT_IMPLEMENTED;
                } else {
		    utils.log.info(ts()+'SoapService.js Valid username/password with ' + methodName);
		}
            }
            ;
        });
	
        this.serviceInstance.on("request", function (request, methodName) {
            utils.log.info(ts()+'SoapService.js %s received request %s', _this.constructor.name, methodName);
        });
	
        this.serviceInstance.log = function (type, data) {
	  
            //if (_this.config.logSoapCalls){
	    if (_this.config.logSoapCalls == "true"){
	      
	      if(type =="info"){
		
		  utils.log.info(ts()+'SoapService.js %s - Calltype : %s, data : %s', _this.constructor.name, type, data);
		  
	      } else {
		
		  //utils.log.debug(ts()+'SoapService.js %s - Calltype : \n%s, data : %s\n', _this.constructor.name, type, data);
		  
		  if(data){  // data is object NOT xml
		    
		    try {
		      
		      utils.log.debug(ts()+'SoapService.js if(data) %s - Calltype : %s, try data :\n\n%s\n\n', _this.constructor.name, type, util.inspect(data, {showHidden: false, depth: null}));
		    
		    }
		    catch(err) {
		      
		      utils.log.debug(ts()+'SoapService.js if(data) err: %s\n%s - Calltype : %s, catch data :\n\n%s\n\n', err, _this.constructor.name, type, data.toString());
		    
		    }
		    
		  }		  
		  
	      }
	      
	    }
        };
    };
    SoapService.prototype.onStarted = function (callback) {
        if (this.isStarted)
            callback();
        else
            this.startedCallbacks.push(callback);
    };
    SoapService.prototype._started = function () {
        this.isStarted = true;
        for (var _i = 0, _a = this.startedCallbacks; _i < _a.length; _i++) {
            var callback = _a[_i];
            callback();
        }
        this.startedCallbacks = [];
        this.started();
    };
    
    return SoapService;
    
}());

module.exports = SoapService;

