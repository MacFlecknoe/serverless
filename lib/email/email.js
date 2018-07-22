'use strict';

var aws = require('aws-sdk');
var async = require('async');

var ses = new aws.SES();

function createMessage(toList, fromEmail, subject, message, next) {
    var params = ({
        Source: fromEmail,
        Destination: {
            ToAddresses: toList
        },
        Message: {
            Subject: {
                Data: subject
            },
            Body: {
                Text: {
                    Data: message
                }
            }
        }
    });
    next(null, params);
}

function dispatch(params, next) {
    ses.sendEmail(params, function (err, data) {
        if (err) {
            next(err);
        } else {
            next(null, data);
        }
    })
}

exports.send = function(toList, fromEmail, subject, message) {
    async.waterfall([createMessage.bind(this, toList, fromEmail, subject, message), dispatch], function (err, result) {
        if (err) {
            console.log('Error sending email', err);
        } else {
            console.log('Email sent successfully', result);
        }
    });
}
