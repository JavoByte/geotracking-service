/* eslint-disable no-console */

import express from 'express';
import serveStatic from 'serve-static';
import path from 'path';
import mongoose from 'mongoose';
import morgan from 'morgan';
import healthChecker from 'sc-framework-health-check';
import locationsController from './app/controllers/locationsController';
import * as locationWorker from './app/workers/locationWorker';

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
  app.use('/locations', locationsController);

  // Add GET /health-check express route
  healthChecker.attach(worker, app);

  const db = mongoose.connect('mongodb://localhost:27017/geotracker', { useMongoClient: true });

  db.once('open', () => {
    console.log('   >>', process.pid, 'connected to database');
    httpServer.on('request', app);
    /*
      In here we handle our incoming realtime connections and listen for events.
    */
    scServer.on('connection', (socket) => {
      socket.on('location.update', locationWorker.update(scServer));
    });
  });
};
