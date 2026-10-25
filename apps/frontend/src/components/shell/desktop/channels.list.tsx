'use client';

import { FC, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { Integration } from '@prisma/client';
import ImageWithFallback from '@gitroom/react/helpers/image.with.fallback';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import {
  CalendarContext,
  useCalendar,
} from '@gitroom/frontend/components/launches/calendar.context';
import { useIntegrationList } from '@gitroom/frontend/components/launches/helpers/use.integration.list';
import {
  CustomVariables,
  useAddProvider,
} from '@gitroom/frontend/components/launches/add.provider.component';
import { Menu } from '@gitroom/frontend/components/launches/menu/menu';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

// Reconnect a channel: custom-fields providers (Bluesky, etc.) have no OAuth URL
// to redirect to, so the credentials are re-entered, like the menu does.
export const useRefreshChannel = () => {
  const fetch = useFetch();
  const router = useRouter();
  const modal = useModals();
  const t = useT();
  return useCallback(
    (
      integration: Integration & {
        identifier: string;
        isCustomFields?: boolean;
        customFields?: any[];
      }
    ) => async () => {
      if (integration.isCustomFields) {
        modal.openModal({
          title: t('custom_url', 'Custom URL'),
          withCloseButton: false,
          classNames: {
            modal: 'md',
          },
          children: (
            <CustomVariables
              identifier={integration.identifier}
              gotoUrl={(url: string) => router.push(url)}
              variables={integration.customFields || []}
            />
          ),
        });
        return;
      }

      const { url } = await (
        await fetch(
          `/integrations/social/${integration.identifier}?refresh=${integration.internalId}`,
          {
            method: 'GET',
          }
        )
      ).json();
      window.location.href = url;
    },
    [fetch, router, modal, t]
  );
};

// Channels as a filter for the visible range. Posts in the calendar context are
// already filtered by the selection, so unselected channels show no count.
export const ChannelsList: FC<{ selectable?: boolean }> = ({
  selectable = true,
}) => {
  const {
    integrations,
    posts,
    customer,
    selectedChannels,
    setSelectedChannels,
  } = useCalendar();
  const { mutate } = useIntegrationList();
  const user = useUser();
  const router = useRouter();
  const refreshChannel = useRefreshChannel();
  const add = useAddProvider(() => mutate());
  const invite = useAddProvider(() => mutate(), true);
  const t = useT();

  const visible = useMemo(
    () =>
      integrations.filter(
        (i) => !customer || i.customer?.id === customer
      ),
    [integrations, customer]
  );

  const totalNonDisabled = useMemo(
    () => integrations.filter((i) => !i.disabled).length,
    [integrations]
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach((p) =>
      map.set(p.integration.id, (map.get(p.integration.id) || 0) + 1)
    );
    return map;
  }, [posts]);

  const toggle = useCallback(
    (integration: (typeof visible)[number]) => () => {
      if (integration.refreshNeeded) {
        return refreshChannel(integration as any)();
      }
      if (integration.inBetweenSteps) {
        return router.push(
          `/launches?added=${integration.identifier}&continue=${integration.id}`
        );
      }
      if (!selectable) {
        return;
      }
      const current = selectedChannels || [];
      const next = current.includes(integration.id)
        ? current.filter((c) => c !== integration.id)
        : [...current, integration.id];
      setSelectedChannels(next.length ? next : null);
    },
    [selectable, selectedChannels, setSelectedChannels, refreshChannel, router]
  );

  const update = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return (
    <div className="flex flex-col gap-[2px]">
      <div className="px-[8px] pb-[4px] text-[11px] font-[600] uppercase tracking-wide text-textItemBlur">
        {t('channels', 'Channels')}
      </div>
      {visible.map((integration) => {
        const active =
          !selectedChannels || selectedChannels.includes(integration.id);
        return (
          <div
            key={integration.id}
            className={clsx(
              'group/profile flex items-center rounded-[8px] hover:bg-boxFocused transition-colors',
              selectable &&
                selectedChannels?.includes(integration.id) &&
                'bg-boxFocused',
              (integration.disabled || (selectable && !active)) && 'opacity-50'
            )}
          >
            <button
              onClick={toggle(integration)}
              className={clsx(
                'flex flex-1 min-w-0 items-center gap-[8px] ps-[8px] h-[32px] text-[13px]',
                !selectable &&
                  !integration.refreshNeeded &&
                  !integration.inBetweenSteps &&
                  'cursor-default'
              )}
              {...(integration.refreshNeeded && {
                'data-tooltip-id': 'tooltip',
                'data-tooltip-content': t(
                  'channel_disconnected_click_to_reconnect',
                  'Channel disconnected, click to reconnect.'
                ),
              })}
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
              {(integration.refreshNeeded || integration.inBetweenSteps) && (
                <span className="w-[8px] h-[8px] rounded-full bg-red-500 shrink-0" />
              )}
              <span className="text-textItemBlur tabular-nums">
                {counts.get(integration.id) || ''}
              </span>
            </button>
            <Menu
              canChangeProfilePicture={integration.changeProfilePicture}
              canChangeNickName={integration.changeNickName}
              refreshChannel={refreshChannel}
              mutate={() => mutate()}
              onChange={update}
              id={integration.id}
              canEnable={
                user?.totalChannels! > totalNonDisabled && integration.disabled
              }
              canDisable={!integration.disabled}
            />
          </div>
        );
      })}
      <div className="flex gap-[4px] pt-[4px]">
        <button
          onClick={add}
          className="flex-1 h-[32px] px-[8px] rounded-[8px] bg-btnSimple text-btnText text-[13px] flex items-center justify-center gap-[6px]"
        >
          <span className="text-[16px] leading-none">+</span>
          {t('add_channel', 'Add Channel')}
        </button>
        <button
          onClick={invite}
          data-tooltip-id="tooltip"
          data-tooltip-content={t(
            'invite_link',
            'Send Invite Link to a customer to add channel'
          )}
          className="h-[32px] px-[10px] rounded-[8px] bg-btnSimple text-btnText text-[13px]"
        >
          {t('invite', 'Invite')}
        </button>
      </div>
    </div>
  );
};

// The channels list on routes without a calendar: the channel menu reads the
// integrations from the calendar context, so give it a light one, no posts fetch.
export const RailChannels: FC = () => {
  const base = useCalendar();
  const { data: integrations, mutate } = useIntegrationList();
  const value = useMemo(
    () => ({
      ...base,
      integrations: integrations || [],
      reloadCalendarView: () => {
        mutate();
      },
    }),
    [base, integrations, mutate]
  );
  return (
    <CalendarContext.Provider value={value}>
      <ChannelsList selectable={false} />
    </CalendarContext.Provider>
  );
};
