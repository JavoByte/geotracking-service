import fs from 'fs';
import scErrors from 'sc-errors';
import minimist from 'minimist';
import { SocketCluster } from 'socketcluster';

const argv = minimist(process.argv.slice(2));
const TimeoutError = scErrors.TimeoutError;


const workerControllerPath = argv.wc || process.env.SOCKETCLUSTER_WORKER_CONTROLLER;
const brokerControllerPath = argv.bc || process.env.SOCKETCLUSTER_BROKER_CONTROLLER;
const initControllerPath = argv.ic || process.env.SOCKETCLUSTER_INIT_CONTROLLER;
const environment = process.env.ENV || 'dev';

const options = {
  workers: Number(argv.w) || Number(process.env.SOCKETCLUSTER_WORKERS) || 1,
  brokers: Number(argv.b) || Number(process.env.SOCKETCLUSTER_BROKERS) || 1,
  port: Number(argv.p) || Number(process.env.SOCKETCLUSTER_PORT) || 8000,
  // If your system doesn't support 'uws',
  // you can switch to 'ws' (which is slower but works on older systems).
  wsEngine: process.env.SOCKETCLUSTER_WS_ENGINE || 'uws',
  appName: argv.n || process.env.SOCKETCLUSTER_APP_NAME || null,
  workerController: workerControllerPath || __dirname + '/worker.js',
  brokerController: brokerControllerPath || __dirname + '/broker.js',
  initController: initControllerPath || null,
  socketChannelLimit: Number(process.env.SOCKETCLUSTER_SOCKET_CHANNEL_LIMIT) || 1000,
  clusterStateServerHost: argv.cssh || process.env.SCC_STATE_SERVER_HOST || null,
  clusterStateServerPort: process.env.SCC_STATE_SERVER_PORT || null,
  clusterAuthKey: process.env.SCC_AUTH_KEY || null,
  clusterInstanceIp: process.env.SCC_INSTANCE_IP || null,
  clusterInstanceIpFamily: process.env.SCC_INSTANCE_IP_FAMILY || null,
  clusterStateServerConnectTimeout: Number(process.env.SCC_STATE_SERVER_CONNECT_TIMEOUT) || null,
  clusterStateServerAckTimeout: Number(process.env.SCC_STATE_SERVER_ACK_TIMEOUT) || null,
  clusterStateServerReconnectRandomness: Number(
    process.env.SCC_STATE_SERVER_RECONNECT_RANDOMNESS) || null,
  crashWorkerOnError: argv['auto-reboot'] !== false,
  // If using nodemon, set this to true, and make sure that environment is 'dev'.
  killMasterOnSignal: false,
  environment,
};

const SOCKETCLUSTER_CONTROLLER_BOOT_TIMEOUT = Number(
  process.env.SOCKETCLUSTER_CONTROLLER_BOOT_TIMEOUT) || 10000;
let SOCKETCLUSTER_OPTIONS;

if (process.env.SOCKETCLUSTER_OPTIONS) {
  SOCKETCLUSTER_OPTIONS = JSON.parse(process.env.SOCKETCLUSTER_OPTIONS);
}

for (let i in SOCKETCLUSTER_OPTIONS) {
  if (SOCKETCLUSTER_OPTIONS.hasOwnProperty(i)) {
    options[i] = SOCKETCLUSTER_OPTIONS[i];
  }
}

const optionsControllerPath = argv.oc || process.env.SOCKETCLUSTER_OPTIONS_CONTROLLER;
const masterControllerPath = argv.mc || process.env.SOCKETCLUSTER_MASTER_CONTROLLER;

const fileExists = (filePath, callback) => {
  fs.access(filePath, fs.constants.F_OK, (err) => {
    callback(!err);
  });
};

const runMasterController = (socketCluster, filePath) => {
  const masterController = require(filePath);
  masterController.run(socketCluster);
};

const launch = (startOptions) => {
  const socketCluster = new SocketCluster(startOptions);
  let masterController;

  if (masterControllerPath) {
    runMasterController(socketCluster, masterControllerPath);
  } else {
    var defaultMasterControllerPath = __dirname + '/master.js';
    fileExists(defaultMasterControllerPath, (exists) => {
      if (exists) {
        runMasterController(socketCluster, defaultMasterControllerPath);
      }
    });
  }
};

const start = () => {
  if (optionsControllerPath) {
    const optionsController = require(optionsControllerPath);
    optionsController.run(options, launch);
  } else {
    launch(options);
  }
};

const bootCheckInterval = Number(process.env.SOCKETCLUSTER_BOOT_CHECK_INTERVAL) || 200;
const bootStartTime = Date.now();

// Detect when Docker volumes are ready.
const startWhenFileIsReady = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      resolve();
      return;
    }
    const checkIsReady = () => {
      const now = Date.now();

      fileExists(filePath, (exists) => {
        if (exists) {
          resolve();
        } else if (now - bootStartTime >= SOCKETCLUSTER_CONTROLLER_BOOT_TIMEOUT) {
          const errorMessage = `Could not locate a controller file at path ${filePath} ` +
            'before SOCKETCLUSTER_CONTROLLER_BOOT_TIMEOUT';
          const volumeBootTimeoutError = new TimeoutError(errorMessage);
          reject(volumeBootTimeoutError);
        } else {
          setTimeout(checkIsReady, bootCheckInterval);
        }
      });
    };
    checkIsReady();
  });
};

const filesReadyPromises = [
  startWhenFileIsReady(optionsControllerPath),
  startWhenFileIsReady(masterControllerPath),
  startWhenFileIsReady(workerControllerPath),
  startWhenFileIsReady(brokerControllerPath),
  startWhenFileIsReady(initControllerPath),
];
Promise.all(filesReadyPromises)
  .then(() => {
    start();
  })
  .catch((err) => {
    console.error(err.stack);
    process.exit(1);
  });
