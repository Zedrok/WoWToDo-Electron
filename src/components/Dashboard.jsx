import { useRef, useState, useMemo } from 'react'
import { WOW_CLASSES } from '../assets/classes/index.js'
import { WOW_PROFESSIONS } from '../assets/professions/index.js'
import { useLang } from '../LangContext.jsx'

const CLASS_MAP      = Object.fromEntries(WOW_CLASSES.map(c => [c.id, c]))
const PROFESSION_MAP = Object.fromEntries(WOW_PROFESSIONS.map(p => [p.id, p]))

export default function Dashboard({ data, selected, onSelect, onToggle, onReorderChars, onReorderTasks, onEditChar, onSetProfit, onEditTask }) {
  const { t } = useLang()
  const { characters: chars, tasks } = data
  const dragCharId = useRef(null)
  const dragTaskId = useRef(null)
  const [overCharId, setOverCharId] = useState(null)
  const [overTaskId, setOverTaskId] = useState(null)
  const [profitEdit, setProfitEdit] = useState(null)   // { cid, tid }
  const [profitDraft, setProfitDraft] = useState('')

  // "today" = key for the current daily-reset period (resets at 15:00 UTC, not calendar midnight)
  const today = useMemo(() => {
    const now = new Date()
    const candidate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 15, 0, 0))
    const lastReset = now >= candidate ? candidate : new Date(candidate.getTime() - 86400000)
    return lastReset.toISOString().slice(0, 10)
  }, [])
  const weekStart = useMemo(() => {
    const now = new Date()
    const daysBack = (now.getUTCDay() - 2 + 7) % 7  // Tuesday
    const candidate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysBack, 15, 0, 0))
    const result = now < candidate ? new Date(candidate.getTime() - 7 * 86400000) : candidate
    return result.toISOString().slice(0, 10)
  }, [])

  const getWeeklyProfit = (compl) => {
    const log = compl?.profit_log || {}
    return Object.entries(log).filter(([d]) => d >= weekStart).reduce((s, [, v]) => s + Number(v), 0)
  }

  const formatProfit = (amount) => {
    const n = Math.round(amount * 10) / 10
    return `${n}K`
  }

  const charDrag = {
    onDragStart: (e, id) => { dragCharId.current = id; e.dataTransfer.effectAllowed = 'move' },
    onDragOver:  (e, id) => { e.preventDefault(); if (dragCharId.current && dragCharId.current !== id) setOverCharId(id) },
    onDrop:      (e, id) => {
      e.preventDefault()
      if (!dragCharId.current || dragCharId.current === id) return
      const ids = chars.map(c => c.id)
      const from = ids.indexOf(dragCharId.current); const to = ids.indexOf(id)
      ids.splice(from, 1); ids.splice(to, 0, dragCharId.current)
      dragCharId.current = null; setOverCharId(null)
      onReorderChars(ids)
    },
    onDragEnd: () => { dragCharId.current = null; setOverCharId(null) },
  }

  const taskDrag = {
    onDragStart: (e, id) => { dragTaskId.current = id; e.dataTransfer.effectAllowed = 'move' },
    onDragOver:  (e, id) => { e.preventDefault(); if (dragTaskId.current && dragTaskId.current !== id) setOverTaskId(id) },
    onDrop:      (e, id) => {
      e.preventDefault()
      if (!dragTaskId.current || dragTaskId.current === id) return
      const ids = tasks.map(t => t.id)
      const from = ids.indexOf(dragTaskId.current); const to = ids.indexOf(id)
      ids.splice(from, 1); ids.splice(to, 0, dragTaskId.current)
      dragTaskId.current = null; setOverTaskId(null)
      onReorderTasks(ids)
    },
    onDragEnd: () => { dragTaskId.current = null; setOverTaskId(null) },
  }

  if (!chars.length && !tasks.length) {
    return (
      <div className="dashboard-area">
        <div className="empty-state">
          <h3>{t('noDataTitle')}</h3>
          <p>{t('noDataDesc').split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}</p>
        </div>
      </div>
    )
  }

  if (!chars.length) {
    return (
      <div className="dashboard-area">
        <div className="empty-state">
          <h3>{t('noCharsTitle')}</h3>
          <p>{t('noCharsDesc')}</p>
        </div>
      </div>
    )
  }

  if (!tasks.length) {
    return (
      <div className="dashboard-area">
        <div className="empty-state">
          <h3>{t('noTasksTitle')}</h3>
          <p>{t('noTasksDesc')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-area">
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>{t('charColumn')}</th>
              {tasks.map(task => {
                const period = (task.periodicity || 'daily').toLowerCase()
                const taskDailyTotal = task.track_profit
                  ? chars.reduce((sum, char) => {
                      if ((char.hidden_task_ids || []).includes(task.id)) return sum
                      return sum + Number(task.completion?.[char.id]?.profit_log?.[today] || 0)
                    }, 0)
                  : 0
                const taskWeeklyTotal = task.track_profit
                  ? chars.reduce((sum, char) => {
                      if ((char.hidden_task_ids || []).includes(task.id)) return sum
                      return sum + getWeeklyProfit(task.completion?.[char.id] || {})
                    }, 0)
                  : 0
                return (
                  <th
                    key={task.id}
                    title={task.name}
                    draggable
                    className={overTaskId === task.id ? 'drag-over-col' : ''}
                    onDoubleClick={() => onEditTask(task.id)}
                    onDragStart={e => taskDrag.onDragStart(e, task.id)}
                    onDragOver={e => taskDrag.onDragOver(e, task.id)}
                    onDrop={e => taskDrag.onDrop(e, task.id)}
                    onDragEnd={taskDrag.onDragEnd}
                  >
                    <div className="task-header-cell">
                      {(task.custom_image || (task.profession_id && PROFESSION_MAP[task.profession_id]))
                        ? task.custom_image
                          ? <img src={task.custom_image} alt="" className="task-prof-icon" />
                          : <img src={PROFESSION_MAP[task.profession_id].icon} alt={PROFESSION_MAP[task.profession_id].name} className="task-prof-icon" title={PROFESSION_MAP[task.profession_id].name} />
                        : null
                      }
                      <span className="task-header-name">{task.name}</span>
                      <span className={`period-badge ${period}`}>{t('period' + period.charAt(0).toUpperCase() + period.slice(1)) || period}</span>
                      {task.track_profit && (
                        <div className="task-header-totals">
                          {period === 'daily' && (
                            <span className={`profit-tag daily${taskDailyTotal > 0 ? ' has-profit' : ' no-profit'} no-click`}>
                              {taskDailyTotal > 0 ? '+' + formatProfit(taskDailyTotal) : '·'}
                            </span>
                          )}
                          <span className={`profit-tag weekly${taskWeeklyTotal > 0 ? ' has-profit' : ' no-profit'} no-click`}>
                            {taskWeeklyTotal > 0 ? formatProfit(taskWeeklyTotal) : '·'}
                          </span>
                        </div>
                      )}
                    </div>
                  </th>
                )
              })}
              <th className="total-th">
                <div className="task-header-cell">
                  <span className="task-header-name">{t('totalColumn')}</span>
                  {(() => {
                    const grandTotal = chars.reduce((sum, char) => {
                      return sum + tasks.reduce((s, task) => {
                        if ((char.hidden_task_ids || []).includes(task.id)) return s
                        if (!task.track_profit) return s
                        return s + getWeeklyProfit(task.completion?.[char.id] || {})
                      }, 0)
                    }, 0)
                    return grandTotal > 0
                      ? <span className="profit-tag weekly has-profit no-click">{formatProfit(grandTotal)}</span>
                      : null
                  })()}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {chars.map(char => {
              const isRowSelected = selected?.cid === char.id
              const charTotal = tasks.reduce((sum, task) => {
                if ((char.hidden_task_ids || []).includes(task.id)) return sum
                if (!task.track_profit) return sum
                return sum + getWeeklyProfit(task.completion?.[char.id] || {})
              }, 0)
              return (
                <tr
                  key={char.id}
                  draggable
                  className={[isRowSelected ? 'selected-row' : '', overCharId === char.id ? 'drag-over-row' : ''].filter(Boolean).join(' ')}
                  onDragStart={e => charDrag.onDragStart(e, char.id)}
                  onDragOver={e => charDrag.onDragOver(e, char.id)}
                  onDrop={e => charDrag.onDrop(e, char.id)}
                  onDragEnd={charDrag.onDragEnd}
                >
                  <td
                    className="char-name"
                    onClick={() => onSelect({ cid: char.id, tid: selected?.tid || null })}
                    onDoubleClick={() => onEditChar(char.id)}
                    title={char.name}
                  >
                    {char.class_id && CLASS_MAP[char.class_id] && (
                      <img src={CLASS_MAP[char.class_id].icon} alt={CLASS_MAP[char.class_id].name} className="char-class-icon" title={CLASS_MAP[char.class_id].name} />
                    )}
                    {char.name}
                  </td>
                  {tasks.map(task => {
                    const period     = (task.periodicity || 'daily').toLowerCase()
                    const isDisabled = (char.hidden_task_ids || []).includes(task.id)
                    const compl      = task.completion?.[char.id] || { status: 0 }
                    const status     = compl.status ?? 0
                    const states     = task.state_count || 3
                    const isComplete = status === states - 1
                    const stateClass = isDisabled ? 'disabled' : isComplete ? 'checked' : (states === 3 && status === 1) ? 'in-progress' : 'unchecked'
                    const stateIcon  = isDisabled ? '—' : isComplete ? '☑' : (states === 3 && status === 1) ? '⬤' : '☐'
                    const trackProfit  = task.track_profit === true
                    const displayMode  = (trackProfit && period === 'daily') ? (task.profit_display || 'both') : 'weekly'
                    const showDailyTag  = displayMode === 'daily'  || displayMode === 'both'
                    const showWeeklyTag = displayMode === 'weekly' || displayMode === 'both'
                    const isEditing    = profitEdit?.cid === char.id && profitEdit?.tid === task.id
                    const profitKey    = period === 'daily' ? today : weekStart
                    const todayProfit  = isDisabled ? 0 : Number(compl.profit_log?.[today] || 0)
                    const weeklyProfit = isDisabled ? 0 : getWeeklyProfit(compl)
                    const hasToday     = todayProfit > 0
                    const hasWeekly    = weeklyProfit > 0

                    const handleProfitClick = (e) => {
                      e.stopPropagation()
                      const current = compl.profit_log?.[profitKey]
                      setProfitDraft(current != null ? String(current) : '')
                      setProfitEdit({ cid: char.id, tid: task.id })
                    }

                    const handleProfitSubmit = async () => {
                      const trimmed = profitDraft.trim()
                      if (trimmed === '') {
                        await onSetProfit(char.id, task.id, profitKey, null)
                      } else {
                        const val = parseFloat(trimmed)
                        if (!isNaN(val)) await onSetProfit(char.id, task.id, profitKey, val)
                      }
                      setProfitEdit(null)
                    }

                    return (
                      <td
                        key={task.id}
                        onClick={isDisabled ? undefined : async () => {
                          await onToggle(char.id, task.id)
                          const nextStatus = (status + 1) % states
                          const willComplete = nextStatus === states - 1
                          if (trackProfit && willComplete) {
                            const current = compl.profit_log?.[profitKey]
                            setProfitDraft(current != null ? String(current) : '')
                            setProfitEdit({ cid: char.id, tid: task.id })
                          }
                        }}
                        style={isDisabled ? { cursor: 'default', background: 'rgba(0,0,0,0.15)' } : {}}
                        title={isDisabled ? `${task.name} — disabled for ${char.name}` : `${char.name} — ${task.name}`}
                      >
                        <div className="task-cell-wrap">
                          <span className={`checkbox-cell ${stateClass}`}>{stateIcon}</span>
                          {trackProfit && !isDisabled && (
                            isEditing ? (
                              <input
                                className="profit-input"
                                type="number"
                                step="0.1"
                                min="0"
                                value={profitDraft}
                                onChange={e => setProfitDraft(e.target.value)}
                                onBlur={handleProfitSubmit}
                                onKeyDown={e => { if (e.key === 'Enter') handleProfitSubmit(); if (e.key === 'Escape') setProfitEdit(null) }}
                                onClick={e => e.stopPropagation()}
                                onFocus={e => e.target.select()}
                                autoFocus
                                placeholder="0"
                              />
                            ) : period === 'daily' ? (
                              <div className="profit-daily-wrap" title={t('profitTooltip')}>
                                {showDailyTag && (
                                  <span
                                    className={`profit-tag daily${hasToday ? ' has-profit' : ' no-profit'}`}
                                    onClick={handleProfitClick}
                                  >
                                    {hasToday ? '+' + formatProfit(todayProfit) : '·'}
                                  </span>
                                )}
                                {showWeeklyTag && (
                                  <span
                                    className={`profit-tag weekly${hasWeekly ? ' has-profit' : ' no-profit'}${showDailyTag ? ' no-click' : ''}`}
                                    onClick={!showDailyTag ? handleProfitClick : undefined}
                                  >
                                    {hasWeekly ? formatProfit(weeklyProfit) : '·'}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span
                                className={`profit-tag weekly${hasWeekly ? ' has-profit' : ' no-profit'}`}
                                onClick={handleProfitClick}
                                title={t('profitTooltip')}
                              >
                                {hasWeekly ? formatProfit(weeklyProfit) : '·'}
                              </span>
                            )
                          )}
                        </div>
                      </td>
                    )
                  })}
                  <td className="total-td">
                    {charTotal > 0
                      ? <span className="profit-total">{formatProfit(charTotal)}</span>
                      : <span style={{ color: 'var(--border2)' }}>—</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
