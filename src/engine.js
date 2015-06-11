'use strict';

var each = require('lodash').each;
var reject = require('lodash').reject;

module.exports = {
  type: 'ServerSideEngine',
  deps: ['ServerSideUpdate', 'StateAccess', 'StateMutator', 'GamesList'],
  func: function (serverSideUpdate, state, mutator, games) {
    var priorStepTime = Date.now();

    var update = function(dt) {
      var runningGames = reject(games().all(), function(game) {
        return state().for(game.id).for('ensemble').get('paused');
      });

      each(runningGames, function(game) {
        var gameState = state().for(game.id);

        each(serverSideUpdate(), function(callback) {
          mutator()(game.id, callback(gameState, dt));
        });
      });
    };

    var step = function() {
      var now = Date.now();
      var dt = (now - priorStepTime) / 1000;

      update(dt);

      priorStepTime = now;
    };

    return {
      run: function(frequency) {
        step();
        return setInterval(step, 1000 / frequency);
      }
    };
  }
};