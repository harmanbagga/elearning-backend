const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendSessionInvite = (email,subject, body) => {
    sgMail.send({
        to: email,
        from: process.env.SENDGRID_EMAIL_FROM,
        subject: subject,
        html: body
    }).then(() => {
        console.log('Email sent')
    })
    .catch((error) => {
        console.error(error)
    })
}

/*
const sendSessionInviteWithTemplate = (email,subject, params) => {
    sgMail.send({
        to: email,
        from: 'mikedutuandu@gmail.com',
        subject: subject,
        template_id: 'd-128e110d98e040c6b81f4694d04e0572',
        dynamic_template_data: {
            "name": 'Test',
            "club_name": 'VTR School',
        },
    }).then(() => {
        console.log('Email sent')
    })
        .catch((error) => {
            console.error(error)
        })
}
*/

module.exports = {
    sendSessionInvite,
    // sendSessionInviteWithTemplate
}