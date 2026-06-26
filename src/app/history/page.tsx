import Header from '@/components/Header';
import { mockHistoryReports } from '@/data/mockReport';

export default function HistoryPage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-4 pb-24">
        <h1 className="text-lg font-bold text-gray-900 mb-4">Histórico de Informes</h1>

        <div className="grid gap-3">
          {mockHistoryReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">{report.date}</span>
                <span className="text-xs text-gray-400">{report.lastUpdate}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{report.executiveSummary}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Mostrando los últimos 5 informes
        </p>
      </main>
    </>
  );
}
