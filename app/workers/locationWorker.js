/* eslint-disable import/prefer-default-export */
import validate from 'validate.js';
import Device from '../models/Device';
import Location from '../models/Location';

export const getLast = scServer => (socketData) => {
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
  Device.findOne({ identifier: device }).then((deviceObject) => {
    Location.findOne({
      // eslint-disable-next-line no-underscore-dangle
      device: deviceObject._id,
    }).select({
      _id: 0,
      latitude: 1,
      longitude: 1,
      timestamp: 1,
    }).sort({
      timestamp: -1,
    }).then((location) => {
      if (location) {
        scServer.exchange.publish(device, {
          data: location,
          event: 'location.update',
        });
      }
    });
  });
};

export const update = (scServer, socket) => (socketData, respond) => {
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
  const errors = validate(data, {
    timestamp: {
      presence: true,
      numericality: {
        lessThanOrEqualTo: Math.ceil(+new Date() / 1000) + (1000 * 15), // 15 seconds tolerance,
        greaterThanOrEqualTo: 1483228800,
      },
    },
    longitude: {
      presence: true,
      numericality: true,
    },
    latitude: {
      presence: true,
      numericality: true,
    },
  });
  if (errors) {
    respond(errors);
  } else {
    const { device } = socket.authToken;
    Device.findOne({ identifier: device }).then((deviceObject) => {
      if (deviceObject) {
        scServer.exchange.publish(device, {
          data,
          event: 'location.update',
        });
        respond();
        // eslint-disable-next-line no-underscore-dangle
        Location.create({ ...data, device: deviceObject._id });
      } else {
        respond({
          device: 'Unexisting device',
        });
      }
    }).catch((error) => {
      respond({ error });
    });
  }
};
