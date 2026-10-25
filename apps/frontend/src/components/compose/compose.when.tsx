'use client';

import { FC } from 'react';
import clsx from 'clsx';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { ComposeWhen } from '@gitroom/frontend/components/compose/use.compose';

export const ComposeWhenChips: FC<{
  when: ComposeWhen;
  onChange: (when: ComposeWhen) => void;
}> = ({ when, onChange }) => {
  const t = useT();
  const chip = (active: boolean) =>
    clsx(
      'h-[32px] px-[12px] rounded-full border text-[13px] flex items-center',
      active
        ? 'border-btnPrimary bg-newBgColorInner text-newTextColor'
        : 'border-newBgLineColor text-textItemBlur hover:text-newTextColor'
    );
  return (
    <div className="flex flex-col gap-[8px]">
      <div className="text-[12px] text-textItemBlur">{t('when', 'When')}</div>
      <div className="flex flex-wrap gap-[6px] items-center">
        <button
          className={chip(when.kind === 'slot')}
          onClick={() => onChange({ kind: 'slot' })}
        >
          {t('compose_next_slot', 'Next free slot')}
        </button>
        <button
          className={chip(when.kind === 'tonight')}
          onClick={() => onChange({ kind: 'tonight' })}
        >
          {t('compose_tonight', 'Tonight')}
        </button>
        <input
          type="datetime-local"
          value={when.kind === 'date' ? when.date : ''}
          onChange={(e) =>
            e.target.value && onChange({ kind: 'date', date: e.target.value })
          }
          className={clsx(
            chip(when.kind === 'date'),
            'bg-transparent outline-none'
          )}
        />
      </div>
    </div>
  );
};
