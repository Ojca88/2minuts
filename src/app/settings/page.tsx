'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Settings } from '@/types';
import { useTheme } from '@/hooks/useTheme';

const STORAGE_KEY = '2minuts-settings';

const INTEREST_TOPICS = [
  'Inteligencia Artificial', 'Apple', 'Google', 'Microsoft', 'Tesla',
  'F1', 'NBA', 'Champions League', 'LaLiga', 'Criptomonedas',
  'Startups', 'Ciencia', 'Salud', 'Medio Ambiente', 'Cine',
];

interface ExtendedSettings extends Settings {
  interests: string[];
}

function loadSettings(): ExtendedSettings {
  if (typeof window === 'undefined') {
    return { language: 'es', updateFrequency: '8h', email: '', theme: 'light', offersPerCategory: 6, interests: [] };
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return { interests: [], ...parsed };
    } catch { /* fallback */ }
  }
  return { language: 'es', updateFrequency: '8h', email: '', theme: 'light', offersPerCategory: 6, interests: [] };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ExtendedSettings>(loadSettings);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    setSettings(loadSettings());
  }, []);

  const handleChange = (field: keyof ExtendedSettings, value: string | number | string[]) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    handleChange('theme', newTheme);
    setTheme(newTheme);
  };

  const toggleInterest = (topic: string) => {
    const current = settings.interests || [];
    const updated = current.includes(topic)
      ? current.filter((t) => t !== topic)
      : [...current, topic];
    handleChange('interests', updated);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!mounted) return null;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-4 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ajustes</h1>
          <span className="text-xs text-gray-400">v1.0.0</span>
        </div>

        {/* Perfil */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Perfil</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700">
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                ✉️ Correo electrónico
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="tu@email.com"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">Para recibir el briefing diario por correo</p>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                🌐 Idioma
              </label>
              <select
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="es">🇪🇸 Español</option>
                <option value="en">🇬🇧 English</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="pt">🇵🇹 Português</option>
              </select>
            </div>
          </div>
        </section>

        {/* Notificaciones */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Notificaciones</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700">
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                ⏱️ Frecuencia de actualización
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: '1h', label: '1h' },
                  { value: '4h', label: '4h' },
                  { value: '8h', label: '8h' },
                  { value: '24h', label: '24h' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleChange('updateFrequency', opt.value)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      settings.updateFrequency === opt.value
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Con qué frecuencia se actualizan las noticias</p>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                🛍️ Ofertas por categoría
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.offersPerCategory}
                onChange={(e) => handleChange('offersPerCategory', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">Número de ofertas que se muestran en cada categoría (1-20)</p>
            </div>
          </div>
        </section>

        {/* Apariencia */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Apariencia</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
              🎨 Tema de la aplicación
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleThemeChange('light')}
                className={`py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-lg">☀️</span>
                <span>Claro</span>
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-lg">🌙</span>
                <span>Oscuro</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                  theme === 'system'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-lg">🖥️</span>
                <span>Sistema</span>
              </button>
            </div>
          </div>
        </section>

        {/* Intereses */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Personalización</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
              🎯 Temas de interés
            </label>
            <p className="text-[11px] text-gray-400 mb-3">Selecciona tus temas favoritos para personalizar el orden del briefing</p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_TOPICS.map((topic) => {
                const isSelected = (settings.interests || []).includes(topic);
                return (
                  <button
                    key={topic}
                    onClick={() => toggleInterest(topic)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Fuentes */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Fuentes de noticias</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="space-y-3">
              {[
                { name: 'El País', category: 'Actualidad / Internacional', active: true },
                { name: 'El Mundo', category: 'Política', active: true },
                { name: 'Marca', category: 'Deportes / Real Madrid', active: true },
                { name: 'Xataka', category: 'Tecnología', active: true },
                { name: 'Xataka Móvil', category: 'Gadgets', active: true },
              ].map((source) => (
                <div key={source.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{source.name}</p>
                    <p className="text-[11px] text-gray-400">{source.category}</p>
                  </div>
                  <div className={`w-9 h-5 rounded-full relative transition-colors ${source.active ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${source.active ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-50">Más fuentes disponibles en futuras versiones (RSS, Gemini, OpenAI)</p>
          </div>
        </section>

        {/* Acerca de */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Acerca de</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Versión</span>
                <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Plataforma</span>
                <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">Next.js 16</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Datos</span>
                <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">RSS en tiempo real</span>
              </div>
            </div>
          </div>
        </section>

        {/* Guardar */}
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all active:scale-95 shadow-sm"
        >
          {saved ? '✓ Guardado' : 'Guardar ajustes'}
        </button>
        <p className="text-center text-[11px] text-gray-400 mt-3">
          La persistencia de ajustes se implementará con Supabase en próximas versiones
        </p>
      </main>
    </>
  );
}
