'use client';

import { FC } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useMediaDirectory } from '@gitroom/react/helpers/use.media.directory';
import { VideoOrImage } from '@gitroom/react/helpers/video.or.image';
import { Integrations } from '@gitroom/frontend/components/launches/calendar.context';
import { ComposeMedia } from '@gitroom/frontend/components/compose/use.compose';

export const ComposePreview: FC<{
  integration?: Integrations;
  text: string;
  media: ComposeMedia[];
  max?: number;
  onEditVariant: () => void;
}> = ({ integration, text, media, max, onEditVariant }) => {
  const t = useT();
  const mediaDir = useMediaDirectory();
  if (!integration) {
    return null;
  }
  const kept = max ? text.slice(0, max) : text;
  const cropped = max ? text.slice(max) : '';
  return (
    <div className="flex flex-col gap-[8px]">
      <div className="flex items-center justify-between text-[12px] text-textItemBlur">
        <div>{t('preview', 'Preview')}</div>
        <button onClick={onEditVariant} className="hover:text-newTextColor">
          {t('compose_edit_variant', 'Edit variant')}
        </button>
      </div>
      <div className="rounded-[8px] border border-newBgLineColor p-[12px] flex gap-[8px]">
        <img
          src={integration.picture}
          alt=""
          className="w-[32px] h-[32px] rounded-full"
        />
        <div className="flex-1 min-w-0 flex flex-col gap-[6px]">
          <div className="text-[13px] font-[600]">{integration.name}</div>
          <div className="text-[13px] whitespace-pre-wrap break-words">
            {kept}
            {cropped && (
              <mark
                className="bg-red-500"
                data-tooltip-id="tooltip"
                data-tooltip-content={t(
                  'compose_will_be_cropped',
                  'This text will be cropped'
                )}
              >
                {cropped}
              </mark>
            )}
          </div>
          {media.length > 0 && (
            <div className="flex gap-[6px] flex-wrap">
              {media.map((m) => (
                <div
                  key={m.id}
                  className="w-[72px] h-[72px] rounded-[6px] overflow-hidden"
                >
                  <VideoOrImage
                    autoplay={false}
                    isContain={false}
                    src={mediaDir.set(m.path)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
