'use strict';

var aws = require('aws-sdk');
aws.config.update({ region: 'us-east-1' });

var chai = require('chai');
var sinon = require('sinon');
var rewire = require('rewire');
chai.use(require('sinon-chai'));

var expect = chai.expect;
var assert = chai.assert;

process.env.BASE_URL = "https://s3.amazonaws.com";
process.env.BUCKET = "serverless-video-transcoded";

var sampleData = {
  Contents: [{
      Key: 'file1.mp4',
      bucket: 'my-bucket'
    }, {
      Key: 'file2.mp4',
      bucket: 'my-bucket'
    }
  ]
}

describe('LamdbaFunction', function () {
  var listFilesStub;
  var callbackSpy;
  var module;

  describe('#execute', function () {
    before(function (done) {
      listFilesStub = sinon.stub().yields(null, sampleData);
      callbackSpy = sinon.spy();
      module = getModule(listFilesStub);  // get rewired module
      module.handler(null, null, function (error, results) { // execute the module
        callbackSpy.apply(null, arguments);
        done(); // tell mocha we are finished
      });
    });
    it('should run our function once', function () {
      expect(callbackSpy).calledOnce; //test to ensure spy was called once
    });
    it('should have correct results', function () {
      var result = {
        "baseUrl": "https://s3.amazonaws.com",
        "bucket": "serverless-video-transcoded",
        "urls": [ {
            "Key": sampleData.Contents[0].Key,
            "bucket": "my-bucket"
          }, {
            "Key": sampleData.Contents[1].Key,
            "bucket": "my-bucket"
          }
        ]
      };
      assert.deepEqual(callbackSpy.args, [[null, result]]);
    })
  })
})

function getModule(listFiles) {
  var rewired = rewire('../GetVideoListHandler.js');
  rewired.__set__({
    's3': { listObjects: listFiles }
  });
  return rewired;
}
