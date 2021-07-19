const AWS = require('aws-sdk');


AWS.config.update({
    accessKeyId: process.env.AWS_SES_KEY,
    secretAccessKey: process.env.AWS_SES_SECRET,
    region: process.env.AWS_SES_REGION
});

const ses = new AWS.SES({apiVersion: '2010-12-01'});

const sendEmail = (to, subject, message, from) => {
    const params = {
        Destination: {
            ToAddresses: [to]
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: message
                },
                /* replace Html attribute with the following if you want to send plain text emails.
                Text: {
                    Charset: "UTF-8",
                    Data: message
                }
             */
            },
            Subject: {
                Charset: 'UTF-8',
                Data: subject
            }
        },
        ReturnPath: from ? from : "<noreply@example.com>",
        Source: from ? from : "<noreply@example.com>",
    };

    ses.sendEmail(params, (err, data) => {
        if (err) {
            return console.log(err, err.stack);
        } else {
            console.log("Email sent.", data);
        }
    });
};

module.exports = {sendEmail};