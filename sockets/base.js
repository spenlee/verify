module.exports = function(sockjs, server) {
	var clients = {};

	var echo = sockjs.createServer();
	echo.on('connection', function(conn) {
		clients[conn.id] = conn;
		console.log("CLIENT CONNECTED");

		conn.on('data', function(message) {
			console.log(typeof message);
			console.log(message);
			broadcast(message);
		});

		conn.on('close', function() {
			delete clients[conn.id];
		});
	});

	function broadcast(message) {
	  for (var client in clients) {
	    clients[client].write(message);
	  }
	}

	echo.installHandlers(server, {prefix:'/api/web-socket'});
}


