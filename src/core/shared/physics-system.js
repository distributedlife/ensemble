'use strict';

var autoResolve = require('distributedlife-sat').shapes.autoResolve;
import {map, reject, flatten, uniq} from 'lodash';

var physicsThings = {};
var keyMappings = {};

function create (saveId, physicsKey, sourceKey, initialState) {
  keyMappings[saveId] = keyMappings[saveId] || {};
  keyMappings[saveId][physicsKey] = keyMappings[saveId][physicsKey] || [];
  keyMappings[saveId][physicsKey].push(sourceKey);

  physicsThings[saveId] = physicsThings[saveId] || {};
  physicsThings[saveId][sourceKey] = autoResolve(initialState);
}

function updated (saveId, sourceKey) {
  return function calledWhenUpdated (current) {
    physicsThings[saveId][sourceKey] = autoResolve(current);
  };
}

function added (saveId, physicsKey, sourceKey) {
  keyMappings[saveId] = keyMappings[saveId] || {};
  keyMappings[saveId][physicsKey] = keyMappings[saveId][physicsKey] || [];
  keyMappings[saveId][physicsKey].push(sourceKey);
  keyMappings[saveId][physicsKey] = uniq(keyMappings[saveId][physicsKey]);

  physicsThings[saveId] = physicsThings[saveId] || {};
  physicsThings[saveId][sourceKey] = physicsThings[saveId][sourceKey] || [];

  return function calledWhenElementAdded (id, current) {
    physicsThings[saveId][sourceKey].push(autoResolve(current));
  };
}

function changed (saveId, physicsKey, sourceKey) {
  return function calledWhenElementChanged (id, current) {
    physicsThings[saveId][sourceKey] = reject(physicsThings[saveId][sourceKey], {id: id});
    physicsThings[saveId][sourceKey].push(autoResolve(current));
  };
}

function removed (saveId, physicsKey, sourceKey) {
  return function calledWhenElementRemoved (id) {
    physicsThings[saveId][sourceKey] = reject(physicsThings[saveId][sourceKey], {id: id});
  };
}

function getBySourceKey (saveId, sourceKey) {
  return physicsThings[saveId][sourceKey];
}

function getByPhysicsKey (saveId, physicsKey) {
  var sourceKeys = keyMappings[saveId][physicsKey];

  return flatten(map(sourceKeys, function(sourceKey) {
    return getBySourceKey(saveId, sourceKey);
  }));
}

function tick () {
  return;
}

module.exports = {
  type: 'PhysicsSystem',
  func: function EnsemblePhysicsSystem () {
    return {
      tick: tick,
      getBySourceKey: getBySourceKey,
      getByPhysicsKey: getByPhysicsKey,
      create: create,
      register: create,
      updated: updated,
      added: added,
      changed: changed,
      removed: removed
    };
  }
};