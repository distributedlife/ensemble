'use strict';

var reject = require('lodash').reject;
var select = require('lodash').select;
var each = require('lodash').each;
var map = require('lodash').map;
var includes = require('lodash').includes;

module.exports = {
  type: 'DelayedJobs',
  deps: ['DefinePlugin', 'DynamicPluginLoader', 'StateMutator', 'Logger'],
  func: function (define, dynamicPluginLoader, mutate, logger) {
    var newJobs = [];
    var toCancel = [];
    var jobNames = [];

    function tick(jobs, dt) {
      return map(jobs, function subtractDeltaFromDuration (job) {
        if (job.duration === Infinity) {
          return job;
        }

        job.duration -= dt;
        return job;
      });
    }

    function ready (job) {
      return job.duration <= 0 && job.duration !== Infinity;
    }

    function cancelled (job) {
      return includes(toCancel, job.key);
    }

    define()('OnPhysicsFrame', function DelayedJobs () {
      return function tickActiveJobs (state, dt) {
        var jobs = state.for('ensemble').get('jobs');
        var gameId = state.for('ensemble').get('gameId');

        jobs = jobs.concat(newJobs);
        each(select(jobs, cancelled), devuxCheckJobName);
        jobs = reject(jobs, cancelled);
        jobs = tick(jobs, dt);

        var invoke = select(jobs, ready);
        each(invoke, function callOnCompleteHandlerForReadyJobs (job) {
          var callback = dynamicPluginLoader().get(job.plugin)[job.method];
          mutate()(gameId, callback(state));
        });

        newJobs = [];
        toCancel = [];

        return {
          ensemble: {
            jobs: reject(jobs, ready)
          }
        };
      };
    });

    function addJob (key, duration, plugin, method) {
      newJobs.push({
        key: key,
        duration: duration,
        plugin: plugin,
        method: method
      });
    }

    function add (key, duration, plugin, method) {
      addJob(key, duration, plugin, method);
      devuxAddKeyToList(key);
    }

    function cancelAll (key) {
      toCancel.push(key);
    }

    function devuxAddKeyToList (key) {
      if (includes(jobNames, key)) {
        return;
      }

      jobNames.push(key);
    }

    function devuxCheckJobName (job) {
      if (includes(jobNames, job.key)) {
        return;
      }

      logger().warn(['Can\'t cancel job', job.key, 'as it has never been added. Are you sure the job name is spelt correctly?'].join(' '));
    }

    return {
      add: add,
      cancelAll: cancelAll
    };
  }
};