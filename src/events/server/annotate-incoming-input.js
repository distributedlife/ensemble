'use strict';

var each = require('lodash').each;

module.exports = {
  type: 'OnIncomingClientInputPacket',
  deps: ['Time', 'OnInput'],
  func: function OnIncomingClientInputPacket (time, onInput) {
    return function addTimeToInput (packet, save) {
      var now = time().present();

      each(onInput(), function (onInputCallback) {
        onInputCallback(packet, now, save);
      });
    };
  }
};