Game.screens['high-score'] = (function(game) {
	'use strict';

	function addScore(scoreIn) {
		$.post('http://localhost:5000/addscore',
			{name: window.prompt('Enter a name for the scoreboard', 'Name'), score: scoreIn},
			function(data) {
				if(data === 'done') {
					console.log('Success!');
				}
			}
		);
	}

	function initalize() {
		document.getElementById('high-score->main').addEventListener('click', function() {
			game.showScreen('main-menu');
		});
	}

	function run() {
		var output = document.getElementById('high-score-output');

		output.innerHTML = '';

		$.get("http://localhost:5000/highscores", function(data, status) {
			for(var i = 0; i < data.length; i++) {
				output.innerHTML += '<li>' + (i + 1) + ': ' + data[i].name + ' ' + data[i].score + '</li>';
			}
		});

		//output.innerHTML = '<li>5000</li><li>4000</li><li>3000</li><li>2000</li><li>1000</li>';
	}

	return {
		initalize: initalize,
		run: run,
		addScore: addScore
	};
}(Game.game));