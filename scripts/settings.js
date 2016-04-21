Game.screens['settings'] = (function(game) {
	'use strict';

	var keys;

	var lastKey;
	var rebinding = false;

	function initalize() {
		document.getElementById('settings->main').addEventListener('click', function() {
			if(!rebinding) {
				game.showScreen('main-menu');
			}
		});

		document.getElementById('set-default').addEventListener('click', function() {
			setToDefault();
		});

		setToDefault();

		for(var property in keys) {
			if(keys.hasOwnProperty(property)) {
				document.getElementById('rebind-' + property).addEventListener('click', rebind);
			}
		}
	}

	function run() {
		var quitKeyOut = document.getElementById('quitKey-out');
		quitKeyOut.innerHTML = getKeyWindowOutput(keys.quitKey) + ' ';
	}

	function getKeyBinds() {
		return keys;
	}

	function rebindQuit() {
		if(rebinding) {
			return;
		}
		rebinding = true;
		lastKey = keys.quitKey;
		keys.quitKey = undefined;
		var output = document.getElementById('quitKey-out');
		output.innerHTML = '...';
		window.addEventListener('keydown', finishRebind);
	}

	function rebind() {
		if(rebinding) {
			return;
		}

		// figure out what button clicked me and which key it corresponds to
		var buttonID = this.id;
		var list = buttonID.split('-');
		var keyId = list[list.length - 1];

		// once I do determine if the keyId is valid and then start rebinding.
		if(keys.hasOwnProperty(keyId)) {
			rebinding = true;
			lastKey = keys[keyId];
			keys[keyId] = undefined;
			var output = document.getElementById(keyId + '-out');
			output.innerHTML = '...';
			window.addEventListener('keydown', finishRebind);
		}
	}

	// function called when user presses key to rebind to
	function finishRebind(e) {
		//just in case a key listener comes here when rebind mode has been turned off
		//mostly for error checking
		if(!rebinding) {
			window.removeEventListener('keydown', finishRebind);
			return;
		}

		// designate variables for output, the changed key, and duplicate tracking
		var output;
		var changed = e.keyCode;

		var duplicate = false;

		// now we iterate through our object
		for(var property in keys) {
			// if your property has been set by the user and is intentionally set to undefined
			if(keys.hasOwnProperty(property) && keys[property] == undefined) {
				// check for duplicates
				for(var otherProperty in keys) {
					if(keys.hasOwnProperty(otherProperty) && keys[otherProperty] == changed) {
						duplicate = true;
						break;
					}
				}

				// if we are a duplicate just break out
				if(duplicate) {
					break;
				}

				// then finally we set our key
				keys[property] = changed;
				output = document.getElementById(property + '-out');
				rebinding = false;
			}
		}
		
		// then output our message accordingly
		if(!rebinding) {
			output.innerHTML = getKeyWindowOutput(changed) + ' ';
			window.removeEventListener('keydown', finishRebind);
		}
		else if(!duplicate) {
			console.log('Key rebinding couldn\'t find control to reassign');
		}
	}

	// set keys to their default positions and changes output accordingly
	function setToDefault() {
		keys = {
			upgradeKey: KeyEvent.DOM_VK_U,
			sellKey: KeyEvent.DOM_VK_S,
			startWaveKey: KeyEvent.DOM_VK_G,
			quitKey: KeyEvent.DOM_VK_ESCAPE
		}

		for(var property in keys) {
			if(keys.hasOwnProperty(property)) {
				console.log(property);
				var output = document.getElementById(property + '-out');
				output.innerHTML = getKeyWindowOutput(keys[property]) + ' ';
			}
		}

		if(rebinding) {  //if still rebinding when setToDefalut is pressed remove key listener
			window.removeEventListener('keydown', finishRebind);
		}

		rebinding = false;
		lastKey = undefined;
	}

	return {
		initalize: initalize,
		run: run,
		getKeyBinds: getKeyBinds
	};
}(Game.game));

function getKeyWindowOutput(keyCode) {
	switch(keyCode) {
		case KeyEvent.DOM_VK_CANCEL:
			return 'Cancel';
		case KeyEvent.DOM_VK_HELP: 
			return 'Help';
		case KeyEvent.DOM_VK_BACK_SPACE:
			return 'Backspace';
		case KeyEvent.DOM_VK_TAB: 
			return 'Tab';
		case KeyEvent.DOM_VK_CLEAR:
			return 'Clear';
		case KeyEvent.DOM_VK_RETURN:
			return 'Return';
		case KeyEvent.DOM_VK_ENTER:
			return 'Enter';
		case KeyEvent.DOM_VK_SHIFT:
			return 'Shift';
		case KeyEvent.DOM_VK_CONTROL:
			return 'Ctrl';
		case KeyEvent.DOM_VK_ALT:
			return 'Alt';
		case KeyEvent.DOM_VK_PAUSE:
			return 'Pause';
		case KeyEvent.DOM_VK_CAPS_LOCK:
			return 'Caps Lock';
		case KeyEvent.DOM_VK_ESCAPE:
			return 'Escape';
		case KeyEvent.DOM_VK_SPACE:
			return 'Space';
		case KeyEvent.DOM_VK_PAGE_UP:
			return 'Page Up';
		case KeyEvent.DOM_VK_PAGE_DOWN:
			return 'Page Down';
		case KeyEvent.DOM_VK_END:
			return 'End';
		case KeyEvent.DOM_VK_HOME:
			return 'Home';
		case KeyEvent.DOM_VK_LEFT:
			return 'Left Arrow';
		case KeyEvent.DOM_VK_UP:
			return 'Up Arrow';
		case KeyEvent.DOM_VK_RIGHT:
			return 'Right Arrow';
		case KeyEvent.DOM_VK_DOWN:
			return 'Down Arrow';
		case KeyEvent.DOM_VK_PRINTSCREEN:
			return 'Print Screen';
		case KeyEvent.DOM_VK_INSERT:
			return 'Insert';
		case KeyEvent.DOM_VK_DELETE:
			return 'Delete';
		case KeyEvent.DOM_VK_0:
			return '0';
		case KeyEvent.DOM_VK_1:
			return '1';
		case KeyEvent.DOM_VK_2:
			return '2';
		case KeyEvent.DOM_VK_3:
			return '3';
		case KeyEvent.DOM_VK_4:
			return '4';
		case KeyEvent.DOM_VK_5:
			return '5';
		case KeyEvent.DOM_VK_6:
			return '6';
		case KeyEvent.DOM_VK_7:
			return '7';
		case KeyEvent.DOM_VK_8:
			return '8';
		case KeyEvent.DOM_VK_9:
			return '9';
		case KeyEvent.DOM_VK_SEMICOLON:
			return ';';
		case KeyEvent.DOM_VK_EQUALS:
			return '=';
		case KeyEvent.DOM_VK_A:
			return 'A';
		case KeyEvent.DOM_VK_B:
			return 'B';
		case KeyEvent.DOM_VK_C:
			return 'C';
		case KeyEvent.DOM_VK_D:
			return 'D';
		case KeyEvent.DOM_VK_E:
			return 'E';
		case KeyEvent.DOM_VK_F:
			return 'F';
		case KeyEvent.DOM_VK_G:
			return 'G';
		case KeyEvent.DOM_VK_H:
			return 'H';
		case KeyEvent.DOM_VK_I:
			return 'I';
		case KeyEvent.DOM_VK_J:
			return 'J';
		case KeyEvent.DOM_VK_K:
			return 'K';
		case KeyEvent.DOM_VK_L:
			return 'L';
		case KeyEvent.DOM_VK_M:
			return 'M';
		case KeyEvent.DOM_VK_N:
			return 'N';
		case KeyEvent.DOM_VK_O:
			return 'O';
		case KeyEvent.DOM_VK_P:
			return 'P';
		case KeyEvent.DOM_VK_Q:
			return 'Q';
		case KeyEvent.DOM_VK_R:
			return 'R';
		case KeyEvent.DOM_VK_S:
			return 'S';
		case KeyEvent.DOM_VK_T:
			return 'T';
		case KeyEvent.DOM_VK_U:
			return 'U';
		case KeyEvent.DOM_VK_V:
			return 'V';
		case KeyEvent.DOM_VK_W:
			return 'W';
		case KeyEvent.DOM_VK_X:
			return 'X';
		case KeyEvent.DOM_VK_Y:
			return 'Y';
		case KeyEvent.DOM_VK_Z:
			return 'Z';
		case KeyEvent.DOM_VK_CONTEXT_MENU:
			return 'Context Menu';
		case KeyEvent.DOM_VK_NUMPAD0:
			return 'Numpad 0';
		case KeyEvent.DOM_VK_NUMPAD1:
			return 'Numpad 1';
		case KeyEvent.DOM_VK_NUMPAD2:
			return 'Numpad 2';
		case KeyEvent.DOM_VK_NUMPAD3:
			return 'Numpad 3';
		case KeyEvent.DOM_VK_NUMPAD4:
			return 'Numpad 4';
		case KeyEvent.DOM_VK_NUMPAD5:
			return 'Numpad 5';
		case KeyEvent.DOM_VK_NUMPAD6:
			return 'Numpad 6';
		case KeyEvent.DOM_VK_NUMPAD7:
			return 'Numpad 7';
		case KeyEvent.DOM_VK_NUMPAD8:
			return 'Numpad 8';
		case KeyEvent.DOM_VK_NUMPAD9:
			return 'Numpad 9';
		case KeyEvent.DOM_VK_MULTIPLY:
			return '*';
		case KeyEvent.DOM_VK_ADD:
			return '+';
		case KeyEvent.DOM_VK_SEPARATOR:
			return '-';
		case KeyEvent.DOM_VK_SUBTRACT:
			return 'Numpad -';
		case KeyEvent.DOM_VK_DECIMAL:
			return 'Numpad .';
		case KeyEvent.DOM_VK_DIVIDE:
			return 'Numpad /';
		case KeyEvent.DOM_VK_F1:
			return 'F1';
		case KeyEvent.DOM_VK_F2:
			return 'F2';
		case KeyEvent.DOM_VK_F3:
			return 'F3';
		case KeyEvent.DOM_VK_F4:
			return 'F4';
		case KeyEvent.DOM_VK_F5:
			return 'F5';
		case KeyEvent.DOM_VK_F6:
			return 'F6';
		case KeyEvent.DOM_VK_F7:
			return 'F7';
		case KeyEvent.DOM_VK_F8:
			return 'F8';
		case KeyEvent.DOM_VK_F9:
			return 'F9';
		case KeyEvent.DOM_VK_F10:
			return 'F10';
		case KeyEvent.DOM_VK_F11:
			return 'F11';
		case KeyEvent.DOM_VK_F12:
			return 'F12';
		case KeyEvent.DOM_VK_F13:
			return 'F13';
		case KeyEvent.DOM_VK_F14:
			return 'F14';
		case KeyEvent.DOM_VK_F15:
			return 'F15';
		case KeyEvent.DOM_VK_F16:
			return 'F16';
		case KeyEvent.DOM_VK_F17:
			return 'F17';
		case KeyEvent.DOM_VK_F18:
			return 'F18';
		case KeyEvent.DOM_VK_F19:
			return 'F19';
		case KeyEvent.DOM_VK_F20:
			return 'F20';
		case KeyEvent.DOM_VK_F21:
			return 'F21';
		case KeyEvent.DOM_VK_F22:
			return 'F22';
		case KeyEvent.DOM_VK_F23:
			return 'F23';
		case KeyEvent.DOM_VK_F24:
			return 'F24';
		case KeyEvent.DOM_VK_NUM_LOCK:
			return 'Num Lock';
		case KeyEvent.DOM_VK_SCROLL_LOCK:
			return 'Scroll Lock';
		case KeyEvent.DOM_VK_COMMA:
			return ',';
		case KeyEvent.DOM_VK_PERIOD:
			return '.';
		case KeyEvent.DOM_VK_SLASH:
			return '/';
		case KeyEvent.DOM_VK_BACK_QUOTE:
			return '`';
		case KeyEvent.DOM_VK_OPEN_BRACKET:
			return '[';
		case KeyEvent.DOM_VK_BACK_SLASH:
			return '\\';
		case KeyEvent.DOM_VK_CLOSE_BRACKET:
			return ']';
		case KeyEvent.DOM_VK_QUOTE:
			return '\'';
		case KeyEvent.DOM_VK_META:
			return 'Meta';
	}
}