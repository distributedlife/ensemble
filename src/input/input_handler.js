'use strict';

var each = require('lodash').each;

module.exports = {
	type: 'OnInput',
	deps: ['ActionMap', 'DefinePlugin', 'StateMutator'],
	func: function(actionMap, definePlugin, stateMutator) {
		var userInput = [];

		var parseKeysAndButtons = function(currentInput, callback) {
			each(currentInput.rawData.keys, function(key) {
				if (actionMap()[key] === undefined) { return; }

				each(actionMap()[key], function(action) {
					if (!action.keypress) {
						stateMutator()(
							callback(action.target, action.noEventKey)
						);
					}
				});
			});

			each(currentInput.rawData.singlePressKeys, function(key) {
				if (actionMap()[key] === undefined) { return; }

				each(actionMap()[key], function(action) {
					if (action.keypress) {
						stateMutator()(
							callback(action.target, action.noEventKey)
						);
					}
				});
			});
		};

		var parseMouse = function(currentInput, callback) {
			if (actionMap().cursor === undefined) { return; }

			each(actionMap().cursor, function(action) {
				stateMutator()(
					callback(action.target, action.noEventKey, currentInput.rawData)
				);
			});
		};

		var parseTouches = function(currentInput, callback) {
			each(currentInput.rawData.touches, function(touch) {
				var key = 'touch' + touch.id;
				if (actionMap()[key] === undefined) { return; }

				each(actionMap()[key], function(action) {
					stateMutator()(
						callback(action.target, action.noEventKey, {x: touch.x, y: touch.y})
					);
				});
			});
		};

		var parseSticks = function(currentInput, callback) {
			each(['leftStick', 'rightStick'], function(key) {
				if (currentInput.rawData[key] === undefined) {return;}
				if (actionMap()[key] === undefined) { return; }

				var data = currentInput.rawData[key];
				each(actionMap()[key], function(action) {
					stateMutator()(
						callback(action.target, action.noEventKey,{x: data.x, y: data.y, force: data.force})
					);
				});
			});
		};

		definePlugin()('ServerSideUpdate', function () {
			return function () {
				var currentInput = userInput.shift();
				if (currentInput === undefined) {
					return;
				}

				var data = {
					rcvdTimestamp: currentInput.timestamp
				};

				var somethingHasReceivedInput = [];
				parseKeysAndButtons(currentInput, function(target, noEventKey) {
					somethingHasReceivedInput.push(noEventKey);
					return target(data);
				});

				parseTouches(currentInput, function(target, noEventKey, inputData) {
					somethingHasReceivedInput.push(noEventKey);
					return target(inputData.x, inputData.y, data);
				});

				parseSticks(currentInput, function(target, noEventKey, inputData) {
					somethingHasReceivedInput.push(noEventKey);
					return target(inputData.x, inputData.y, inputData.force, data);
				});

				parseMouse(currentInput, function(target, noEventKey, inputData) {
					return target(inputData.x, inputData.y, data);
				});

				each(actionMap().nothing, function(action) {
					if (somethingHasReceivedInput.indexOf(action.noEventKey) === -1) {
						return action.target(data);
					}
				});
			};
		});

		return function(rawData, timestamp) {
			userInput.push({ rawData: rawData, timestamp: timestamp });
		};
	}
};