/* eslint-disable import/prefer-default-export */

export const messageHandler = scServer => (socketData) => {
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
  scServer.exchange.publish(device, {
    data,
    event: 'message',
  });

  scServer.exchange.publish('message', {
    data,
  });
};
