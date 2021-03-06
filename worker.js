import fs from 'fs';
import express from 'express';
import serveStatic from 'serve-static';
import path from 'path';
import morgan from 'morgan';
import healthChecker from 'sc-framework-health-check';

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

  // Add GET /health-check express route
  healthChecker.attach(worker, app);

  httpServer.on('request', app);

  let count = 0;

  /*
    In here we handle our incoming realtime connections and listen for events.
  */
  scServer.on('connection', (socket) => {
    // Some sample logic to show how to handle client events,
    // replace this with your own logic

    socket.on('sampleClientEvent', (data) => {
      count += 1;
      console.log('Handled sampleClientEvent', data);
      scServer.exchange.publish('sample', count);
    });

    const interval = setInterval(() => {
      socket.emit('rand', {
        rand: Math.floor(Math.random() * 5),
      });
    }, 1000);

    socket.on('disconnect', () => {
      clearInterval(interval);
    });
  });
};
