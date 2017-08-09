/* eslint-disable import/prefer-default-export */
import Location from '../models/Location';

export const update = scServer => (socketData) => {
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
  const { device } = data;
  scServer.exchange.publish(device, data);
  Location.create(data);
};
