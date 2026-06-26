import { Report } from '@/types';
import { mockReport, mockHistoryReports } from '@/data/mockReport';
import { mockNews } from '@/data/mockNews';
import { mockEfemerides } from '@/data/mockEfemerides';

export interface IReportService {
  getToday(): Promise<Report>;
  getHistory(): Promise<Pick<Report, 'id' | 'date' | 'lastUpdate' | 'executiveSummary'>[]>;
}

export const reportService: IReportService = {
  async getToday() {
    return {
      ...mockReport,
      news: mockNews,
      efemerides: mockEfemerides,
    };
  },

  async getHistory() {
    return mockHistoryReports;
  },
};
