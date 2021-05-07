import { AppProps } from 'next/dist/next-server/lib/router/router';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import AppInsightContextProvider from '../components/app-insights-context-provider';
import { logPageView } from '../lib/ga';
import '../styles/main.scss';

function MyApp ({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      logPageView(url);
    }

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    }
  }, [router.events]);

  return (
    <AppInsightContextProvider>
      <Component {...pageProps} />
    </AppInsightContextProvider>
  );
}

export default MyApp
