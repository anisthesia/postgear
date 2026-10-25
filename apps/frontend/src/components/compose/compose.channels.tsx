'use client';

import { FC } from 'react';
import clsx from 'clsx';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { Integrations } from '@gitroom/frontend/components/launches/calendar.context';

export const ComposeChannels: FC<{
  available: Integrations[];
  channels: string[];
  counts: Record<string, { used: number; max?: number }>;
  issues: Record<string, string>;
  onToggle: (id: string) => void;
  onSaveDefault: () => void;
}> = ({ available, channels, counts, issues, onToggle, onSaveDefault }) => {
  const t = useT();
  return (
    <div className="flex flex-col gap-[8px]">
      <div className="flex items-center justify-between text-[12px] text-textItemBlur">
        <div>{t('channels', 'Channels')}</div>
        <button
          onClick={onSaveDefault}
          disabled={!channels.length}
          className="hover:text-newTextColor disabled:opacity-50"
        >
          {t('compose_save_default', 'Save as default')}
        </button>
      </div>
      <div className="flex flex-wrap gap-[6px]">
        {available.map((integration) => {
          const active = channels.includes(integration.id);
          const count = counts[integration.id];
          const over = !!count?.max && count.used > count.max;
          return (
            <button
              key={integration.id}
              onClick={() => onToggle(integration.id)}
              className={clsx(
                'flex items-center gap-[6px] h-[32px] ps-[4px] pe-[10px] rounded-full border text-[13px]',
                active
                  ? 'border-btnPrimary bg-newBgColorInner text-newTextColor'
                  : 'border-newBgLineColor text-textItemBlur hover:text-newTextColor'
              )}
            >
              <img
                src={integration.picture}
                alt=""
                className="w-[24px] h-[24px] rounded-full"
              />
              <span className="max-w-[110px] truncate">{integration.name}</span>
              {active && count && (
                <span className={clsx('text-[11px]', over && 'text-red-400')}>
                  {count.used}
                  {count.max ? `/${count.max}` : ''}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {channels.map((id) =>
        issues[id] ? (
          <div key={id} className="text-[12px] text-red-400">
            {issues[id]}
          </div>
        ) : null
      )}
    </div>
  );
};
