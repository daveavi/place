const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081 });

// Static content
var express = require('express');
var app = express();
// static_files has all of statically returned content
// https://expressjs.com/en/starter/static-files.html
app.use('/',express.static('static_files')); // this directory has files to be returned
var server = app.listen(8080, function () {
	console.log('Example app listening on port 8080!');
});

var io = require('socket.io').listen(server);;
io.origins('*:*');

var redis = require('redis');

var client = redis.createClient(6379, 'redis');
var subscriber = redis.createClient(6379, 'redis');



// subscriber.on("message", function (channel, message) {
// 	if (channel == "pixelUpdate") {
// 		socket.broadcast.emit("message", message);
// 		socket.emit("message", message);
// 	}
	
// });
subscriber.subscribe("pixelUpdate", function(error) {
	console.log("ERROR ON SUBSCRIBE: ");
});
 
var dim = 1000; // note: this is not the right dimensions!!

var s = String.fromCharCode(15);
s = s.repeat(dim*dim);
client.set('board', s);



// wss.on('close', function() {
//     console.log('disconnected');
// });

// wss.broadcast = function broadcast(data) {
//   wss.clients.forEach(function each(client) {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(data);
//     }
//   });
// };

// for heartbeat to make sure connection is alive 
function noop() {}
function heartbeat() {
  this.isAlive = true;
}

function isValidSet(o){
	var isValid=false;
	try {
	   isValid = 
		Number.isInteger(o.x) && o.x!=null && 0<=o.x && o.x<dim &&
		Number.isInteger(o.y) && o.y!=null && 0<=o.y && o.y<dim && 
		Number.isInteger(o.r) && o.r!=null && 0<=o.r && o.r<=255 && 
		Number.isInteger(o.g) && o.g!=null && 0<=o.g && o.g<=255 && 
		Number.isInteger(o.b) && o.b!=null && 0<=o.b && o.b<=255;
	} catch (err){ 
		isValid=false; 
	} 
	return isValid;
}
io.sockets.on('connection', function(socket) {
	// // heartbeat
  	// ws.isAlive = true;
	  // ws.on('pong', heartbeat);
	
	console.log("you are connected to the server!");

	client.get('board', function(error, res) {
		var message = {'type': 'board', 'board': res.toString()}
		socket.emit("message", JSON.stringify(message));
	});

	// when we get a message from the client
	socket.on('message', function(message) {
		var data = JSON.parse(message);
		console.log("We are logging data out.");
		console.log(data);
		if (data.type == 'pixel') {
			var p = data.pixel;
			i = (p.x*1000 + p.y) * 8;
		    console.log("Here are logging i & p");
			console.log(i);
			console.log(p);
			client.setbit('board', i+4, p.r);
			client.setbit('board', i+5, p.g);
			client.setbit('board', i+6, p.b);
			client.setbit('board', i+7, p.a);
			client.publish("pixelUpdate", JSON.stringify(data));
		}
	});


	subscriber.on("message", function (channel, message) {
		if (channel == "pixelUpdate") {
			socket.broadcast.emit("message", message);
			socket.emit("message", message);
		}
		
	});

});


// heartbeat (ping) sent to all clients
// const interval = setInterval(function ping() {
//   wss.clients.forEach(function each(ws) {
//     if (ws.isAlive === false) return ws.terminate();
 
//     ws.isAlive = false;
//     ws.ping(noop);
//   });
// }, 30000);

// Static content
var express = require('express');
var app = express();

// static_files has all of statically returned content
// https://expressjs.com/en/starter/static-files.html
app.use('/',express.static('static_files')); // this directory has files to be returned


