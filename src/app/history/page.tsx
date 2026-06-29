import Header from '@/components/Header';

export default function HistoryPage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-4 pb-24">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Histórico de Informes</h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            El historial muestra los informes de días anteriores.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Funcionalidad disponible próximamente con almacenamiento en la nube.
          </p>
        </div>
      </main>
    </>
  );
}
