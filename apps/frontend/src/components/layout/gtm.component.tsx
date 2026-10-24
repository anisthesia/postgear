'use client';

import Script from 'next/script';
import { FC } from 'react';

export const GoogleTagManagerComponent: FC<{ gtmId?: string }> = ({
  gtmId,
}) => {
  if (!gtmId) {
    return null;
  }
  return (
    <>
      <Script src="/g.js" strategy="afterInteractive" />

      <Script id="google-ads-gtag" strategy="afterInteractive">
        {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gtmId}');
  `}
      </Script>
    </>
  );
};
