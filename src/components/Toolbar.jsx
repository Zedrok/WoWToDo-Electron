import { useState, useRef, useEffect } from 'react'
import { useLang } from '../LangContext.jsx'

const ZOOM_LEVELS = [0.75, 0.85, 1, 1.15, 1.25]

export default function Toolbar({ onAddChar, onToggleTasks, tasksOpen, onExport, onImport, zoom, onZoomChange, onToast }) {
  const { t, lang, setLang } = useLang()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [appVersion, setAppVersion] = useState('')
  const wrapRef = useRef()

  useEffect(() => {
    window.api.getAppVersion().then(v => setAppVersion(v))
  }, [])

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true)
    try {
      const result = await window.api.checkForUpdates()
      if (!result.hasUpdate && !result.error) {
        onToast(t('upToDate'))
      } else if (result.error) {
        onToast(t('updateCheckFailed'))
      }
    } finally {
      setCheckingUpdate(false)
      setSettingsOpen(false)
    }
  }

  useEffect(() => {
    if (!settingsOpen) return
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setSettingsOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [settingsOpen])

  return (
    <div className="toolbar no-drag">
      <button className="btn btn-primary" onClick={onAddChar} title={t('addCharTooltip')}>{t('addCharBtn')}</button>
      <button className={`btn ${tasksOpen ? 'btn-gold' : 'btn-secondary'}`} onClick={onToggleTasks} title={t('toggleTasksTooltip')}>{t('tasksBtn')}</button>

      <div style={{ flex: 1 }} />

      <div className="settings-wrap" ref={wrapRef}>
        <button className={`btn btn-secondary${settingsOpen ? ' active' : ''}`} onClick={() => setSettingsOpen(o => !o)}>
          {t('settingsBtn')}
        </button>
        {settingsOpen && (
          <div className="settings-menu">
            <button className="settings-item" onClick={() => { onExport(); setSettingsOpen(false) }}>{t('exportItem')}</button>
            <button className="settings-item" onClick={() => { onImport(); setSettingsOpen(false) }}>{t('importItem')}</button>
            <div className="settings-sep" />
            <div className="settings-item settings-zoom">
              <span>{t('zoomLabel')}</span>
              <select
                className="zoom-select"
                value={zoom}
                onChange={e => onZoomChange(parseFloat(e.target.value))}
              >
                {ZOOM_LEVELS.map(v => (
                  <option key={v} value={v}>{Math.round(v * 100)}%</option>
                ))}
              </select>
            </div>
            <div className="settings-sep" />
            <div className="settings-item settings-zoom">
              <span>{t('languageLabel')}</span>
              <select
                className="zoom-select"
                value={lang}
                onChange={e => setLang(e.target.value)}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="settings-sep" />
            <button className="settings-item" onClick={handleCheckUpdates} disabled={checkingUpdate}>
              {checkingUpdate ? t('checkingUpdate') : t('checkUpdateItem')}
            </button>
            {appVersion && (
              <>
                <div className="settings-sep" />
                <div style={{ padding: '5px 14px 7px', fontSize: '10px', color: 'var(--fg2)' }}>
                  {t('currentVersion')} v{appVersion}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
