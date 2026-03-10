import { createContext, useContext, useState } from 'react'

const TR = {
  es: {
    // App
    loading: 'Cargando...',
    selectCharFirst: 'Primero selecciona un personaje.',
    selectTaskFirst: 'Primero selecciona una tarea.',
    cannotDeleteLastTab: 'No se puede eliminar la última pestaña.',
    dataExported: 'Datos exportados.',
    dataImported: 'Datos importados.',
    importFailed: 'Error al importar: {error}',
    charAdded: '{name} añadido.',
    charDeleted: '{name} eliminado.',
    taskAdded: '"{name}" añadida.',
    taskDeleted: '"{name}" eliminada.',
    tabAdded: '"{name}" añadida.',
    tabDeleted: '"{name}" eliminada.',

    // Confirm modal content (built in App.jsx)
    deleteCharTitle: 'Eliminar Personaje',
    deleteCharMsg: '¿Eliminar a "{name}" y todo su historial de tareas?',
    deleteTaskTitle: 'Eliminar Tarea',
    deleteTaskMsg: '¿Eliminar "{name}" para todos los personajes?',
    deleteTabTitle: 'Eliminar Pestaña',
    deleteTabMsg: '¿Eliminar "{name}"? Sus tareas se moverán a otra pestaña.',

    // ConfirmModal internals
    confirmWarning: 'Esta acción no se puede deshacer.',
    confirmBtn: 'Confirmar',
    cancelBtn: 'Cancelar',

    // Modal titles
    newCharTitle: 'Nuevo Personaje',
    editCharTitle: 'Editar Personaje',
    newTaskTitle: 'Nueva Tarea',
    editTaskTitle: 'Editar Tarea',
    newTabTitle: 'Nueva Pestaña',
    editTabTitle: 'Editar Pestaña',

    // CharacterModal
    charNameLabel: 'NOMBRE DEL PERSONAJE',
    charNamePlaceholder: 'ej. Shadowmeld',
    classLabel: 'CLASE',
    tasksLabel: 'TAREAS — desmarca para deshabilitar en este personaje',
    deleteBtn: 'Eliminar',
    saveBtn: 'Guardar',

    // TaskModal
    taskNameLabel: 'NOMBRE DE LA TAREA',
    taskNamePlaceholder: 'ej. Misiones del Mundo',
    periodicityLabel: 'PERIODICIDAD',
    periodDaily: 'Diaria',
    periodWeekly: 'Semanal',
    periodCustom: 'Personalizada',
    statesLabel: 'ESTADOS',
    states2: '2 estados',
    states2Desc: 'Incompleto → Completo',
    states3: '3 estados',
    states3Desc: 'Incompleto → En Progreso → Completo',
    customImageLabel: 'IMAGEN PERSONALIZADA',
    optional: '(opcional)',
    changeImg: 'Cambiar',
    uploadImg: 'Subir imagen',
    removeImg: '✕ Quitar',
    professionLabel: 'PROFESIÓN',
    profitTooltip: 'Registrar profit (en K de oro)',
    totalColumn: 'Total',
    profitLabel: 'PROFIT',
    profitToggleDesc: 'Registrar ganancias en oro para esta tarea',

    // TabModal
    tabNameLabel: 'NOMBRE DE LA PESTAÑA',
    tabNamePlaceholder: 'ej. Misiones Diarias',
    tabPreviewPlaceholder: 'Nombre',
    colorLabel: 'COLOR',
    iconLabel: 'ÍCONO',
    customColorTooltip: 'Color personalizado',
    uploadIconTooltip: 'Subir imagen personalizada',
    letterIconTooltip: 'Primera letra del nombre',
    uploadIconHint: 'Haz clic en + para subir una imagen.',

    // Dashboard
    charColumn: 'Personaje',
    noDataTitle: '⚔ Sin Datos',
    noDataDesc: 'Añade un personaje desde la barra de herramientas.\nLuego añade tareas para empezar a rastrear.',
    noCharsTitle: 'Sin Personajes',
    noCharsDesc: 'Haz clic en + Personaje para añadir uno.',
    noTasksTitle: 'Sin Tareas',
    noTasksDesc: 'Haz clic en + Tarea en la barra lateral para añadir tareas.',

    // TaskSidebar
    tasksTitle: 'Tareas',
    addTaskTooltip: 'Añadir tarea',
    noTasksYet: 'Aún no hay tareas.\nHaz clic en + para añadir.',
    newTaskBtn: '+ Nueva Tarea',
    editBtn: 'Editar',

    // Toolbar
    addCharBtn: '+ Personaje',
    addCharTooltip: 'Añadir personaje',
    tasksBtn: 'Tareas',
    toggleTasksTooltip: 'Mostrar/ocultar panel de tareas',
    settingsBtn: 'Ajustes',
    exportItem: '↑ Exportar',
    importItem: '↓ Importar',
    zoomLabel: 'Zoom',
    languageLabel: 'Idioma',

    // Titlebar
    dailyReset: 'Diario',
    weeklyReset: 'Semanal',

    // Updates
    checkUpdateItem: '↑ Buscar actualizaciones',
    checkingUpdate: 'Buscando...',
    upToDate: '¡Ya tienes la última versión!',
    updateCheckFailed: 'No se pudo verificar actualizaciones. Revisa tu conexión.',
  },

  en: {
    // App
    loading: 'Loading...',
    selectCharFirst: 'Select a character first.',
    selectTaskFirst: 'Select a task first.',
    cannotDeleteLastTab: 'Cannot delete the last tab.',
    dataExported: 'Data exported.',
    dataImported: 'Data imported.',
    importFailed: 'Import failed: {error}',
    charAdded: '{name} added.',
    charDeleted: '{name} deleted.',
    taskAdded: '"{name}" added.',
    taskDeleted: '"{name}" deleted.',
    tabAdded: '"{name}" added.',
    tabDeleted: '"{name}" deleted.',

    // Confirm modal content (built in App.jsx)
    deleteCharTitle: 'Delete Character',
    deleteCharMsg: 'Delete "{name}" and all their task history?',
    deleteTaskTitle: 'Delete Task',
    deleteTaskMsg: 'Delete "{name}" for all characters?',
    deleteTabTitle: 'Delete Tab',
    deleteTabMsg: 'Delete "{name}"? Its tasks will be moved to another tab.',

    // ConfirmModal internals
    confirmWarning: 'This action cannot be undone.',
    confirmBtn: 'Confirm',
    cancelBtn: 'Cancel',

    // Modal titles
    newCharTitle: 'New Character',
    editCharTitle: 'Edit Character',
    newTaskTitle: 'New Task',
    editTaskTitle: 'Edit Task',
    newTabTitle: 'New Tab',
    editTabTitle: 'Edit Tab',

    // CharacterModal
    charNameLabel: 'CHARACTER NAME',
    charNamePlaceholder: 'e.g. Shadowmeld',
    classLabel: 'CLASS',
    tasksLabel: 'TASKS — uncheck to disable for this character',
    deleteBtn: 'Delete',
    saveBtn: 'Save',

    // TaskModal
    taskNameLabel: 'TASK NAME',
    taskNamePlaceholder: 'e.g. World Quests',
    periodicityLabel: 'PERIODICITY',
    periodDaily: 'Daily',
    periodWeekly: 'Weekly',
    periodCustom: 'Custom',
    statesLabel: 'STATES',
    states2: '2 states',
    states2Desc: 'Incomplete → Complete',
    states3: '3 states',
    states3Desc: 'Incomplete → In Progress → Complete',
    customImageLabel: 'CUSTOM IMAGE',
    optional: '(optional)',
    changeImg: 'Change',
    uploadImg: 'Upload image',
    removeImg: '✕ Remove',
    professionLabel: 'PROFESSION',
    profitTooltip: 'Log profit (gold in K)',
    totalColumn: 'Total',
    profitLabel: 'PROFIT',
    profitToggleDesc: 'Track gold earnings for this task',

    // TabModal
    tabNameLabel: 'TAB NAME',
    tabNamePlaceholder: 'e.g. Daily Quests',
    tabPreviewPlaceholder: 'Tab Name',
    colorLabel: 'COLOR',
    iconLabel: 'ICON',
    customColorTooltip: 'Custom color',
    uploadIconTooltip: 'Upload custom image',
    letterIconTooltip: 'First letter of name',
    uploadIconHint: 'Click + to upload an image.',

    // Dashboard
    charColumn: 'Character',
    noDataTitle: '⚔ No Data Yet',
    noDataDesc: 'Add a character using the toolbar above.\nThen add tasks to start tracking.',
    noCharsTitle: 'No Characters',
    noCharsDesc: 'Click + Character to add one.',
    noTasksTitle: 'No Tasks',
    noTasksDesc: 'Click + Task in the sidebar to add tasks.',

    // Updates
    checkUpdateItem: '↑ Check for updates',
    checkingUpdate: 'Checking...',
    upToDate: 'You already have the latest version!',
    updateCheckFailed: 'Could not check for updates. Check your connection.',

    // TaskSidebar
    tasksTitle: 'Tasks',
    addTaskTooltip: 'Add task',
    noTasksYet: 'No tasks yet.\nClick + to add one.',
    newTaskBtn: '+ New Task',
    editBtn: 'Edit',

    // Toolbar
    addCharBtn: '+ Character',
    addCharTooltip: 'Add Character',
    tasksBtn: 'Tasks',
    toggleTasksTooltip: 'Toggle task panel',
    settingsBtn: 'Settings',
    exportItem: '↑ Export',
    importItem: '↓ Import',
    zoomLabel: 'Zoom',
    languageLabel: 'Language',

    // Titlebar
    dailyReset: 'Daily',
    weeklyReset: 'Weekly',
  },
}

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('wt_lang') || 'es')

  const setLang = (l) => {
    setLangState(l)
    localStorage.setItem('wt_lang', l)
  }

  const t = (key, vars = {}) => {
    let str = TR[lang]?.[key] ?? TR.en[key] ?? key
    Object.entries(vars).forEach(([k, v]) => { str = str.replaceAll(`{${k}}`, v) })
    return str
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
