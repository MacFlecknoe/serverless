'use strict';

var sinon = require('sinon');

process.env.UPLOAD_BUCKET = "serverless-video-transcoded";
process.env.UPLOAD_URI = "http://test";
process.env.SECRET_ACCESS_KEY = "ABCDE";
process.env.ACCESS_KEY = "1234";

describe('GetUploadPolicyHandler', function () {

    var module = require('../GetUploadPolicyHandler');
    var callbackSpy;

    describe('#handler', function () {
        before(function () {
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
        it('should have correct results', function () {
            var body = {
                'signature': "sample",
                'encoded_policy': "sample",
                'access_key': "1234",
                'upload_url': "http://test/serverless-video-transcoded",
                'key': "sample"
            }
            var result = {
                'body': body,
                'headers': { 'Access-Control-Allow-Origin': '*' },
                'statusCode': 200
            }
            // some of the results are random so we exclude them from the tests
            var resultBody = JSON.parse(callbackSpy.args[0][1].body);
            resultBody.signature = "sample";
            resultBody.key = "sample";
            resultBody.encoded_policy = "sample";
            callbackSpy.args[0][1].body = resultBody;

            sinon.assert.match(callbackSpy.args, [[null, result]]);
        });
    });
});
