const next = require('next');
const { createServer } = require('http');
const appInsights = require('applicationinsights');

const initAppInsights = (instrumentationKey) => {
  if (!instrumentationKey) {
    console.log('Application Insights instrumentation key not provided. Skipping setup.');
    return false;
  }

  appInsights
    .setup(instrumentationKey)
    .setAutoCollectConsole(true, true)
    .setSendLiveMetrics(true)
    .start();

  return true;
};

const startTime = Date.now();
const env = process.env.APP_ENV || process.env.NODE_ENV || 'production';
const useAppInsights = initAppInsights(process.env.NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING); // initAppInsights(process.env.NEXT_PUBLIC_APPINSIGHTS_INSTRUMENTATIONKEY);
const serverConfig = {
  hostname: process.env.HOSTNAME || 'localhost',
  port: process.env.PORT || 3000,
  dev: env === 'development',
  dir: '.',
  quiet: false
};

const app = next(serverConfig);
const handleNextRequests = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    const requestStartTime = Date.now();

    if (useAppInsights) {
      res.on('finish', () => {
        const duration = Date.now() - requestStartTime;
        appInsights.defaultClient.trackRequest({
          name: `${req.method} ${req.url}`,
          url: req.url,
          duration,
          resultCode: res.statusCode,
          success: res.statusCode < 400,
          properties: { method: req.method }
        });
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
      process.exit(1);
    })
    .listen(serverConfig.port, serverConfig.hostname, () => {
      if (useAppInsights) {
        const duration = Date.now() - startTime;

        appInsights.defaultClient.trackMetric({
          name: 'server_startup_time',
          value: duration
        });
      }

      console.log(`Ready on http://${serverConfig.hostname}:${serverConfig.port}`);
    });
});
