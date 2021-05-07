export function logPageView (url: string) {
  window.gtag('config', process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS || '', {
    page_path: url
  });
}

// eslint-disable-next-line no-undef
export function logEvent ({ action, params }: {action: string, params: Gtag.EventParams}) {
  window.gtag('event', action, params);
}
