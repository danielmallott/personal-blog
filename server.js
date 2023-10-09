const next = require('next')
const { createServer } = require('http')
const appInsights = require('applicationinsights')

const initAppInsights = (instrumentationKey) => {
  if (!instrumentationKey) {
    return false;
  }

  appInsights
    .setup(instrumentationKey)
    .setAutoCollectConsole(true, true)
    .setSendLiveMetrics(true)
    .start();

  return true;
}

const startTime = Date.now();
const env = process.env.APP_ENV || process.env.NODE_ENV || 'production';
const useAppInsights = initAppInsights(process.env.NEXT_PUBLIC_APPINSIGHTS_INSTRUMENTATIONKEY);
const serverConfig = {
  hostname: process.env.HOSTNAME || 'localhost',
  port: process.env.PORT || 3000,
  dev: env === 'development',
  dir: '.',
  quiet: false
}

const app = next(serverConfig);
const handleNextRequests = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    if (useAppInsights) {
      appInsights.defaultClient.trackNodeHttpRequest({
        request: req,
        response: res
      });
    }

    try {
      await handleNextRequests(req, res);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1)
    })
    .listen(serverConfig.port, serverConfig.hostname, () => {
      if (useAppInsights) {
        const duration = Date.now() - startTime

        appInsights.defaultClient.trackMetric({
          name: 'server startup time',
          value: duration
        });
      }

      console.log(`Ready on http://${serverConfig.hostname}:${serverConfig.port}`);
    });
});

// const startServer = async (config) => {
//   const serverOptions = {
//     dev: config.env === 'development',
//     dir: '.',
//     quiet: false
//   };

//   const app = await next(serverOptions);
//   const handleNextRequests = await app.getRequestHandler();

//   const srv = createServer((req, res) => {
//     if (config.useAppInsights) {
//       appInsights.defaultClient.trackNodeHttpRequest({
//         request: req,
//         response: res
//       });
//     }

//     handleNextRequests(req, res);
//   });

//   await new Promise((resolve, reject) => {
//     srv.on('error', reject);
//     srv.on('listening', () => resolve());
//     srv.listen(config.port, config.hostname);
//   });

//   return app;
// }

// startServer(serverConfig)
//   .then(async (app) => {
//     console.log(`started server on host ${serverConfig.hostname}, port ${serverConfig.port}, env ${serverConfig.env}`);

//     if (serverConfig.useAppInsights) {
//       const duration = Date.now() - startTime

//       appInsights.defaultClient.trackMetric({
//         name: 'server startup time',
//         value: duration
//       });
//     }

//     await app.prepare();
//   })
//   .catch((err) => {
//     console.error(err);

//     process.exit(1);
//   });
