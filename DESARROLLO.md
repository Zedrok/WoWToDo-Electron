# WoW ToDo List — Guía de Desarrollo

Aplicación de escritorio para rastrear tareas diarias/semanales de World of Warcraft, construida con **Electron + React + Vite**.

---

## Requisitos

| Herramienta | Versión mínima | Descarga |
|-------------|---------------|---------|
| Node.js     | 22.x          | https://nodejs.org |
| npm         | 11.x (incluido con Node) | — |
| Git         | cualquiera    | https://git-scm.com |

> Desarrollado y probado en **Node 22.21.1 / npm 11.4.1** sobre Windows 11.

---

## Instalación

```bash
cd WoWToDo-Electron
npm install
```

Esto instala todas las dependencias (React, Vite, Electron, electron-builder, etc.).

---

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia Vite + Electron en modo desarrollo (hot reload) |
| `npm run build` | Compila el frontend con Vite → carpeta `dist/` |
| `npm run dist` | Build completo + empaqueta el `.exe` portable → carpeta `release/` |

---

## Estructura del proyecto

```
WoWToDo-Electron/
├── electron/
│   ├── main.js          # Proceso principal de Electron (IPC, datos, ventana)
│   ├── preload.js       # Bridge seguro entre main y renderer
│   └── package.json     # (interno, no editar)
│
├── src/
│   ├── main.jsx         # Entry point de React
│   ├── App.jsx          # Componente raíz, lógica de estado global
│   ├── LangContext.jsx  # Sistema de i18n (ES/EN) con todas las traducciones
│   ├── index.css        # Todos los estilos de la app (design tokens, componentes)
│   ├── App.css          # Estilos base del layout
│   │
│   ├── components/
│   │   ├── Titlebar.jsx       # Barra superior con título y timers de reset
│   │   ├── Toolbar.jsx        # Barra de acciones (+ Personaje, Tareas, Ajustes)
│   │   ├── Dashboard.jsx      # Tabla principal personajes × tareas
│   │   ├── TabSidebar.jsx     # Panel lateral izquierdo con pestañas
│   │   ├── TaskSidebar.jsx    # Panel lateral derecho con lista de tareas
│   │   └── modals/
│   │       ├── CharacterModal.jsx  # Crear/editar personaje
│   │       ├── TaskModal.jsx       # Crear/editar tarea
│   │       ├── TabModal.jsx        # Crear/editar pestaña
│   │       └── ConfirmModal.jsx    # Diálogo de confirmación genérico
│   │
│   └── assets/
│       ├── classes/       # Iconos JPG de las 13 clases de WoW + index.js
│       └── professions/   # Iconos PNG de las 14 profesiones de WoW + index.js
│
├── public/
│   └── icon.png / icon.ico   # Icono de la app (para el .exe)
│
├── dist/           # Output del build de Vite (generado, no versionar)
├── release/        # Output del ejecutable (generado, no versionar)
├── wow_todo_data.json  # Archivo de datos en desarrollo (se crea automáticamente)
│
├── package.json    # Dependencias y configuración de electron-builder
├── vite.config.js  # Configuración de Vite
└── index.html      # HTML raíz
```

---

## Arquitectura general

### Persistencia de datos
- **En desarrollo:** `wow_todo_data.json` en la raíz del proyecto.
- **En producción (exe):** `wow_todo_data.json` junto al `.exe`.
- El archivo se crea automáticamente en el primer arranque.
- `electron/main.js` -> función `migrate()` actualiza el esquema automáticamente en cada versión.

### Comunicación Electron ↔ React
- `electron/preload.js` expone `window.api` con todos los métodos IPC.
- Los componentes llaman a `window.api.nombreMetodo()` para leer/escribir datos.
- Todos los handlers IPC en `main.js` devuelven el estado completo actualizado (`appData`).

### Sistema de idiomas
- `src/LangContext.jsx` provee el contexto `useLang()` con `{ t, lang, setLang }`.
- La función `t('clave', { var: valor })` resuelve traducciones con interpolación.
- Idioma por defecto: **español**. Se persiste en `localStorage` (`wt_lang`).
- Para agregar un idioma nuevo: añadir entrada en el objeto `TR` de `LangContext.jsx`.

### Zonas horarias de reset
- **Reset diario:** 15:00 UTC
- **Reset semanal:** Martes 15:00 UTC
- Los resets se verifican cada segundo contra `last_daily_reset` / `last_weekly_reset` del JSON.

---

## Cómo generar el ejecutable

```bash
npm run dist
```

El `.exe` portable queda en `release/WoW ToDo List 1.0.0.exe`.

Para actualizar la versión, editar el campo `"version"` en `package.json` antes de correr `npm run dist`.

### Icono personalizado
Colocar en `public/`:
- `icon.ico` — para el ejecutable de Windows (recomendado: 256×256 px)
- `icon.png` — para la ventana durante desarrollo

---

## Cosas importantes a tener en cuenta

### Bug conocido — reorder de tareas
El `reorder-tasks` IPC solo acepta los IDs de la pestaña activa, pero los aplica posicionalmente sobre el array completo de tareas, preservando las tareas de otras pestañas en su lugar. **No cambiar** esta lógica sin revisar `main.js` → `ipcMain.handle('reorder-tasks', ...)`.

### titleBarOverlay (botones nativos de ventana)
La app usa `titleBarStyle: 'hidden'` con `titleBarOverlay` nativo de Electron (fondo `#161616`, símbolos blancos, altura 36px). Los botones nativos se superponen sobre el HTML en la esquina superior derecha — por eso el `.titlebar` **no tiene** `border-bottom` y el separador visual está en `border-top` del `.toolbar`.

### border-collapse y la fila seleccionada
La tabla usa `border-collapse: collapse`. Para que el borde dorado de la fila seleccionada se vea correctamente a todos los niveles de zoom, se usan:
1. `border-top/bottom` en `tr.selected-row > td` (con `!important`)
2. `tr:has(+ tr.selected-row) > td { border-bottom }` para forzar el borde compartido desde la fila anterior.

---

## Dependencias principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| electron | ^40.8.0 | Framework de escritorio |
| react | ^19.2.0 | UI |
| vite | ^8.0.0-beta | Bundler/dev server |
| electron-builder | ^26.8.1 | Empaquetado del .exe |
| uuid | ^13.0.0 | Generación de IDs únicos |
| concurrently | ^9.2.1 | Correr Vite + Electron en paralelo en dev |
| cross-env | ^7.0.3 | Variables de entorno cross-platform |
