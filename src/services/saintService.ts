import { Saint } from '@/types';
import { mockSaint } from '@/data/mockSaint';

export interface ISaintService {
  getToday(): Promise<Saint>;
}

export const saintService: ISaintService = {
  async getToday() {
    return mockSaint;
  },
};
