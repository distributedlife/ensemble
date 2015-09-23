'use strict';

var appRoot = require('app-root-path');
var packageInfo = require(appRoot + '/package.json');
var logger = require('./logging/server/logger').logger;
var each = require('lodash').each;

var config = require('./util/config')(logger);
logger.logLevel = config.logging.logLevel;

var plugins = require('./plugins/plug-n-play').configure(
  logger,
  require('./conf/array-plugins'),
  require('./conf/default-mode-plugins'),
  config.logging.silencedPlugins
);

plugins.load({ type: 'Config', func: function Config () { return config; }});

var foldersToLoad = [
  'metrics',
  'core',
  'input',
  'events',
  'state',
  'validators',
  'debug'
];

each(foldersToLoad, function loadFolder (folder) {
  plugins.loadFrameworkPath(__dirname + '/' + folder + '/shared');
  plugins.loadFrameworkPath(__dirname + '/' + folder + '/server');
});

function runGameAtPath (path) {
  logger.info('ensemblejs@' + packageInfo.version + ' started.');

  plugins.loadPath(path + '/js/logic');
  plugins.loadPath(path + '/js/state');
  plugins.loadPath(path + '/js/events');
  plugins.loadPath(path + '/js/maps');

  function modesJsonExists (exists) {
    var game = {
      modes: exists ? require(path + '/js/modes.json') : ['game'],
      name: packageInfo.name
    };

    plugins.get('On').serverStart(path, game);
  }

  require('fs').exists(path + '/js/modes.json', modesJsonExists);
}

function shutdownHandler() {
  plugins.get('On').serverStop();
  process.exit();
}

process.on('SIGINT', shutdownHandler);
process.on('SIGTERM', shutdownHandler);
process.on('SIGHUP', shutdownHandler);
process.on('uncaughtException', plugins.get('On').error);
process.on('unhandledRejection', plugins.get('On').error);

module.exports = {
  runGameAtPath: runGameAtPath
};