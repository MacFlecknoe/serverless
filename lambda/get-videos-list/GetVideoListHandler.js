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

function createFileList(encoding, files, next) {
    console.log("createFileList:", files);
    logger.log('info', 'createFileList: %s', files);
    var fileList = [];
    for (var i = 0; i < files.Contents.length; i++) {
        var file = files.Contents[i];
        if (file.Key && file.Key.substr(-3, 3) === 'mp4') { // only grab videos
            fileList.push({
                'filename': file.Key,
                'eTag': file.ETag.replace(/"/g, ""),
                'size': file.Size
            });
        }
    }
    var result = {
        'domain': process.env.BASE_URL,
        'bucket': process.env.BUCKET,
        'files': fileList
    };
    next(null, result);
}

function createResponse(code, result) {
    var response = {
        'statusCode': code,
        'headers': { 'Access-Control-Allow-Origin': '*' },
        'body': JSON.stringify(result)
    }
    return response;
}

exports.handler = function (event, context, callback) {

    var encoding = null;
    if (event.queryStringParameters && event.queryStringParameters.encoding) {
        encoding = decodeURIComponent(event.queryStringParameters.encoding);
    }
    console.log("encoding:", encoding);
    logger.log('info', 'encoding %s', encoding);

    async.waterfall([createBucketParams, getVideoFilesFromBucket, async.apply(createFileList, encoding)], function (err, result) {
        if (err) {
            callback(null, createResponse(500, err));
        } else if (result.files.length > 0) {
            callback(null, createResponse(200, result)); // returns list of URLs, base URL and bucket name
        } else {
            callback(null, createResponse(404, 'No files found'));
        }
    });
};