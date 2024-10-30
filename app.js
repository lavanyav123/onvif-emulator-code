const express = require('express');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');

const app = express();
const port = 8080;

// Middleware to parse the body of POST requests
app.use(bodyParser.text({ type: 'application/soap+xml' }));

// Basic route for ONVIF Device Management Service
app.post('/onvif/device_service', (req, res) => {
    const soapRequest = req.body;

    // Parse the incoming SOAP request
    xml2js.parseString(soapRequest, { explicitArray: false }, (err, result) => {
        if (err) {
            res.status(500).send('Error parsing XML');
            return;
        }

        // Check the action being requested
        const action = result['soapenv:Envelope']['soapenv:Body'];

        if (action['GetDeviceInformation']) {
            // Respond with a valid GetDeviceInformation response
            const responseXml = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
                <soapenv:Body>
                    <GetDeviceInformationResponse xmlns="http://www.onvif.org/ver10/device/wsdl">
                        <Manufacturer>Emulated Manufacturer</Manufacturer>
                        <Model>Emulated Model</Model>
                        <FirmwareVersion>1.0</FirmwareVersion>
                        <SerialNumber>123456789</SerialNumber>
                        <HardwareId>HW12345</HardwareId>
                    </GetDeviceInformationResponse>
                </soapenv:Body>
            </soapenv:Envelope>`;

            res.set('Content-Type', 'application/soap+xml');
            res.send(responseXml);
        } else if (action['GetSystemDateAndTime']) {
            // Respond with system date and time
            const responseXml = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
                <soapenv:Body>
                    <GetSystemDateAndTimeResponse xmlns="http://www.onvif.org/ver10/device/wsdl">
                        <SystemDateAndTime>
                            <UTCDateTime>
                                <Time>${new Date().toISOString()}</Time>
                            </UTCDateTime>
                            <TimeZone>
                                <TZ>UTC</TZ>
                            </TimeZone>
                        </SystemDateAndTime>
                    </GetSystemDateAndTimeResponse>
                </soapenv:Body>
            </soapenv:Envelope>`;

            res.set('Content-Type', 'application/soap+xml');
            res.send(responseXml);
        } else {
            res.status(400).send('Unsupported action');
        }
    });
});

// Start the Express server
app.listen(port, () => {
    console.log(`ONVIF Emulator running on port ${port}`);
});

