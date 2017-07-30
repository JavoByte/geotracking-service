SocketCluster Geotracker
========================

Service socket cluster is mountend on `ws://localhost:8000/socketcluster`
after starting server with

`yarn start`

To start tracking (or updating) an IMEI position, first we need to connect to
the socketCluster server. For example, with
[SocketCluster Client](https://github.com/SocketCluster/socketcluster-client):


```javascript

var imei = "AnIMEI";

var socket = socketClusterClient.connect({
  hostname: 'localhost',
  port: 8000,
});

socket.on('connect', () => {
  console.log("Socket cluster connected");
});

```

To update IMEI position just connect to the IMEI channel.

```javascript
socket.publish(imei, {latitude: newLatitude, longitude: newLongitude})
```

Or our preferred way,

```javascript

var channel = socket.subscribe(imei);
channel.publish({latitude: newLatitude, longitude: newLongitude});

```

To watch IMEI updates, we just need to listen (watch) messages to the channel.

```javascript

channel.watch((data) => {
  console.log('Received data from channel', imei, data);

});

```

## CONTRUBUTING

Please check our `.editorconfig` and `eslint.json` files to code guidelines. We also recommend
using an editor capable  highlight syntax reading these files, like _SublimeText_

This project is built with [SocketCluster](https://socketcluster.io/)
