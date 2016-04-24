Game.screens['high-score'] = (function(game) {
	'use strict';

	var highScores = [];

	function addScore(scoreIn) {
		highScores.push(scoreIn);
		highScores.sort(function(a, b) { return b - a; } );
		if(highScores.length > 5) {
			highScores.splice(5, highScores.length - 5);
		}
		localStorage['VWL&AdityaTowerDefense.HighScores'] = JSON.stringify(highScores);
	}

	function reset() {
		highScores = [];
		for(var i = 0; i < 5; i++) {
			highScores.push(0);
		}
		run();
	}

	function initalize() {
		document.getElementById('high-score->main').addEventListener('click', function() {
			localStorage['VWL&AdityaTowerDefense.HighScores'] = JSON.stringify(highScores);
			game.showScreen('main-menu');
		});

		document.getElementById('high-score-reset').addEventListener('click', function() {
			reset();
			localStorage['VWL&AdityaTowerDefense.HighScores'] = JSON.stringify(highScores);
		});

		var prevScores = localStorage.getItem('VWL&AdityaTowerDefense.HighScores');

		if (prevScores !== null) {
			highScores = JSON.parse(prevScores);
			console.log('The data was loaded!')
		}
		else {
			for(var i = 0; i < 5; i++) {
				highScores.push(0);
			}
		}
	}

	function run() {
		var output = document.getElementById('high-score-output');

		output.innerHTML = '';

		for(var i = 0; i < highScores.length; i++) {
			output.innerHTML += '<li>' + highScores[i] + '</li>';
		}

		//output.innerHTML = '<li>5000</li><li>4000</li><li>3000</li><li>2000</li><li>1000</li>';
	}

	return {
		initalize: initalize,
		run: run,
		addScore: addScore,
		reset: reset
	};
}(Game.game));