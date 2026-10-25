import { FC, ReactNode } from 'react';
import { LayoutComponent } from '@gitroom/frontend/components/new-layout/layout.component';

export const MobileShell: FC<{ children: ReactNode }> = ({ children }) => {
  return <LayoutComponent>{children}</LayoutComponent>;
};
