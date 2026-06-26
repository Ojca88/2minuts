export default function SummaryCard({ summary }: { summary: string }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-2xl p-5 shadow-sm border border-blue-100 dark:border-blue-800">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📊</span>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Resumen Ejecutivo</h2>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summary}</p>
    </div>
  );
}
