# Node.js real-time dashboard powered by Redis

This project provides a very basic Node.js dashboard server which streams real-time statistics to connected browsers. 

It showcases the usage of the [`redis-timeseries`](https://github.com/tonyskn/node-redis-timeseries) module.

## Getting started

First, install the dependencies:

```
npm install
bower install
```

Then start the server with `grunt`. You can override the Redis host and port by setting the `REDIS_HOST` and `REDIS_PORT` environment variables.

Point your browser to `http://localhost:3000`, and watch the statistics counters update in real time:

![image](https://raw.github.com/tonyskn/node-dashboard/master/screenshot.png)

## Generating statistics

The server subscribes to the Redis channels `hits:*` and updates time series data in Redis on each hit.

In order to generate hits from your application code, you just have to publish the hit timestamp in seconds to the Redis channel `hits:your_stats_key`.  This is how it would be done in Node.js:

```javascript
redis.publish('hits:your_stats_key', Date.now() / 1000);
```

New keys that hit the server are immediately sent to the connected browsers, and new charts will appear in the dashboard.

To generate random hits when in development, just run the script `src/hit-simulator.js`.

