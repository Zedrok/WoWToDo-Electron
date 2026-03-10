import { useState, useEffect } from 'react'
import { useLang } from '../LangContext.jsx'

function fmt(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function fmtWeekly(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

export default function Titlebar() {
  const { t } = useLang()
  const [resets, setResets] = useState({ daily: null, weekly: null })

  useEffect(() => {
    const load = async () => {
      const r = await window.api.getResets()
      setResets({ daily: new Date(r.nextDaily), weekly: new Date(r.nextWeekly) })
    }
    load()
    const iv = setInterval(load, 60000)
    return () => clearInterval(iv)
  }, [])

  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => forceUpdate(n => n + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  const now = Date.now()
  const dailyMs  = resets.daily  ? resets.daily.getTime()  - now : 0
  const weeklyMs = resets.weekly ? resets.weekly.getTime() - now : 0

  return (
    <div className="titlebar">
      <span className="titlebar-title">WoW ToDo List</span>

      <div className="titlebar-resets">
        <div className="reset-badge daily">
          <span className="dot" />
          <span>{t('dailyReset')}</span>
          <span className="reset-time">{fmt(dailyMs)}</span>
        </div>
        <div className="reset-badge weekly">
          <span className="dot" />
          <span>{t('weeklyReset')}</span>
          <span className="reset-time">{fmtWeekly(weeklyMs)}</span>
        </div>
      </div>
    </div>
  )
}
