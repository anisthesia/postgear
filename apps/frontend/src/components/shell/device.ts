import { cookies } from 'next/headers';

export type Device = 'desktop' | 'mobile';

export const getDevice = async (): Promise<Device> => {
  const value = (await cookies()).get('pg-device')?.value;
  return value === 'mobile' ? 'mobile' : 'desktop';
};
