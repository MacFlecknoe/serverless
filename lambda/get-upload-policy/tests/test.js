'use strict';

var sinon = require('sinon');
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

describe('GetUploadPolicyHandler', function () {

    var module = require('../GetUploadPolicyHandler');
    var callbackSpy;

    describe('#handler', function () {
        before(function () {

            // should probably rewire this rather than setting them
            process.env.UPLOAD_BUCKET = "serverless-video-transcoded";
            process.env.UPLOAD_URI = "http://test";
            process.env.SECRET_ACCESS_KEY = "ABCDE";
            process.env.ACCESS_KEY = "1234";

            var event = {
                'queryStringParameters': {
                    'filename': 'test.file'
                }
            };
            callbackSpy = sinon.spy();
            module.handler(event, {}, callbackSpy);
        });
        it('should run our function once', function () {
            sinon.assert.calledOnce(callbackSpy); //test to ensure spy was called once
        });
        it('policy is properly encoded', function () {

            var body = JSON.parse(callbackSpy.args[0][1].body);
            var encodedPolicy = new Buffer(body.encoded_policy, 'base64');
            var unencodedPolicy = JSON.parse(encodedPolicy.toString('ascii'));

            logger.log("debug", "unencoded policy: %s", JSON.stringify(unencodedPolicy));

            sinon.assert.match(unencodedPolicy.conditions[2].acl, 'private');
            sinon.assert.match(unencodedPolicy.conditions[1].bucket, process.env.UPLOAD_BUCKET);
        });
    });
});
