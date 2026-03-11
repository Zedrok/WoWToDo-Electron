/**
 * Changelog - Define los cambios por versión
 * Los cambios más recientes deben ir primero
 */

export const CHANGELOG = [
  {
    version: '1.6.8',
    date: '2026-03-11',
    changes: [
      'Reset diario ahora a las 14:00 UTC (antes 15:00)',
      'Nueva funcionalidad: Changelog automático al actualizar'
    ]
  },
  {
    version: '1.6.7',
    date: '2026-03-10',
    changes: [
      'Versión anterior'
    ]
  },
  {
    version: '1.6.6',
    date: '2026-03-10',
    changes: [
      'Mejoras en la interfaz de usuario',
      'Correcciones de bugs menores'
    ]
  }
]

export function getChangesSince(lastVersion) {
  if (!lastVersion) return CHANGELOG

  const lastIndex = CHANGELOG.findIndex(c => c.version === lastVersion)
  return lastIndex === -1 ? CHANGELOG : CHANGELOG.slice(0, lastIndex)
}
