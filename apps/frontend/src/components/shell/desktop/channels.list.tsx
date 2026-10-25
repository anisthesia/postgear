'use client';

import { FC, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import ImageWithFallback from '@gitroom/react/helpers/image.with.fallback';
import { useCalendar } from '@gitroom/frontend/components/launches/calendar.context';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

// Channels as a filter for the visible range. Posts in the calendar context are
// already filtered by the selection, so unselected channels show no count.
export const ChannelsList: FC = () => {
  const { integrations, posts, customer, selectedChannels, setSelectedChannels } =
    useCalendar();
  const t = useT();

  const visible = useMemo(
    () =>
      integrations.filter(
        (i) => !i.disabled && (!customer || i.customer?.id === customer)
      ),
    [integrations, customer]
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach((p) =>
      map.set(p.integration.id, (map.get(p.integration.id) || 0) + 1)
    );
    return map;
  }, [posts]);

  const toggle = useCallback(
    (id: string) => () => {
      const current = selectedChannels || [];
      const next = current.includes(id)
        ? current.filter((c) => c !== id)
        : [...current, id];
      setSelectedChannels(next.length ? next : null);
    },
    [selectedChannels, setSelectedChannels]
  );

  if (!visible.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-[2px]">
      <div className="px-[8px] pb-[4px] text-[11px] font-[600] uppercase tracking-wide text-textItemBlur">
        {t('channels', 'Channels')}
      </div>
      {visible.map((integration) => {
        const active = !selectedChannels || selectedChannels.includes(integration.id);
        return (
          <button
            key={integration.id}
            onClick={toggle(integration.id)}
            className={clsx(
              'flex items-center gap-[8px] px-[8px] h-[32px] rounded-[8px] text-[13px] hover:bg-boxFocused transition-colors',
              selectedChannels?.includes(integration.id) && 'bg-boxFocused',
              !active && 'opacity-50'
            )}
          >
            <ImageWithFallback
              fallbackSrc={`/icons/platforms/${integration.identifier}.png`}
              src={integration.picture}
              className="rounded-full"
              alt={integration.identifier}
              width={20}
              height={20}
            />
            <span className="flex-1 min-w-0 truncate text-start">
              {integration.name}
            </span>
            <span className="text-textItemBlur tabular-nums">
              {counts.get(integration.id) || ''}
            </span>
          </button>
        );
      })}
    </div>
  );
};
