// Use the websocket-relay to serve a raw MPEG-TS over WebSockets. You can use
// ffmpeg to feed the relay. ffmpeg -> websocket-relay -> browser
// Example:
// node websocket-relay fpmpassword 8081 8082
// ffmpeg -i <some input> -f mpegts http://192.168.88.111:8081/fpmpassword
const debug = require('debug')('ws-test');
const _ = require("lodash");

var fs = require('fs'),
	http = require('http'),
	WebSocket = require('ws');

if (process.argv.length < 3) {
	console.log(
		'Usage: \n' +
		'node websocket-relay.js <secret> [<stream-port> <websocket-port>]'
	);
	process.exit();
}

var STREAM_SECRET = process.argv[2],
	STREAM_PORT = process.argv[3] || 8081,
	WEBSOCKET_PORT = process.argv[4] || 8082,
	RECORD_STREAM = false;

const CameraMap = {};

// Websocket Server
var socketServer = new WebSocket.Server({port: WEBSOCKET_PORT, perMessageDeflate: false});
socketServer.connectionCount = 0;
socketServer.on('connection', function(socket, upgradeReq) {
	
	var params = upgradeReq.url.substr(1).split('/');
	
	const sn = params[0];
	if (!_.has(CameraMap, sn)){
		CameraMap[sn] = {
			total: 0,
			clients: [],
			open: false,
		};
	}
	CameraMap[sn].total++;
	CameraMap[sn].remoteAddress = (upgradeReq || socket.upgradeReq).socket.remoteAddress;
	CameraMap[sn].headers = (upgradeReq || socket.upgradeReq).headers['user-agent'];
	CameraMap[sn].clients.push(socket);

	debug("sn %s, client: %d, open: %b", sn, CameraMap[sn].clients.length, CameraMap[sn].open)
	socket.on('close', function(code, message){
		CameraMap[sn].total--;
		debug(
			'Disconnected WebSocket ('+CameraMap[sn].total+'  total)'
		);
	});
});
socketServer.broadcast = function(sn, data) {
	if(!CameraMap[sn]){
		return;
	}
	const clients = CameraMap[sn].clients;
	if(!clients){
		return;
	}
	clients.forEach(function each(client) {
		if (!client) return;
		if (client.readyState === WebSocket.OPEN) {
			client.send(data);
		}
	});
};

// HTTP Server to accept incomming MPEG-TS Stream from ffmpeg
var streamServer = http.createServer( function(request, response) {

	// static files serve
	if(_.startsWith(request.url, "/static")){
		
		fs.readFile(__dirname + request.url, function (err,data) {
			if (err) {
				response.writeHead(404);
				response.end(JSON.stringify(err));
				return;
			}
			response.writeHead(200);
			response.end(data);
		});
		  
		return;
	}
	
	if( request.url === '/favicon.ico' ){
		return;
	}
	debug("[URL] -> %s", request.url)
	if( request.url === '/api/camera/list') {
		const data = {};
		_.forEach(CameraMap, (camera,key) => {
			data[key] = {
				total: camera.total,
				open: camera.open,
			};
		})
		response.writeHead(200);
		response.end(JSON.stringify(data));
		return;
	}

	if( _.startsWith(request.url, '/api/camera/get/')) {
		const urlSlice = request.url.split('/');
		const sn = urlSlice[urlSlice.length - 1]

		var camera = { 
			open: false,
			total: 0,
		};
		if (_.has(CameraMap, sn)){
			camera.open = CameraMap[sn].open;
			camera.total = CameraMap[sn].total;
		}
		response.writeHead(200);
		response.end(JSON.stringify(camera));
		return; 
	}

	
	// 
	var params = request.url.substr(1).split('/');
	// params
	if (params[0] !== STREAM_SECRET) {
		console.log(
			'Failed Stream Connection: '+ request.socket.remoteAddress + ':' +
			request.socket.remotePort + ' - wrong secret.'
		);
		response.end();
	}

	// http://localhost:18081/fpmpassword/abc 路由中 /abc 就对应设备的 sn
	const sn = params[1]

	if (!_.has(CameraMap, sn)){
		CameraMap[sn] = {
			total: 0,
			clients: [],
			open: false,
		};
	}
	
	response.connection.setTimeout(0);
	debug(
		'Stream Connected: ' +
		request.socket.remoteAddress + ':' +
		request.socket.remotePort
	);
	request.on('data', function(data){
		// debug('data:', data)
		CameraMap[sn].open = true;
		socketServer.broadcast(sn, data);
		if (request.socket.recording) {
			request.socket.recording.write(data);
		}
	});
	request.on('end',function(){
		console.log('close');
		CameraMap[sn].open = false;
		if (request.socket.recording) {
			request.socket.recording.close();
		}
	});

	// Record the stream to a local file?
	// if (RECORD_STREAM) {
	// 	var path = 'recordings/' + Date.now() + '.ts';
	// 	request.socket.recording = fs.createWriteStream(path);
	// }
})
// Keep the socket open for streaming
streamServer.headersTimeout = 0;
streamServer.listen(STREAM_PORT);

console.log('Listening for incomming MPEG-TS Stream on http://127.0.0.1:'+STREAM_PORT+'/<secret>');
console.log('Awaiting WebSocket connections on ws://127.0.0.1:'+WEBSOCKET_PORT+'/');
