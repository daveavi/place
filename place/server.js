const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081 });

var redis = require('redis');

var client = redis.createClient(6379, 'redis');

client.on('connect', function() {
	console.log('connected');
});

client.on("error", function (err) {
    console.log("Error " + err);
});
 
var dim = 1000; // note: this is not the right dimensions!!

var s = String.fromCharCode(15);
s = s.repeat(dim*dim);
client.set('board', s);

wss.on('close', function() {
    console.log('disconnected');
});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

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
wss.on('connection', function(ws) {
	// heartbeat
  	ws.isAlive = true;
  	ws.on('pong', heartbeat);

	client.get('board', function(error, res) {
		var message = {'type': 'board', 'board': res.toString()}
		ws.send(JSON.stringify(message));
	});

	// when we get a message from the client
	ws.on('message', function(message) {
		console.log(message);
		var data = JSON.parse(message);
		wss.broadcast(message);
		if (data.type == 'pixel') {
			var p = data.pixel;
			i = (p.x*1000 + p.y) * 8;
			client.setbit('board', i+4, p.r);
			client.setbit('board', i+5, p.g);
			client.setbit('board', i+6, p.b);
			client.setbit('board', i+7, p.a);
		}
	});
});

// heartbeat (ping) sent to all clients
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
 
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 30000);

// Static content
var express = require('express');
var app = express();

// static_files has all of statically returned content
// https://expressjs.com/en/starter/static-files.html
app.use('/',express.static('static_files')); // this directory has files to be returned

app.listen(8080, function () {
  console.log('Example app listening on port 8080!');
});

