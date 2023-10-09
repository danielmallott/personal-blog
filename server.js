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

const startServer = async (config) => {
  const serverOptions = {
    dev: config.env === 'development',
    dir: '.',
    quiet: false
  };

  const app = await next(serverOptions);
  const handleNextRequests = app.getRequestHandler();

  const srv = createServer((req, res) => {
    if (config.useAppInsights) {
      appInsights.defaultClient.trackNodeHttpRequest({
        request: req,
        response: res
      });
    }

    handleNextRequests(req, res);
  });

  await new Promise((resolve, reject) => {
    srv.on('error', reject);
    srv.on('listening', () => resolve());
    srv.listen(config.port, config.hostname);
  });

  return app;
}

const startTime = Date.now();

const serverConfig = {
  hostname: process.env.HOSTNAME || 'localhost',
  port: process.env.PORT || 3000,
  env: process.env.APP_ENV || process.env.NODE_ENV || 'production',
  useAppInsights: initAppInsights(process.env.NEXT_PUBLIC_APPINSIGHTS_INSTRUMENTATIONKEY)
}

startServer(serverConfig)
  .then(async (app) => {
    console.log(`started server on host ${serverConfig.hostname}, port ${serverConfig.port}, env ${serverConfig.env}`);

    if (serverConfig.useAppInsights) {
      const duration = Date.now() - startTime

      appInsights.defaultClient.trackMetric({
        name: 'server startup time',
        value: duration
      });
    }

    await app.prepare();
  })
  .catch((err) => {
    console.error(err);

    process.exit(1);
  });
