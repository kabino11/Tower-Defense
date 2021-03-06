var express = require('express'),
	http = require('http'),
	path = require('path'),
	bodyParser = require("body-parser"),
	app = express(),
	fs = require('fs');

//
// Define the port to use
app.set('port', (5000 || 3000));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/scripts', express.static(__dirname + '/scripts'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var highscores;

fs.readFile('highscores.json', function read(err, data) {
	if(err) {
		highscores = [
			{name: 'Name', score:0 },
			{name: 'Name', score:0 },
			{name: 'Name', score:0 },
			{name: 'Name', score:0 },
			{name: 'Name', score:0 }
		];

		fs.writeFile('highscores.json', JSON.stringify(highscores), function(err) {
			if(err) {
				return console.log(err);
			}
		});
	}
	else {
		highscores = JSON.parse(data);
	}
});



//
// Define the different routes we support
app.get('/', function(request, response) {
	response.sendFile('index.html');
});

app.get('/highscores', function(request, response) {
	response.json(highscores);
});

app.post('/addscore', function(request, response) {

	var name = request.body.name;
	var score = request.body.score;

	highscores.push({ name: name, score: score });
	highscores.sort(function(a, b) { return b.score - a.score; } );
	if(highscores.length > 5) {
		highscores.splice(5, highscores.length - 5);
	}

	fs.writeFile('highscores.json', JSON.stringify(highscores), function(err) {
		if(err) {
			return console.log(err);
		}
	});

	response.end('yes');
});

//
// Get the server created and listening for requests
http.createServer(app).listen(app.get('port'), function() {
	console.log('Tower defense is running on ' + app.get('port'));
});
