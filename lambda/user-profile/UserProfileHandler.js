'use strict';

var AWS = require('aws-sdk');
var jwt = require('jsonwebtoken');
var request = require('request');
var s3 = new AWS.S3();

exports.handler = function (event, context, callback) {

    if (!event.authToken) {
        callback('Could not find authToken');
        return;
    }
    var token = event.authToken.split(' ')[1]; // contains the word Bearer before the token
    var params = {
        Bucket: process.env.PUBLIC_KEY_BUCKET_NAME,
        Key: process.env.PUBLIC_KEY_BUCKET_KEY
    };
    if (!process.env.CLIENT_SECRET) {

        console.log("grabbing public key from s3");

        s3.getObject(params, function (s3err, data) {

            if (s3err) {
                console.log(s3err, s3err.stack);
                callback(s3err);

            } else {

                jwt.verify(token, new Buffer(data.Body, 'binary'), { algorithm: 'RS256' }, function (err, decoded) {

                    if (err) {
                        console.log('Failed jwt validation: ', err, 'auth: ', event.authToken);
                        callback('Authorization Failed');
                    } else {
                        var headers = {
                            'Authorization': "Bearer " + token
                        };
                        var options = {
                            url: 'https://' + process.env.DOMAIN + '/userinfo',
                            method: 'GET',
                            json: true,
                            headers: headers
                        };
                        request(options, function (error, response, body) {
                            if (!error && response.statusCode === 200) {
                                callback(null, body);
                            } else {
                                console.log("tokeninfoerror: ", error);
								console.log("response.statusCode: ", response.statusCode);
                                callback(error);
                            }
                        });
                    }
                });
            }
        });

    } else {

        console.log("using client secret");

        jwt.verify(token, process.env.CLIENT_SECRET, { algorithm: 'HS256' }, function (err, decoded) {

            if (err) {
                console.log('Failed jwt validation: ', err, 'auth: ', event.authToken);
                callback('Authorization Failed');
            } else {
                var headers = {
                    'Authorization': "Bearer " + token
                };
                var options = {
                    url: 'https://' + process.env.DOMAIN + '/userinfo',
                    method: 'GET',
                    json: true,
                    headers: headers
                };
                request(options, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        callback(null, body);
                    } else {
                        console.log("tokeninfoerror: ", error);
                        console.log("response.statusCode: ", response.statusCode);
                        callback(error);
                    }
                });
            }
        });
    }
};


