'use strict';

var sinon = require('sinon');
var rewire = require('rewire');

process.env.BASE_URL = "https://s3.amazonaws.com";
process.env.BUCKET = "serverless-video-transcoded";

var sampleData = {
  Contents: [{
      Key: 'file1.mp4',
      Bucket: 'my-bucket',
      Size: 0,
      ETag: 'eTag1'
    }, {
      Key: 'file2.mp4',
      Bucket: 'my-bucket',
      Size: 0,
      ETag: 'eTag2'
    }
  ]
}

describe('GetVideoListHandler', function () {

  var listFilesStub, callbackSpy, module;

  describe('#handler', function () {
    before(function () {
      listFilesStub = sinon.stub().yields(null, sampleData);
      module = getModule(listFilesStub);  // get rewired module
      callbackSpy = sinon.spy();
      module.handler({}, {}, callbackSpy);
    });
    it('should run our function once', function () {
      sinon.assert.calledOnce(callbackSpy); //test to ensure spy was called once
    });
    it('should have correct results', function () {
      var result = {
        body: {
          'domain': "https://s3.amazonaws.com",
          'bucket': "serverless-video-transcoded",
          'files': [
            {
              'filename': 'file1.mp4',
              'eTag': 'eTag1',
              'size': 0
            }, 
            {
              'filename': 'file2.mp4',
              'eTag': 'eTag2',
              'size': 0
            }
          ]
        },
        'headers': { 'Access-Control-Allow-Origin': '*' },
        'statusCode': 200
      }
      sinon.assert.match(callbackSpy.args, [[null, result]]);
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
