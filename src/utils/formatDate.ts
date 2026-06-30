/** Formatea una fecha en formato largo español (ej: "lunes, 30 de junio de 2026") */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
