"use strict";

// Required modules
const express = require('express');
const fs = require('fs');
const soap = require('soap');
const ip = require('ip');
const path = require('path');
const utils = require('./lib/utils'); // Assume you have a utils module for logging, etc.

// Import the device and media service logic
const DeviceService = require('./services/device_service');
//const MediaService = require('./services/media_service');

// Create an Express application
const app = express();
const PORT = 8080;  // Set the port for the emulator

// Load emulator configuration
const config = JSON.parse(fs.readFileSync('./config/LE880factoryConfig.json', 'utf8'));

// Callback function for handling events like relay changes
function deviceCallback(event, data) {
    console.log(`${event} triggered with data:`, data);
}

// Initialize the Device and Media services
const deviceService = new DeviceService(config, app, deviceCallback);
//const mediaService = new MediaService(config, app);

// Serve WSDL files for ONVIF services
app.get('/wsdl/:service', (req, res) => {
    const wsdlFile = path.join(__dirname, 'wsdl', `${req.params.service}.wsdl`);
    res.sendFile(wsdlFile);
});

// SOAP service routes
/*const soapOptions = {
    path: '/onvif/device_service',
    services: deviceService.serviceOptions.services,
    xml: fs.readFileSync('./wsdl/device_service.wsdl', 'utf8'),
    wsdlPath: 'wsdl/device_service.wsdl',
    onReady: () => console.log('Device service is ready on /onvif/device_service')
};
*/

app.listen(PORT, () => {
    console.log(`ONVIF Device Emulator running at http://${ip.address()}:${PORT}`);
    
    // Create SOAP server for device management
    soap.listen(app, soapOptions.path, deviceService.serviceOptions.services);
    
    // Create SOAP server for media service
    //soap.listen(app, '/onvif/media_service', mediaService.serviceOptions.services, mediaService.serviceOptions.xml);
});

