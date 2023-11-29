const https = require('https');

// Function to send SMS using FasterMessage API
const sendSMS = (to, message) => {
    
    console.log(`To => ${to}`)
    console.log(`Message => ${message}`)
    var postData = JSON.stringify({
        "from": 'FASTER', // Example 'from' field (less than 11 characters)
        "to": to, // The 'to' field (phone number) you want to send the SMS to
        "text": message // The SMS message content
    });

    const basicAuth = Buffer.from('mikkyboy:mikkyboy').toString('base64');

    const options = {
        hostname: 'api.fastermessage.com',
        path: '/v1/sms/send',
        method: 'POST',
        headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    const req = https.request(options, (resp) => {
        let result = Buffer.alloc(0);
        resp.on('data', (chunk) => {
            result = Buffer.concat([result, chunk]);
        });
        resp.on('end', () => {
            console.log(result.toString()); // Log the response from FasterMessage API
        });
    });

    req.on('error', (error) => {
        console.error('Error occurred:', error);
    });

    req.write(postData);
    req.end();
};

module.exports = { sendSMS };
