"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

function ts(){
  //return new Date().YYYYMMDDHHMMSSmmm() + " : ";
  let now = new Date();
  
  let year = now.getFullYear();
  let month = ('0' + (now.getMonth() + 1)).slice(-2); // getMonth() is zero-based
  let day = ('0' + now.getDate()).slice(-2);
  let hours = ('0' + now.getHours()).slice(-2);
  let minutes = ('0' + now.getMinutes()).slice(-2);
  let seconds = ('0' + now.getSeconds()).slice(-2);
  let milliseconds = ('00' + now.getMilliseconds()).slice(-3);

  return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds} : `;
}

function ts1(){
  return new Date().YYYYMMDDHHMMSSmmm();
}

var fs = require("fs");
var os = require('os');
var credentials = require("/home/deltlo36/onvif-emulator/config/LE880factoryConfig.json");
var SoapService = require('../lib/SoapService');
var utils_1 = require('../lib/utils');
var ip = require('ip');
var utils = utils_1.Utils.utils;

var DeviceService = (function (_super) {
    __extends(DeviceService, _super);
    
    function DeviceService(config, server, callback) {
      
    //function DeviceService(config, configUser, server, callback) {
      
    //function DeviceService(config, configUser, server) {
      
	utils.log.info(ts()+"device_service.js function DeviceService");
	
        _super.call(this, config, server);
	
	//_super.call(this, config, configUser, server);
	
        this.device_service = require('./stubs/device_service.js').DeviceService;
	
        this.callback = callback;
	
        this.serviceOptions = {
	  
            path: '/onvif/device_service',
            services: this.device_service,
            xml: fs.readFileSync('./wsdl/device_service.wsdl', 'utf8'),
            wsdlPath: 'wsdl/device_service.wsdl',
            
	    //onReady: function () { return console.log(ts()+'device_service.js device_service started'); }
	    onReady: function () { 
	      return utils.log.info(ts()+'device_service.js onReady');
	    }
	    
        };
	
        this.extendService();
    }
    
    DeviceService.prototype.extendService = function () {
      
        var _this = this;
	
        var port = this.device_service.DeviceService.Device;
	
        port.GetDeviceInformation = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.GetDeviceInformation");
	    
            var GetDeviceInformationResponse = {
	      
                Manufacturer: _this.config.DeviceInformation.Manufacturer,
                Model: _this.config.DeviceInformation.Model,
                FirmwareVersion: _this.config.DeviceInformation.FirmwareVersion,
                SerialNumber: _this.config.DeviceInformation.SerialNumber,
                HardwareId: _this.config.DeviceInformation.HardwareId
		
            };
            return GetDeviceInformationResponse;
        };
	
        port.GetSystemDateAndTime = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.GetSystemDateAndTime");
	    
            var now = new Date();
            var offset = now.getTimezoneOffset();
            var abs_offset = Math.abs(offset);
            var hrs_offset = Math.floor(abs_offset / 60);
            var mins_offset = (abs_offset % 60);
            var tz = "UTC" + (offset < 0 ? '-' : '+') + hrs_offset + (mins_offset === 0 ? '' : ':' + mins_offset);
            var GetSystemDateAndTimeResponse = {
                SystemDateAndTime: {
                    DateTimeType: "NTP",
                    DaylightSavings: now.dst(),
                    TimeZone: {
                        TZ: tz
                    },
                    UTCDateTime: {
                        Time: { Hour: now.getUTCHours(), Minute: now.getUTCMinutes(), Second: now.getUTCSeconds() },
                        Date: { Year: now.getUTCFullYear(), Month: now.getUTCMonth() + 1, Day: now.getUTCDate() }
                    },
                    LocalDateTime: {
                        Time: { Hour: now.getHours(), Minute: now.getMinutes(), Second: now.getSeconds() },
                        Date: { Year: now.getFullYear(), Month: now.getMonth() + 1, Day: now.getDate() }
                    },
                    Extension: {}
                }
            };
            return GetSystemDateAndTimeResponse;
        };
	
        port.SetSystemDateAndTime = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.SetSystemDateAndTime");
	    
            var SetSystemDateAndTimeResponse = {};
            return SetSystemDateAndTimeResponse;
        };
	
        port.SystemReboot = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.SystemReboot");
	    
            var SystemRebootResponse = {
                Message: utils.execSync("sudo reboot")
            };
            return SystemRebootResponse;
        };
	
        port.GetServices = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.GetServices");
	    
            var GetServicesResponse = {
	      
                Service: [
                    {
                        Namespace: "http://www.onvif.org/ver10/device/wsdl",
                        XAddr: "http://" + utils.getIpAddress() + ":" + _this.config.OnvifServicePort + "/onvif/device_service",
                        Version: {
                            Major: 2,
                            Minor: 5,
                        }
                    },
		    
		    /*
                    {
                        Namespace: "http://www.onvif.org/ver20/imaging/wsdl",
                        XAddr: "http://" + utils.getIpAddress() + ":" + _this.config.OnvifServicePort + "/onvif/imaging_service",
                        Version: {
                            Major: 2,
                            Minor: 5,
                        }
                    },
		    */
		    
                    {
                        Namespace: "http://www.onvif.org/ver10/media/wsdl",
                        XAddr: "http://" + utils.getIpAddress() + ":" + _this.config.OnvifServicePort + "/onvif/media_service",
                        Version: {
                            Major: 2,
                            Minor: 5,
                        }
                    },
		    
                     {
                        Namespace: "http://www.onvif.org/ver10/events/wsdl",
                        XAddr: "http://" + utils.getIpAddress() + ":" + _this.config.OnvifServicePort + "/onvif/events_service",
                        Version: {
                            Major: 2,
                            Minor: 5,
                        }
                    }		    
		    
		    /*
                    {
                        Namespace: "http://www.onvif.org/ver20/ptz/wsdl",
                        XAddr: "http://" + utils.getIpAddress() + ":" + _this.config.OnvifServicePort + "/onvif/ptz_service",
                        Version: {
                            Major: 2,
                            Minor: 5,
                        },
                    }
		    */
		    ]
            };
            return GetServicesResponse;
        };
	
        port.GetCapabilities = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.GetCapabilities");	    
	    
            var category = args.Category;
            var GetCapabilitiesResponse = {
                Capabilities: {}
            };
            if (category === undefined || category == "All" || category == "Device") {
                GetCapabilitiesResponse.Capabilities["Device"] = {
                    XAddr: "http://" + utils.getIpAddress() + ":" + _this.config.OnvifServicePort + "/onvif/device_service",
                    Network: {
                        IPFilter: false,
                        ZeroConfiguration: false,
                        IPVersion6: false,
                        DynDNS: false,
                        Extension: {
                            Dot11Configuration: false,
                            Extension: {}
                        }
                    },
                    System: {
                        DiscoveryResolve: false,
                        DiscoveryBye: false,
                        RemoteDiscovery: false,
                        SystemBackup: false,
                        SystemLogging: false,
                        FirmwareUpgrade: false,
                        SupportedVersions: {
                            Major: 2,
                            Minor: 5
                        },
                        Extension: {
                            HttpFirmwareUpgrade: false,
                            HttpSystemBackup: false,
                            HttpSystemLogging: false,
                            HttpSupportInformation: false,
                            Extension: {}
                        }
                    },
                    IO: {
                        InputConnectors: 0,
			
                        //RelayOutputs: 1,
			RelayOutputs: 0,
			
                        Extension: {
                            Auxiliary: false,
                            AuxiliaryCommands: "",
                            Extension: {}
                        }
                    },
                    Security: {
                        "TLS1.1": false,
                        "TLS1.2": false,
                        OnboardKeyGeneration: false,
                        AccessPolicyConfig: false,
                        "X.509Token": false,
                        SAMLToken: false,
                        KerberosToken: false,
                        RELToken: false,
                        Extension: {
                            "TLS1.0": false,
                            Extension: {
                                Dot1X: false,
                                RemoteUserHandling: false
                            }
                        }
                    },
                    Extension: {}
                };
            }
            
	    //
	    // do NOT send GetCapabilitiesResponse.Capabilities["Events"] unless it is implemented
	    //
	    
	    /*
	    if (category == undefined || category == "All" || category == "Events") {

		
                GetCapabilitiesResponse.Capabilities["Events"] = {
		  
		    //XAddr: "http://" + utils.getIpAddress() + ":" + _this.config.OnvifServicePort + "/onvif/events_service"
		  
                    XAddr: "http://" + utils.getIpAddress() + ":" + _this.config.OnvifServicePort + "/onvif/events_service",
		    
                    WSSubscriptionPolicySupport: false,
                    WSPullPointSupport: false,
                    WSPausableSubscriptionManagerInterfaceSupport: false
		    
                };
            }
	    */
	    
	    
	    /*
            if (category === undefined || category == "All" || category == "Imaging") {
                GetCapabilitiesResponse.Capabilities["Imaging"] = {
                    XAddr: "http://" + utils.getIpAddress() + ":" + _this.config.OnvifServicePort + "/onvif/imaging_service"
                };
            }
	    */
	    
	    
            if (category === undefined || category == "All" || category == "Media") {
                GetCapabilitiesResponse.Capabilities["Media"] = {
                    XAddr: "http://" + utils.getIpAddress() + ":" + _this.config.OnvifServicePort + "/onvif/media_service",
                    StreamingCapabilities: {
                        RTPMulticast: _this.config.MulticastEnabled,
			
                        RTP_TCP: true,
                        RTP_RTSP_TCP: true,
			
                        Extension: {}
                    },
                    Extension: {
                        ProfileCapabilities: {
                            MaximumNumberOfProfiles: 1
                        }
                    }
                };
            }
	    
	    /*
            if (category === undefined || category == "All" || category == "PTZ") {
                GetCapabilitiesResponse.Capabilities["PTZ"] = {
                    XAddr: "http://" + utils.getIpAddress() + ":" + _this.config.OnvifServicePort + "/onvif/ptz_service"
                };
            }
            */
	    
	    return GetCapabilitiesResponse;
        };
	
        port.GetHostname = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.GetHostname");
	    
            var GetHostnameResponse = {
                HostnameInformation: {
                    FromDHCP: false,
                    Name: os.hostname(),
                    Extension: {}
                }
            };
            return GetHostnameResponse;
        };
	
        port.SetHostname = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.SetHostname");
	    
            var SetHostnameResponse = {};
            return SetHostnameResponse;
        };
	
        port.SetHostnameFromDHCP = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.SetHostnameFromDHCP");
	    
            var SetHostnameFromDHCPResponse = {
                RebootNeeded: false
            };
            return SetHostnameFromDHCPResponse;
        };
	
        port.GetScopes = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.GetScopes");
	    
            var GetScopesResponse = { Scopes: [] };
            GetScopesResponse.Scopes.push({
                ScopeDef: "Fixed",
                ScopeItem: "onvif://www.onvif.org/location/unknow"
            });
            GetScopesResponse.Scopes.push({
                ScopeDef: "Fixed",
                ScopeItem: ("onvif://www.onvif.org/hardware/" + _this.config.DeviceInformation.Model)
            });
            GetScopesResponse.Scopes.push({
                ScopeDef: "Fixed",
                ScopeItem: ("onvif://www.onvif.org/name/" + _this.config.DeviceInformation.Manufacturer)
            });
            return GetScopesResponse;
        };
	
        port.GetServiceCapabilities = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.GetServiceCapabilities");
	    
            var GetServiceCapabilitiesResponse = {
                Capabilities: {
                    Network: {
                        attributes: {
                            IPFilter: false,
                            ZeroConfiguration: false,
                            IPVersion6: false,
                            DynDNS: false,
                            Dot11Configuration: false,
                            Dot1XConfigurations: 0,
                            HostnameFromDHCP: false,
                            NTP: 0,
                            DHCPv6: false
                        }
                    },
                    Security: {
                        attributes: {
                            "TLS1.0": false,
                            "TLS1.1": false,
                            "TLS1.2": false,
                            OnboardKeyGeneration: false,
                            AccessPolicyConfig: false,
                            DefaultAccessPolicy: false,
                            Dot1X: false,
                            RemoteUserHandling: false,
                            "X.509Token": false,
                            SAMLToken: false,
                            KerberosToken: false,
                            UsernameToken: false,
                            HttpDigest: false,
                            RELToken: false,
                            SupportedEAPMethods: 0,
                            MaxUsers: 1,
                            MaxUserNameLength: 10,
                            MaxPasswordLength: 256
                        }
                    },
                    System: {
                        attributes: {
                            DiscoveryResolve: false,
                            DiscoveryBye: false,
                            RemoteDiscovery: false,
                            SystemBackup: false,
                            SystemLogging: false,
                            FirmwareUpgrade: false,
                            HttpFirmwareUpgrade: false,
                            HttpSystemBackup: false,
                            HttpSystemLogging: false,
                            HttpSupportInformation: false,
                            StorageConfiguration: false
                        }
                    },
                }
            };
            return GetServiceCapabilitiesResponse;
        };
	
        port.GetNTP = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.GetNTP");
	    
            var GetNTPResponse = {};
            return GetNTPResponse;
        };
	
        port.SetNTP = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.SetNTP");
	    
            var SetNTPResponse = {};
            return SetNTPResponse;
        };
	
        port.GetNetworkInterfaces = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.GetNetworkInterfaces");
	    
            var GetNetworkInterfacesResponse = {
                NetworkInterfaces: []
            };
            var nwifs = os.networkInterfaces();
            for (var nwif in nwifs) {
                for (var addr in nwifs[nwif]) {
                    if (nwifs[nwif][addr].family === 'IPv4' && nwif !== 'lo0' && nwif !== 'lo') {
                        var mac = (nwifs[nwif][addr].mac).replace(/:/g, '-');
                        var ipv4_addr = nwifs[nwif][addr].address;
                        var netmask = nwifs[nwif][addr].netmask;
                        var prefix_len = ip.subnet(ipv4_addr, netmask).subnetMaskLength;
                        GetNetworkInterfacesResponse.NetworkInterfaces.push({
                            attributes: {
                                token: nwif
                            },
                            Enabled: true,
                            Info: {
                                Name: nwif,
                                HwAddress: mac,
                                MTU: 1500
                            },
                            IPv4: {
                                Enabled: true,
                                Config: {
                                    Manual: {
                                        Address: ipv4_addr,
                                        PrefixLength: prefix_len
                                    },
                                    DHCP: false
                                }
                            }
                        });
                    }
                }
            }
            return GetNetworkInterfacesResponse;
        };
	
        port.GetNetworkProtocols = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.GetNetworkProtocols");
	    
            var GetNetworkProtocolsResponse = {
                NetworkProtocols: [{
                        Name: "RTSP",
                        Enabled: true,
                        Port: _this.config.RTSPPort
                    }]
            };
            return GetNetworkProtocolsResponse;
        };
	
        port.GetRelayOutputs = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.GetRelayOutputs");
	  
            var GetRelayOutputsResponse = {
                RelayOutputs: [{
                        attributes: {
                            token: "relay1"
                        },
                        Properties: {
                            Mode: "Bistable",
                            IdleState: "open"
                        }
                    }]
            };
            return GetRelayOutputsResponse;
        };
	
        port.SetRelayOutputState = function (args) {
	  
	    utils.log.info(ts()+"device_service.js port.SetRelayOutputState");
	    
            var SetRelayOutputStateResponse = {};
            if (_this.callback) {
                if (args.LogicalState === 'active')
                    _this.callback('relayactive', { name: args.RelayOutputToken });
                if (args.LogicalState === 'inactive')
                    _this.callback('relayinactive', { name: args.RelayOutputToken });
            }
            return SetRelayOutputStateResponse;
        };
	
        port.GetUsers = function (args) {
	  
            utils.log.info(ts()+"device_service.js port.GetUsers");
            
                var GetUsersResponse = {
                    User: [{
                        Username: credentials.RTSPUsername,
                        Password: credentials.RTSPPassword,
                        UserLevel: "administrator"
                    }]
                };
                return GetUsersResponse;
            };
            port.SetUser = function (args) {
          
                utils.log.info(ts()+"device_service.js port.SetUser");
                
                    var SetUserResponse = { User: {
                        Username: credentials.RTSPUsername,
                        Password: credentials.RTSPPassword,
                        UserLevel: "administrator"
                    }
                };
                    return SetUserResponse;
                }; 
    };
    
    return DeviceService;
    
}(SoapService));

module.exports = DeviceService;

