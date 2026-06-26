import { Efemeride } from '@/types';
import { mockEfemerides } from '@/data/mockEfemerides';

export interface IEfemeridesService {
  getToday(): Promise<Efemeride[]>;
}

export const efemeridesService: IEfemeridesService = {
  async getToday() {
    return mockEfemerides;
  },
};
