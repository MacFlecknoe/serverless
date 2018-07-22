'use strict';

var sinon = require('sinon');
var rewire = require('rewire');

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

describe('GetVideoListHandler', function () {

  var listFilesStub, callbackSpy, module;

  describe('#handler', function () {
    before(function () {
      listFilesStub = sinon.stub().yields(null, sampleData);
      module = getModule(listFilesStub);  // get rewired module
      callbackSpy = sinon.spy();
      module.handler(null, null, callbackSpy);
    });
    it('should run our function once', function () {
      sinon.assert.calledOnce(callbackSpy); //test to ensure spy was called once
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
