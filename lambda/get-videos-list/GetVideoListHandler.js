'use strict'

var aws = require('aws-sdk');
var async = require('async');
var winston = require('winston');
var email = require('@macflecknoe/email');

var s3 = new aws.S3();

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            handleExceptions: false,
            json: false,
            level: process.env.NODE_LOGGING_LEVEL || 'info'
        })
    ]
});
if (process.env.AWS_LAMBDA_FUNCTION_NAME === undefined) {
    logger.cli();
}

function createBucketParams(next) {
   console.log("createBucketParams");
    logger.log('info','createBucketParams');
    var params = {
        Bucket: process.env.BUCKET,
        EncodingType: 'url'
    };
    next(null, params);
}

function getVideoFilesFromBucket(params, next) {
    console.log("getVideoFilesFromBucket:", params);
    logger.log('info','getVideoFilesFromBucket: %s', params);
    s3.listObjects(params, function (err, files) {
        if (err) {
            console.log("here :-(", err);
            next(err);
        } else {
            console.log("here!");
            next(null, files);
        }
    });
}

function createFileList(files, next) {
    console.log("createFileList:", files);
    logger.log('info', 'createFileList: %s', files);
    var urls = [];
    for (var i = 0; i < files.Contents.length; i++) {
        var file = files.Contents[i];
        if (file.Key && file.Key.substr(-3, 3) === 'mp4') { // only grab videos
            urls.push(file);
        }
    }
    var result = {
        baseUrl: process.env.BASE_URL,
        bucket: process.env.BUCKET,
        urls: urls
    };
    next(null, result);
}

exports.handler = function (event, context, callback) {
    console.log("here");
    logger.log('info', 'here');
    async.waterfall([createBucketParams, getVideoFilesFromBucket, createFileList], function (err, result) {
        if (err) {
            callback(err);
        } else {
			email.send(['macflecknoe@gmail.com'], 'macflecknoe@gmail.com', 'sucessful lambda call', JSON.stringify(result));
            callback(null, result); // returns list of URLs, base URL and bucket name
        }
    });
};