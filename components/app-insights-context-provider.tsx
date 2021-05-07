import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin, AppInsightsContext } from '@microsoft/applicationinsights-react-js';

let reactPlugin: ReactPlugin;
let appInsights: ApplicationInsights;

const initialize = (instrumentationKey: string) => {
  if (!instrumentationKey) {
    throw new Error('Could not initialize App Insights: `instrumentationKey` was not provided');
  }

  reactPlugin = new ReactPlugin();

  appInsights = new ApplicationInsights({
    config: {
      instrumentationKey,
      extensions: [reactPlugin]
    }
  });

  appInsights.loadAppInsights();
}

const handleRouteChange = (url: string) => {
  if (!reactPlugin) {
    return;
  }

  reactPlugin.trackPageView({
    uri: url
  });
}

const AppInsightContextProvider = ({ children }: {children: ReactNode}) => {
  const [isInitialized, setInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const instrumentationKey = process.env.NEXT_PUBLIC_APPINSIGHTS_INSTRUMENTATIONKEY;

    if (!instrumentationKey || !!appInsights) {
      return;
    }

    if (!router.isReady) {
      return;
    }

    initialize(instrumentationKey);

    handleRouteChange(router.asPath);

    setInitialized(true);
  }, [router.asPath, router.isReady]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [isInitialized, router.events]);

  return (
    <AppInsightsContext.Provider value={reactPlugin}>
      {children}
    </AppInsightsContext.Provider>
  )
}

export default AppInsightContextProvider;
