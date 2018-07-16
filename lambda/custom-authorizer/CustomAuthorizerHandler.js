'use strict';

var AWS = require('aws-sdk');
var jwt = require('jsonwebtoken');
var request = require('request');
var s3 = new AWS.S3();

var generatePolicy = function (principalId, effect, resource) {

    var authResponse = {};
    authResponse.principalId = principalId;

    if (effect && resource) {

        var statementOne = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = resource;

        var policyDocument = {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        policyDocument.Statement[0] = statementOne;

        authResponse.policyDocument = policyDocument;
    }
    return authResponse;
};

var authorizeMethod = function (token, secretOrPublicKey, verifyOptions, methodArn, callback) {

    jwt.verify(token, secretOrPublicKey, verifyOptions, function (err, decoded) {
        if (err) {
            console.log('Failed jwt validation: ', err, 'token: ', token);
            callback('Authorization Failed');
        } else {
            callback(null, generatePolicy('user', 'allow', methodArn));
        }
    });
};

exports.handler = function (event, context, callback) {

    console.log('Auth token: ' + event.authorizationToken);
    console.log('Method ARN: ' + event.methodArn);
    console.log('Context', context);

    if (!event.authorizationToken) {
        callback('Could not find authToken');
        return;
    }
    var token = event.authorizationToken.split(' ')[1]; // contains the word Bearer before the token

    if (!process.env.CLIENT_SECRET) {

        console.log("grabbing public key from s3");

        var params = {
            Bucket: process.env.PUBLIC_KEY_BUCKET_NAME,
            Key: process.env.PUBLIC_KEY_BUCKET_KEY
        };
        s3.getObject(params, function (s3err, data) {

            if (s3err) {
                console.log(s3err, s3err.stack);
                callback(s3err);

            } else {
                authorizeMethod(token, new Buffer(data.Body, 'binary'), { algorithm: 'RS256' }, event.methodArn, callback);
            }
        });

    } else {
        console.log("using client secret");
        authorizeMethod(token, process.env.CLIENT_SECRET, { algorithm: 'HS256' }, event.methodArn, callback);
    }
};


