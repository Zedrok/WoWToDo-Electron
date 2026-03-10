import { useState, useEffect, useCallback, useRef } from 'react'
import Titlebar from './components/Titlebar.jsx'
import Toolbar from './components/Toolbar.jsx'
import Dashboard from './components/Dashboard.jsx'
import TaskSidebar from './components/TaskSidebar.jsx'
import TabSidebar from './components/TabSidebar.jsx'
import CharacterModal from './components/modals/CharacterModal.jsx'
import TaskModal from './components/modals/TaskModal.jsx'
import TabModal from './components/modals/TabModal.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import { useLang } from './LangContext.jsx'

const api = window.api

export default function App() {
  const { t } = useLang()
  const [data, setData]             = useState(null)
  const [activeTabId, setActiveTabId] = useState(null)
  const [selected, setSelected]     = useState(null)      // { cid, tid }
  const [selectedTask, setSelectedTask] = useState(null)  // tid from sidebar
  const [taskSidebarOpen, setTaskSidebarOpen] = useState(false)
  const [modal, setModal]           = useState(null)
  const [toast, setToast]           = useState(null)
  const [zoom, setZoom]             = useState(() => {
    const stored = parseFloat(localStorage.getItem('wt_zoom') || '1')
    const levels = [0.75, 0.85, 1, 1.15, 1.25]
    return levels.includes(stored) ? stored : 1
  })
  const toastTimer = useRef(null)

  useEffect(() => { api.setZoom(zoom) }, [zoom])
  const onZoomChange = (v) => { setZoom(v); localStorage.setItem('wt_zoom', String(v)) }

  useEffect(() => {
    api.getData().then(d => {
      setData(d)
      if (d.tabs?.length) setActiveTabId(d.tabs[0].id)
    })
  }, [])

  useEffect(() => {
    const iv = setInterval(async () => {
      const r = await api.checkResets()
      if (r.changed) setData(r.data)
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  useEffect(() => {
    window.api.onUpdateProgress(({ status, percent }) => {
      if (status === 'downloading') showToast(`Descargando actualización... ${percent}%`)
      else if (status === 'ready')  showToast('✓ Actualización descargada — reiniciando...')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const closeModal = () => setModal(null)

  // Characters
  const openAddChar      = ()    => setModal({ type: 'addChar' })
  const openEditChar     = (cid) => {
    const id = cid ?? selected?.cid
    if (!id) return showToast(t('selectCharFirst'))
    const char = data.characters.find(c => c.id === id)
    if (char) setModal({ type: 'editChar', char, tasks: data.tasks })
  }
  const confirmDeleteChar = () => {
    if (!selected?.cid) return showToast(t('selectCharFirst'))
    const char = data.characters.find(c => c.id === selected.cid)
    if (!char) return
    setModal({
      type: 'confirm', title: t('deleteCharTitle'),
      message: t('deleteCharMsg', { name: char.name }), variant: 'danger',
      onConfirm: async () => {
        const d = await api.deleteCharacter(selected.cid)
        setData(d); setSelected(null); closeModal(); showToast(t('charDeleted', { name: char.name }))
      }
    })
  }

  // Tasks
  const openAddTask    = ()    => setModal({ type: 'addTask', tabId: activeTabId })
  const openEditTask   = (tid) => {
    const t2 = tid || selected?.tid || selectedTask
    if (!t2) return showToast(t('selectTaskFirst'))
    const task = data.tasks.find(x => x.id === t2)
    if (task) setModal({ type: 'editTask', task })
  }
  const confirmDeleteTask = (tid) => {
    const t2 = tid || selected?.tid || selectedTask
    if (!t2) return showToast(t('selectTaskFirst'))
    const task = data.tasks.find(x => x.id === t2)
    if (!task) return
    setModal({
      type: 'confirm', title: t('deleteTaskTitle'),
      message: t('deleteTaskMsg', { name: task.name }), variant: 'danger',
      onConfirm: async () => {
        const d = await api.deleteTask(t2)
        setData(d)
        if (selected?.tid === t2) setSelected(p => ({ ...p, tid: null }))
        if (selectedTask === t2) setSelectedTask(null)
        closeModal(); showToast(t('taskDeleted', { name: task.name }))
      }
    })
  }
  const onToggle = useCallback(async (cid, tid) => {
    const d = await api.toggleTask(cid, tid)
    setData(d); setSelected({ cid, tid })
  }, [])

  const onSetProfit = useCallback(async (cid, tid, date, amount) => {
    const d = await api.setProfit(cid, tid, date, amount)
    setData(d)
  }, [])

  const onModalSubmit = async (result) => {
    if (!modal) return
    switch (modal.type) {
      case 'addChar':  { const d = await api.addCharacter(result.name, result.classId);                       setData(d); showToast(t('charAdded', { name: result.name }));        break }
      case 'editChar': { const d = await api.renameCharacter(modal.char.id, result.name, result.hiddenTaskIds, result.classId); setData(d); break }
      case 'addTask':  { const d = await api.addTask(result.name, result.period, modal.tabId, result.stateCount, result.professionId, result.customImage, result.trackProfit); setData(d); showToast(t('taskAdded', { name: result.name }));   break }
      case 'editTask': { const d = await api.editTask(modal.task.id, result.name, result.period, result.stateCount, result.professionId, result.customImage, result.trackProfit); setData(d);                                      break }
      case 'addTab':   { const d = await api.addTab(result);    setData(d); setActiveTabId(d.tabs[d.tabs.length - 1].id); showToast(t('tabAdded', { name: result.name })); break }
      case 'editTab':  { const d = await api.editTab({ tabId: modal.tab.id, ...result });       setData(d); break }
    }
    closeModal()
  }

  const onReorderChars = useCallback(async (ids) => { const d = await api.reorderCharacters(ids); setData(d) }, [])
  const onReorderTasks  = useCallback(async (ids) => { const d = await api.reorderTasks(ids);       setData(d) }, [])
  const onReorderTabs   = useCallback(async (ids) => { const d = await api.reorderTabs(ids);        setData(d) }, [])

  // Tabs
  const openAddTab  = ()    => setModal({ type: 'addTab' })
  const openEditTab = (tab) => setModal({ type: 'editTab', tab })
  const confirmDeleteTab = (tabId) => {
    if (data.tabs.length <= 1) return showToast(t('cannotDeleteLastTab'))
    const tab = data.tabs.find(tb => tb.id === tabId)
    if (!tab) return
    setModal({
      type: 'confirm', title: t('deleteTabTitle'),
      message: t('deleteTabMsg', { name: tab.name }), variant: 'danger',
      onConfirm: async () => {
        const d = await api.deleteTab(tabId)
        setData(d)
        if (activeTabId === tabId) setActiveTabId(d.tabs[0]?.id || null)
        closeModal(); showToast(t('tabDeleted', { name: tab.name }))
      }
    })
  }

  const onExport = async () => { const r = await api.exportJson(); if (r.success) showToast(t('dataExported')) }
  const onImport = async () => {
    const r = await api.importJson()
    if (r.success) { setData(r.data); showToast(t('dataImported')) }
    else if (r.error) showToast(t('importFailed', { error: r.error }))
  }

  if (!data) return (
    <div className="app" style={{ alignItems:'center', justifyContent:'center', display:'flex', color:'var(--fg2)' }}>
      {t('loading')}
    </div>
  )

  const tabTasks = data.tasks.filter(t => t.tab_id === activeTabId)
  const tabData  = { ...data, tasks: tabTasks }

  return (
    <div className="app">
      <Titlebar />
      <Toolbar
        onAddChar={openAddChar}
        onToggleTasks={() => setTaskSidebarOpen(o => !o)} tasksOpen={taskSidebarOpen}
        onExport={onExport} onImport={onImport}
        zoom={zoom} onZoomChange={onZoomChange}
        onToast={showToast}
      />
      <div className="body-content">
        <TabSidebar
          tabs={data.tabs}
          activeTabId={activeTabId}
          onSelect={setActiveTabId}
          onAdd={openAddTab}
          onEdit={openEditTab}
          onDelete={confirmDeleteTab}
          onReorder={onReorderTabs}
        />
        <div className="main-content">
          <Dashboard data={tabData} selected={selected} onSelect={setSelected} onToggle={onToggle} onReorderChars={onReorderChars} onReorderTasks={onReorderTasks} onEditChar={openEditChar} onSetProfit={onSetProfit} onEditTask={openEditTask} />
          {taskSidebarOpen && (
            <TaskSidebar tasks={tabTasks} selectedTaskId={selectedTask} onSelectTask={setSelectedTask}
              onAdd={openAddTask} onEdit={openEditTask} onDelete={confirmDeleteTask} onReorder={onReorderTasks} />
          )}
        </div>
      </div>

      {modal?.type === 'addChar'  && <CharacterModal title={t('newCharTitle')} onSubmit={onModalSubmit} onClose={closeModal} />}
      {modal?.type === 'editChar' && <CharacterModal title={t('editCharTitle')} initial={modal.char.name} initialClassId={modal.char.class_id || null} hiddenTaskIds={modal.char.hidden_task_ids || []} tasks={modal.tasks || []} tabs={data.tabs} onSubmit={onModalSubmit} onClose={closeModal} onDelete={() => { const char = modal.char; setModal({ type: 'confirm', title: t('deleteCharTitle'), message: t('deleteCharMsg', { name: char.name }), variant: 'danger', onConfirm: async () => { const d = await api.deleteCharacter(char.id); setData(d); setSelected(null); closeModal(); showToast(t('charDeleted', { name: char.name })) } }) }} />}
      {modal?.type === 'addTask'  && <TaskModal title={t('newTaskTitle')} onSubmit={onModalSubmit} onClose={closeModal} />}
      {modal?.type === 'editTask' && <TaskModal title={t('editTaskTitle')} initial={modal.task} onSubmit={onModalSubmit} onClose={closeModal} />}
      {modal?.type === 'addTab'   && <TabModal title={t('newTabTitle')} onSubmit={onModalSubmit} onClose={closeModal} />}
      {modal?.type === 'editTab'  && <TabModal title={t('editTabTitle')} initial={modal.tab} onSubmit={onModalSubmit} onClose={closeModal} />}
      {modal?.type === 'confirm'  && <ConfirmModal title={modal.title} message={modal.message} variant={modal.variant} onConfirm={modal.onConfirm} onClose={closeModal} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

