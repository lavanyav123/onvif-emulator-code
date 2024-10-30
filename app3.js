const express = require('express');
const soap = require('soap');
const DeviceService = require('./services/device_service'); // Assuming it handles config and WSDL path internally
const utils = require('./lib/utils'); // Assuming utils for logging

const app = express();

// Log the start of the emulator
console.log("Starting ONVIF Device Emulator...");

// Initialize the DeviceService (config is handled inside device_service.js)
let deviceService = new DeviceService(app, (event, data) => {
    console.log(`Callback event: ${event}, Data: ${JSON.stringify(data)}`);
});

// SOAP options provided by the device_service.js
const soapOptions = {
    path: deviceService.serviceOptions.path,
    xml: deviceService.serviceOptions.xml
};
//console.log(soapOptions.xml,soapOptions.path)

// Initialize the SOAP server using soap.listen()
/*soap.listen(app, soapOptions.path, deviceService.serviceOptions.services, soapOptions.xml, function () {
    console.log(`SOAP service initialized at path: ${soapOptions.path}`);
});
*/
// Start the server using the port from deviceService (assumed from device_service.js config)
const PORT =  8080;
//const PORT = deviceService.config.OnvifServicePort || 8080;
app.listen(PORT, () => {
    console.log(`ONVIF Device Emulator running at http://192.168.10.116:${PORT}`);
});

