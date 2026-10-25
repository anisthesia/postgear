'use client';

import { FC, useState } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { ComposeSaveType } from '@gitroom/frontend/components/compose/use.compose';

export const ComposeFooter: FC<{
  loading: boolean;
  onSubmit: (type: ComposeSaveType) => void;
}> = ({ loading, onSubmit }) => {
  const t = useT();
  const [more, setMore] = useState(false);
  return (
    <div className="flex items-center gap-[8px] relative">
      <button
        disabled={loading}
        onClick={() => onSubmit('draft')}
        className="h-[40px] px-[16px] rounded-[8px] bg-btnSimple text-[14px] disabled:opacity-50"
      >
        {t('save_draft', 'Save draft')}
      </button>
      <button
        disabled={loading}
        onClick={() => onSubmit('schedule')}
        className="flex-1 h-[40px] px-[16px] rounded-[8px] bg-btnPrimary text-accentFg text-[14px] disabled:opacity-50 flex items-center justify-center gap-[8px]"
      >
        {t('schedule', 'Schedule')}
        <kbd className="text-[11px] font-sans opacity-70">⌘↵</kbd>
      </button>
      <button
        aria-label={t('more', 'More')}
        onClick={() => setMore(!more)}
        className="h-[40px] w-[40px] rounded-[8px] bg-btnSimple text-[16px]"
      >
        ⋯
      </button>
      {more && (
        <div className="absolute bottom-[48px] end-0 rounded-[8px] bg-newBgColorInner border border-newBgLineColor p-[4px] z-10">
          <button
            disabled={loading}
            onClick={() => {
              setMore(false);
              onSubmit('now');
            }}
            className="h-[32px] px-[12px] rounded-[6px] hover:bg-btnSimple text-[13px] whitespace-nowrap"
          >
            {t('post_now', 'Post now')}
          </button>
        </div>
      )}
    </div>
  );
};
