# WoW ToDo List

Aplicación de escritorio para rastrear tareas diarias y semanales de World of Warcraft por personaje. Construida con **Electron + React + Vite**.

---

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- npm (incluido con Node.js)

---

## Instalación

```bash
npm install
```

---

## Desarrollo

Lanza la app en modo desarrollo con hot-reload:

```bash
npm run dev
```

Esto inicia Vite en `http://localhost:5271` y Electron apuntando a esa URL. Los DevTools se abren automáticamente.

---

## Build — Portable (.exe)

Genera el ejecutable portable para Windows:

```bash
npm run dist
```

El archivo resultante se guarda en:

```
release/WoW ToDo List <versión>.exe
```

### Cambiar versión antes de buildear

1. Abre `package.json`
2. Edita el campo `"version"` (debe ser semver válido, ej. `1.3.0`)
3. Edita `"buildVersion"` dentro del bloque `"build"` con la versión que quieres que aparezca en el nombre del archivo (ej. `"1.3"`)
4. Edita `"artifactName"` dentro de `"win"` con el mismo número (ej. `"${productName} 1.3.${ext}"`)
5. Ejecuta `npm run dist`

---

## Estructura del proyecto

```
electron/
  main.js       # Proceso principal: lógica de datos, IPC, ventana
  preload.js    # Puente seguro entre Electron y React (contextBridge)
  package.json  # Solo { "type": "commonjs" }

src/
  App.jsx              # Raíz de React, estado global, llamadas IPC
  LangContext.jsx      # Sistema de i18n (es / en)
  index.css            # Estilos globales y componentes
  components/
    Dashboard.jsx      # Tabla principal de personajes × tareas
    Toolbar.jsx        # Barra de herramientas y menú de ajustes
    TabSidebar.jsx     # Panel lateral de pestañas
    TaskSidebar.jsx    # Panel lateral de tareas
    Titlebar.jsx       # Barra de título personalizada con contadores de reset
    modals/
      CharacterModal.jsx
      TaskModal.jsx
      TabModal.jsx
      ConfirmModal.jsx

public/
  icon.ico      # Icono de la app (Windows)
  icon.png      # Icono PNG

package.json    # Config principal: scripts, dependencias, electron-builder
vite.config.js  # Config de Vite
```

---

## Datos de usuario

El archivo de datos (`wow_todo_data.json`) se guarda:

- **Desarrollo**: en la raíz del proyecto
- **Portable (producción)**: junto al `.exe` (en la misma carpeta donde se ejecuta)

> El archivo **no se incluye en el repositorio** (está en `.gitignore`).

---

## Publicar una nueva versión

1. Actualiza la versión en `package.json` (ver sección anterior)
2. Ejecuta `npm run dist` para generar el `.exe`
3. Haz commit y push de los cambios
4. En GitHub, ve a **Releases → Create a new release**
5. Crea un tag con el formato `v1.X` (ej. `v1.3`)
6. Sube el `.exe` generado como asset del release
7. Publica el release

Los usuarios verán la nueva versión al usar **Ajustes → Buscar actualizaciones** dentro de la app.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia en modo desarrollo (Vite + Electron) |
| `npm run build` | Solo compila el frontend con Vite |
| `npm run dist` | Compila frontend + empaqueta portable con electron-builder |
| `npm run lint` | Ejecuta ESLint |
