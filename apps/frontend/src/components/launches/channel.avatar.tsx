'use client';

import { FC } from 'react';
import clsx from 'clsx';
import ImageWithFallback from '@gitroom/react/helpers/image.with.fallback';
import { useProviderNames } from '@gitroom/frontend/components/launches/helpers/use.integration.list';

// A channel picture with its platform badge, the platform and handle on hover,
// so two channels with the same name and picture can be told apart.
export const ChannelAvatar: FC<{
  integration: {
    identifier: string;
    picture?: string;
    display?: string;
    refreshNeeded?: boolean;
  };
  size: number;
}> = ({ integration, size }) => {
  const { data: names } = useProviderNames();
  const badge = Math.round(size * 0.55);
  const tooltip = [
    names?.[integration.identifier] || integration.identifier,
    integration.display &&
      (integration.display.startsWith('@')
        ? integration.display
        : `@${integration.display}`),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <span
      className="relative shrink-0"
      style={{ width: size, height: size }}
      // a disconnected channel keeps the reconnect hint of its row
      {...(!integration.refreshNeeded && {
        'data-tooltip-id': 'tooltip',
        'data-tooltip-content': tooltip,
      })}
    >
      <ImageWithFallback
        fallbackSrc={`/icons/platforms/${integration.identifier}.png`}
        src={integration.picture || '/no-picture.jpg'}
        className="rounded-full"
        alt={integration.identifier}
        width={size}
        height={size}
      />
      <img
        src={
          integration.identifier === 'youtube'
            ? '/icons/platforms/youtube.svg'
            : `/icons/platforms/${integration.identifier}.png`
        }
        alt=""
        className={clsx(
          'absolute -bottom-[3px] -end-[3px] rounded-full',
          integration.identifier !== 'youtube' && 'border border-newBgColorInner'
        )}
        style={{ width: badge, height: badge }}
      />
    </span>
  );
};
