'use strict';

var select = require('lodash').select;
var each = require('lodash').each;
var isArray = require('lodash').isArray;
var contains = require('lodash').contains;

var validTypes = [ 'one', 'all' ];

module.exports = {
  type: 'Validator',
  deps: ['AcknowledgementMap', 'Logger'],
  func: function Validator (ackMaps, logger) {
    return function validateAckMaps () {

      function filterByMissingProperty (records, prop) {
        return select(records, function(record) { return !record[prop]; });
      }

      function filterByInvalidProperty (records, prop, valid) {
        return select(records, function(record) {
          if (!record[prop]) { return false; }

          return !contains(valid, record[prop]);
        });
      }

      each(ackMaps(), function (ackMap) {
        if (isArray(ackMap)) {
          ackMap = ackMap[1];
        }

        each(ackMap, function (records, key) {
          if (!isArray(records)) {
            ackMap[key] = [records];
            records = ackMap[key];
          }

          var invalidTarget = filterByMissingProperty(records, 'target');
          each(invalidTarget, function() {
            logger().error('AcknowledgementMap "' + key + '" missing "target" property');
          });

          var missingType = filterByMissingProperty(records, 'type');
          each(missingType, function() {
            logger().error('AcknowledgementMap "' + key + '" missing "type" property');
          });

          var invalidType = filterByInvalidProperty(records, 'type', validTypes);
          each(invalidType, function() {
            logger().error('AcknowledgementMap "' + key + '" has invalid "type" property of "derp"');
          });
        });
      });

    };
  }
};