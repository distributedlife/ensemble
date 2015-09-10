'use strict';

var each = require('lodash').each;

module.exports = {
  type: 'OnServerStart',
  deps: ['Validator'],
  func: function (validators) {
    return function runValidations () {
      each(validators(), function (validator) {
        validator();
      });
    };
  }
};