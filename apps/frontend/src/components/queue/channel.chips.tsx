'use client';

import { FC } from 'react';

const MAX_CHIPS = 3;

export const ChannelChips: FC<{ posts: any[] }> = ({ posts }) => {
  const shown = posts.slice(0, MAX_CHIPS);
  const more = posts.length - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-[4px] min-w-0">
      {shown.map((post) => (
        <div
          key={post.id}
          title={post.integration?.name}
          className="flex items-center gap-[4px] max-w-full ps-[2px] pe-[6px] py-[2px] rounded-full bg-btnSimple text-[11px] min-w-0"
        >
          <div className="relative w-[16px] h-[16px] shrink-0">
            <img
              className="w-[16px] h-[16px] rounded-full"
              src={post.integration?.picture || '/no-picture.jpg'}
            />
            <img
              className="w-[9px] h-[9px] rounded-full absolute -bottom-[2px] -end-[2px] border border-newBgColorInner"
              src={`/icons/platforms/${post.integration?.providerIdentifier}.png`}
            />
          </div>
          <span className="truncate">{post.integration?.name}</span>
        </div>
      ))}
      {more > 0 && <span className="text-[11px] text-textItemBlur">+{more}</span>}
    </div>
  );
};
