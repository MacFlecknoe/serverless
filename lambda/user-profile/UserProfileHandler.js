'use strict';

var jwt = require('jsonwebtoken');
var request = require('request');

exports.handler = function(event, context, callback) {

    if(!event.authToken) {
		callback('Could not find authToken');
		return;
	}
	var token = event.authToken.split(' ')[1]; // contains the word Bearer before the token
	var secretBuffer = new Buffer(process.env.AUTH0_SECRET);
	
	jwt.verify(token, secretBuffer, function(err, decoded) {
		
		if(err) {
			console.log('Failed jwt validation: ', err, 'auth: ', event.authToken);
			callback('Authorizatin Failed');
		} else {
			var body = {
				'id_token': token
			};
		}
		var options = {
			url: 'https://' + process.env.DOMAIN + '/tokeninfo', 
			method: 'POST', 
			json: true,
			body: body			
		};
		request(options, function(err, response, body) {
			if(!err && response.statusCode === 200) {
				callback(null, body);
			} else {
				callback(error);
			}
		}
	});
};