/* eslint-disable no-console */

import express from 'express';
import serveStatic from 'serve-static';
import path from 'path';
import mongoose from 'mongoose';
import morgan from 'morgan';
import healthChecker from 'sc-framework-health-check';
import config from './config';
import locationsController from './app/controllers/locationsController';
import authController from './app/controllers/authController';
import * as authWorker from './app/workers/authWorker';
import * as locationWorker from './app/workers/locationWorker';
import * as messagesWorker from './app/workers/messagesWorker';

module.exports.run = (worker) => {
  console.log('   >> Worker PID:', process.pid);
  const environment = worker.options.environment;

  const app = express();

  const httpServer = worker.httpServer;
  const scServer = worker.scServer;

  if (environment === 'dev') {
    // Log every HTTP request. See https://github.com/expressjs/morgan for other
    // available formats.
    app.use(morgan('dev'));
  }
  app.use(serveStatic(path.resolve(__dirname, 'public')));
  app.use('/auth', authController);
  app.use('/locations', locationsController);

  // Add GET /health-check express route
  healthChecker.attach(worker, app);

  const db = mongoose.connect(config.mongodb, {
    useMongoClient: true,
    promiseLibrary: global.Promise,
  });

  db.once('open', () => {
    console.log('   >>', process.pid, 'connected to database');
    httpServer.on('request', app);
    /*
      In here we handle our incoming realtime connections and listen for events.
    */

    scServer.addMiddleware(scServer.MIDDLEWARE_EMIT, (req, next) => {
      if (req.event === 'location.update') {
        if (req.socket.authToken) {
          next();
        } else {
          next('Unathenticated');
        }
      } else {
        next();
      }
    });

    scServer.on('connection', (socket) => {
      socket.on('trackerauth', authWorker.authenticate(scServer, socket));
      socket.on('location.update', locationWorker.update(scServer, socket));
      socket.on('message', messagesWorker.messageHandler(scServer, socket));
    });
  });
};
