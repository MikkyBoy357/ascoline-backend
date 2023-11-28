const https = require('https');

// Function to send SMS using FasterMessage API
const sendSMS = (to, message) => {
    const postData = JSON.stringify({
        'from': 'FASTERMSG',
        'to': to,
        'text': message
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
