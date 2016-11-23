'use strict';

var uuid = require('uuid');

module.exports = {
  type: 'UUID',
  func: function UUID () {
    return {
      gen: uuid.v4
    };
  }
};