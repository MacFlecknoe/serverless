'use strict';

var aws = require('aws-sdk');
var async = require('async');
var crypto = require('crypto');
var winston = require('winston');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            handleExceptions: false,
            json: false,
            level: process.env.NODE_LOGGING_LEVEL || 'info'
        })
    ]
});
function createResponse(code, result) {
    var response = {
        'statusCode': code,
        'headers': { 'Access-Control-Allow-Origin': '*' },
        'body': JSON.stringify(result)
    }
    return response;
}

function base64Encode(value) {
    return new Buffer(value).toString('base64');
}

function generateExpirationDate() {
    var currentDate = new Date();
    currentDate = currentDate.setDate(currentDate.getDate() + 1);
    return new Date(currentDate).toISOString();
}

function generatePolicyDocument(filename, next) {
    var directory = crypto.randomBytes(20).toString('hex'); // avoid collisions
    var key = directory + '/' + filename;
    var expirationDate = generateExpirationDate();

    var policy = {
        'expiration': expirationDate,
        'conditions': [
            {
                'key': key
            },
            {
                'bucket': process.env.UPLOAD_BUCKET
            },
            {
                'acl': 'private'
            }
            ['starts-with', '$Content-Type', '']
        ]
    };
    next(null, key, policy);
}

function encode(key, policy, next) {
    var encoding = base64Encode(JSON.stringify(policy)).replace('\n', '');
    next(null, key, policy, encoding);
}

function sign(key, policy, encoding, next) {
    var signature = crypto.createHmac('sha1', process.env.SECRET_ACCESS_KEY).update(encoding).digest('base64');
    next(null, key, policy, encoding, signature);
}

exports.handler = function (event, context, callback) {
    var filename = null;
    var that = this;

    if (event.queryStringParameters && event.queryStringParameters.filename) {
        filename = decodeURIComponent(event.queryStringParameters.filename);
    } else {
        callback(null, createResponse(400, 'filename not provided'));
        return;
    }
    async.waterfall([async.apply(generatePolicyDocument, filename), encode, sign],
        function (err, key, policy, encoding, signature) {
            
            if (err) {
                callback(null, createResponse(500, err));
            } else {
                var result = {
                    'signature': signature,
                    'encoded_policy': encoding,
                    'access_key': process.env.ACCESS_KEY,
                    'upload_url': process.env.UPLOAD_URI + '/' + process.env.UPLOAD_BUCKET,
                    'key': key
                }
            }
            callback(null, createResponse(200, result));
        }
    );
}