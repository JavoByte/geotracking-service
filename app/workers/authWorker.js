/* eslint-disable import/prefer-default-export */
import jwt from 'jsonwebtoken';
import config from '../../config';

export const authenticate = (scServer, socket) => (socketData, respond) => {
  let data = null;
  if (!(socketData instanceof Object)) {
    try {
      data = JSON.parse(socketData);
    } catch (error) {
      // Handle error
      return;
    }
  } else {
    data = socketData;
  }
  const { token } = data;
  jwt.verify(token, config.key, (error, payload) => {
    if (error) {
      respond(error.message);
    } else {
      respond();
      socket.setAuthToken(payload);
    }
  });
};
