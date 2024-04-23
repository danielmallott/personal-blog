'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { getLocalStorage, setLocalStorage } from '../lib/storage-helper';

export default function CookieBanner () {
  const [cookieConsent, setCookieConsent] = useState(false);
  const [cookieBannerVisible, setCookieBannerVisible] = useState(true);

  useEffect(() => {
    const storedCookieConsent = getLocalStorage('cookieConsent', null);
    const storedShowCookieBanner = getLocalStorage('showCookieBanner', true);

    setCookieBannerVisible(storedShowCookieBanner);

    setCookieConsent(storedCookieConsent);
    updateAnalyticsConsent(cookieConsent);
  });

  function updateAnalyticsConsent (cookieConsent: boolean) {
    const newValue = cookieConsent ? 'granted' : 'denied';

    window.gtag('consent', 'update', {
      analytics_storage: newValue
    });
  }

  function updateCookieBannerVisibility (cookieBannerVisible: boolean) {
    setLocalStorage('showCookieBanner', cookieBannerVisible);
    setCookieBannerVisible(cookieBannerVisible);
  }

  const handleAccept = () => {
    updateCookieBannerVisibility(false);
    setCookieConsent(true);
    setLocalStorage('cookieConsent', true);
    updateAnalyticsConsent(true);
  }

  const handleDecline = () => {
    updateCookieBannerVisibility(false);
    setCookieConsent(false);
    setLocalStorage('cookieConsent', false);
  }

  return (
    <Container fluid className={`${cookieBannerVisible ? 'd-flex' : 'd-none'}`}>
        <Row id="cookie-banner" className="alert alert-dark text-center mb-0 cookie-banner" role="alert">
            <Col>
                This website uses cookies to ensure you get the best experience. <Link href="/info/cookies">Learn More</Link>.  <Button type='button' variant='primary' size='sm' onClick={handleAccept}>Accept</Button>  <Button type='button' variant='secondary' size='sm' onClick={handleDecline}>Decline</Button>
            </Col>
        </Row>
    </Container>
  );
}
// className={`${cookieConsent !== null ? 'd-none' : 'd-flex'}`}
