'use client';

import { FC } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { showMediaBox } from '@gitroom/frontend/components/media/media.component';
import { useCalendar } from '@gitroom/frontend/components/launches/calendar.context';
import { fromUtc } from '@gitroom/frontend/components/layout/set.timezone';
import { AddEditModal } from '@gitroom/frontend/components/new-launch/add.edit.modal';
import {
  hasDraft,
  useCompose,
} from '@gitroom/frontend/components/compose/use.compose';
import { ComposeChannels } from '@gitroom/frontend/components/compose/compose.channels';
import { ComposeWhenChips } from '@gitroom/frontend/components/compose/compose.when';
import { ComposePreview } from '@gitroom/frontend/components/compose/compose.preview';
import { ComposeFooter } from '@gitroom/frontend/components/compose/compose.footer';

const hotkeyOptions = {
  preventDefault: true,
  enableOnFormTags: true,
  enableOnContentEditable: true,
};

export const ComposePanel: FC = () => {
  const t = useT();
  const modal = useModals();
  const { integrations, reloadCalendarView } = useCalendar();
  const compose = useCompose(integrations, reloadCalendarView);

  const close = async () => {
    if (
      hasDraft(compose) &&
      !(await deleteDialog(
        t(
          'compose_discard_question',
          'You have unsaved text, do you want to discard it?'
        ),
        t('compose_discard', 'Discard'),
        undefined,
        t('compose_keep_writing', 'Keep writing')
      ))
    ) {
      return;
    }
    compose.reset();
  };

  const openFullEditor = async (channelIds: string[]) => {
    const date = await compose.resolveDate();
    compose.reset();
    modal.openModal({
      id: 'add-edit-modal',
      closeOnClickOutside: false,
      removeLayout: true,
      closeOnEscape: false,
      withCloseButton: false,
      askClose: true,
      fullScreen: true,
      classNames: {
        modal: 'w-[100%] max-w-[1400px] text-textColor',
      },
      children: (
        <AddEditModal
          allIntegrations={integrations.map((p) => ({ ...p }))}
          set={compose.draftAsSet(channelIds)}
          reopenModal={() => {}}
          mutate={reloadCalendarView}
          integrations={integrations}
          date={fromUtc(date.utc().format('YYYY-MM-DDTHH:mm:ss'))}
        />
      ),
      size: '80%',
      title: ``,
    });
  };

  useHotkeys('esc', close, { ...hotkeyOptions, enabled: compose.open });
  useHotkeys('mod+enter', () => compose.submit('schedule'), {
    ...hotkeyOptions,
    enabled: compose.open,
  });

  if (!compose.open) {
    return null;
  }

  const previewed = compose.selected[0];

  return (
    <div className="w-[480px] shrink-0 bg-newBgColorInner flex flex-col">
      <div className="flex items-center justify-between h-[56px] px-[16px] border-b border-newBgLineColor">
        <div className="text-[16px] font-[600]">
          {t('compose_new_post', 'New post')}
        </div>
        <button
          onClick={close}
          aria-label={t('close', 'Close')}
          className="text-textItemBlur hover:text-newTextColor"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-[16px] flex flex-col gap-[16px]">
        <textarea
          autoFocus
          value={compose.text}
          onChange={(e) => compose.setText(e.target.value)}
          placeholder={t('compose_placeholder', 'What do you want to share?')}
          className="min-h-[160px] resize-y rounded-[8px] bg-transparent border border-newBgLineColor p-[12px] text-[14px] outline-none"
        />
        <div className="flex gap-[8px] flex-wrap items-center">
          {compose.media.map((m, index) => (
            <button
              key={m.id}
              onClick={() =>
                compose.setMedia(compose.media.filter((_, i) => i !== index))
              }
              className="h-[32px] px-[10px] rounded-full bg-btnSimple text-[12px]"
            >
              {m.path.split('/').pop()?.slice(-18)} ✕
            </button>
          ))}
          <button
            onClick={() =>
              showMediaBox((m) => compose.setMedia([...compose.media, m]))
            }
            className="h-[32px] px-[12px] rounded-full border border-dashed border-newBgLineColor text-[13px] text-textItemBlur hover:text-newTextColor"
          >
            + {t('compose_add_media', 'Add media')}
          </button>
        </div>
        <ComposeChannels
          available={compose.available}
          channels={compose.channels}
          counts={compose.counts}
          issues={compose.issues}
          onToggle={compose.toggleChannel}
          onSaveDefault={compose.saveDefaultChannels}
        />
        <ComposeWhenChips when={compose.when} onChange={compose.setWhen} />
        <ComposePreview
          integration={previewed}
          text={compose.text}
          media={compose.media}
          max={previewed ? compose.counts[previewed.id]?.max : undefined}
          onEditVariant={() => previewed && openFullEditor([previewed.id])}
        />
      </div>
      <div className="p-[16px] border-t border-newBgLineColor flex flex-col gap-[8px]">
        <button
          onClick={() => openFullEditor(compose.channels)}
          className="text-[12px] text-textItemBlur hover:text-newTextColor self-start"
        >
          {t('compose_open_full_editor', 'Open full editor')}
        </button>
        <ComposeFooter
          loading={compose.loading}
          blocked={Object.keys(compose.issues).length > 0}
          onSubmit={compose.submit}
        />
      </div>
    </div>
  );
};
