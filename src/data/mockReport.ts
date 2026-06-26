import { Report } from '@/types';

export const mockReport: Report = {
  id: 'report-2026-06-25',
  date: '25/06/2026',
  lastUpdate: '25/06/2026 08:30',
  executiveSummary:
    'Los mercados internacionales reaccionan positivamente a las últimas decisiones de los bancos centrales sobre tipos de interés. La inteligencia artificial sigue protagonizando los principales anuncios tecnológicos con nuevos modelos multimodales. En el plano político, la Comisión Europea aprueba nuevas regulaciones sobre soberanía digital. El Real Madrid presenta su estrategia para la próxima temporada con fichajes clave. En España, el debate sobre la reforma fiscal centra la agenda parlamentaria mientras se preparan las negociaciones presupuestarias.',
  categories: [
    { id: 'actualidad', name: 'Actualidad', icon: '📰', newsCount: 3 },
    { id: 'internacional', name: 'Actualidad Internacional', icon: '🌍', newsCount: 3 },
    { id: 'politica', name: 'Política', icon: '🏛️', newsCount: 3 },
    { id: 'deporte', name: 'Deporte General', icon: '⚽', newsCount: 3 },
    { id: 'realmadrid', name: 'Real Madrid', icon: '⚪', newsCount: 3 },
    { id: 'tecnologia', name: 'Tecnología', icon: '💻', newsCount: 3 },
    { id: 'gadgets', name: 'Gadgets', icon: '📱', newsCount: 3 },
  ],
  news: [],
  efemerides: [],
  saint: {
    name: 'San Guillermo de Vercelli',
    biography: 'Fundador de la congregación benedictina de Montevergine en el sur de Italia. Nacido en Vercelli en 1085, realizó peregrinaciones a Santiago de Compostela y Tierra Santa antes de retirarse a una vida contemplativa en el monte Partenio.',
    relevance: 'Patrono de Irpinia. Su ejemplo de vida contemplativa y fundación monástica influyó significativamente en el monacato del sur de Italia durante el siglo XII.',
  },
};

export const mockHistoryReports: Pick<Report, 'id' | 'date' | 'lastUpdate' | 'executiveSummary'>[] = [
  {
    id: 'report-2026-06-24',
    date: '24/06/2026',
    lastUpdate: '24/06/2026 08:15',
    executiveSummary: 'Jornada marcada por la cumbre del G7 en Canadá y el anuncio de nuevas medidas económicas por parte de la Reserva Federal.',
  },
  {
    id: 'report-2026-06-23',
    date: '23/06/2026',
    lastUpdate: '23/06/2026 08:45',
    executiveSummary: 'Apple presenta sus nuevas gafas de realidad mixta mientras el Parlamento Europeo debate sobre la regulación de IA generativa.',
  },
  {
    id: 'report-2026-06-22',
    date: '22/06/2026',
    lastUpdate: '22/06/2026 09:00',
    executiveSummary: 'Elecciones municipales en Francia con resultados sorprendentes. Tesla anuncia nueva gigafactoría en España.',
  },
  {
    id: 'report-2026-06-21',
    date: '21/06/2026',
    lastUpdate: '21/06/2026 08:30',
    executiveSummary: 'Inicio del solsticio de verano con temperaturas récord en el sur de Europa. La OMS alerta sobre nuevo brote respiratorio en Asia.',
  },
  {
    id: 'report-2026-06-20',
    date: '20/06/2026',
    lastUpdate: '20/06/2026 08:20',
    executiveSummary: 'SpaceX completa misión histórica a Marte. El BCE mantiene tipos al 3.25% en línea con las expectativas del mercado.',
  },
];