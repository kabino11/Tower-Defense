var express = require('express'),
	http = require('http'),
	path = require('path'),
	app = express();

//
// Define the port to use
app.set('port', (5000 || 3000));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/scripts', express.static(__dirname + '/scripts'));

//
// Define the different routes we support
app.get('/', function(request, response) {
	response.sendFile('index.html');
});

//
// Get the server created and listening for requests
http.createServer(app).listen(app.get('port'), function() {
	console.log('Tower defense is running on ' + app.get('port'));
});
