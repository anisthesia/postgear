'use client';

import { FC, useState } from 'react';
import clsx from 'clsx';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { showMediaBox } from '@gitroom/frontend/components/media/media.component';
import { useCalendar } from '@gitroom/frontend/components/launches/calendar.context';
import { useCompose } from '@gitroom/frontend/components/compose/use.compose';

export const QuickPostSheet: FC = () => {
  const t = useT();
  const { integrations, reloadCalendarView } = useCalendar();
  const compose = useCompose(integrations, reloadCalendarView);
  const [now, setNow] = useState(false);

  if (!compose.open) {
    return null;
  }

  const close = () => {
    setNow(false);
    compose.reset();
  };

  const pick = (when: Parameters<typeof compose.setWhen>[0]) => {
    setNow(false);
    compose.setWhen(when);
  };

  const submit = async () => {
    if (await compose.submit(now ? 'now' : 'schedule')) {
      setNow(false);
    }
  };

  const chip = (active: boolean) =>
    clsx(
      'h-[44px] rounded-[8px] border text-[14px] flex items-center justify-center bg-transparent outline-none',
      active
        ? 'border-btnPrimary bg-newBgColorInner text-newTextColor'
        : 'border-newBgLineColor text-textItemBlur'
    );

  const media = compose.media[0];

  return (
    <>
      <div className="fixed inset-0 z-[149] bg-black/50" onClick={close} />
      <div className="fixed start-0 end-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-[150] max-h-[calc(100vh-72px)] overflow-y-auto rounded-t-[16px] bg-newBgColorInner border-t border-newBgLineColor p-[16px] flex flex-col gap-[16px]">
        <div className="flex items-center justify-between">
          <div className="text-[16px] font-[600]">
            {t('compose_new_post', 'New post')}
          </div>
          <button
            onClick={close}
            aria-label={t('close', 'Close')}
            className="w-[44px] h-[44px] -me-[12px] text-textItemBlur"
          >
            ✕
          </button>
        </div>
        <textarea
          autoFocus
          value={compose.text}
          onChange={(e) => compose.setText(e.target.value)}
          placeholder={t('compose_placeholder', 'What do you want to share?')}
          className="min-h-[140px] resize-none rounded-[8px] bg-transparent border border-newBgLineColor p-[12px] text-[16px] outline-none"
        />
        {media ? (
          <button
            onClick={() => compose.setMedia([])}
            className="h-[44px] px-[12px] rounded-[8px] bg-btnSimple text-[13px] text-start truncate"
          >
            {media.path.split('/').pop()?.slice(-28)} ✕
          </button>
        ) : (
          <button
            onClick={() => showMediaBox((m) => compose.setMedia([m]))}
            className="h-[44px] rounded-[8px] border border-dashed border-newBgLineColor text-[14px] text-textItemBlur"
          >
            + {t('compose_add_media', 'Add media')}
          </button>
        )}
        <div className="flex gap-[8px] overflow-x-auto -mx-[16px] px-[16px]">
          {compose.available.map((integration) => (
            <button
              key={integration.id}
              onClick={() => compose.toggleChannel(integration.id)}
              className={clsx(
                'shrink-0 flex items-center gap-[6px] h-[44px] ps-[6px] pe-[12px] rounded-full border text-[14px]',
                compose.channels.includes(integration.id)
                  ? 'border-btnPrimary bg-newBgColorInner text-newTextColor'
                  : 'border-newBgLineColor text-textItemBlur'
              )}
            >
              <img
                src={integration.picture}
                alt=""
                className="w-[30px] h-[30px] rounded-full"
              />
              <span className="max-w-[110px] truncate">{integration.name}</span>
            </button>
          ))}
        </div>
        {compose.channels.map((id) =>
          compose.issues[id] ? (
            <div key={id} className="text-[13px] text-red-400">
              {compose.issues[id]}
            </div>
          ) : null
        )}
        <div className="grid grid-cols-2 gap-[8px]">
          <button
            className={chip(!now && compose.when.kind === 'slot')}
            onClick={() => pick({ kind: 'slot' })}
          >
            {t('compose_next_slot', 'Next free slot')}
          </button>
          <button
            className={chip(!now && compose.when.kind === 'tonight')}
            onClick={() => pick({ kind: 'tonight' })}
          >
            {t('compose_tonight', 'Tonight')}
          </button>
          <button className={chip(now)} onClick={() => setNow(true)}>
            {t('compose_post_now', 'Post now')}
          </button>
          <input
            type="datetime-local"
            value={compose.when.kind === 'date' ? compose.when.date : ''}
            onChange={(e) =>
              e.target.value && pick({ kind: 'date', date: e.target.value })
            }
            className={chip(!now && compose.when.kind === 'date')}
          />
        </div>
        <button
          onClick={submit}
          disabled={compose.loading || Object.keys(compose.issues).length > 0}
          className="h-[48px] w-full rounded-[8px] bg-btnPrimary text-white text-[15px] font-[600] disabled:opacity-50"
        >
          {now
            ? t('compose_post_now', 'Post now')
            : t('compose_schedule', 'Schedule')}
        </button>
      </div>
    </>
  );
};
