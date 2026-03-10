import { useRef, useState } from 'react'
import { WOW_PROFESSIONS } from '../assets/professions/index.js'

const PROFESSION_MAP = Object.fromEntries(WOW_PROFESSIONS.map(p => [p.id, p]))

export default function TabSidebar({ tabs, activeTabId, onSelect, onAdd, onEdit, onDelete, onReorder }) {
  const dragId = useRef(null)
  const [overId, setOverId] = useState(null)

  const handleDragStart = (e, id) => { dragId.current = id; e.dataTransfer.effectAllowed = 'move' }
  const handleDragOver  = (e, id) => { e.preventDefault(); if (dragId.current && dragId.current !== id) setOverId(id) }
  const handleDrop      = (e, id) => {
    e.preventDefault()
    if (!dragId.current || dragId.current === id) return
    const ids  = tabs.map(t => t.id)
    const from = ids.indexOf(dragId.current); const to = ids.indexOf(id)
    ids.splice(from, 1); ids.splice(to, 0, dragId.current)
    dragId.current = null; setOverId(null)
    onReorder(ids)
  }
  const handleDragEnd = () => { dragId.current = null; setOverId(null) }

  return (
    <div className="tab-sidebar">
      <div className="tab-list">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab-btn ${activeTabId === tab.id ? 'active' : ''} ${overId === tab.id ? 'tab-drag-over' : ''}`}
            style={{ '--tab-color': tab.color }}
            draggable
            onClick={() => onSelect(tab.id)}
            onDoubleClick={() => onEdit(tab)}
            onDragStart={e => handleDragStart(e, tab.id)}
            onDragOver={e => handleDragOver(e, tab.id)}
            onDrop={e => handleDrop(e, tab.id)}
            onDragEnd={handleDragEnd}
            title={`${tab.name}\nDouble-click to edit`}
          >
            {tab.icon_type === 'image' && tab.icon_value
              ? <img src={tab.icon_value} alt="" style={{ width: 36, height: 36, borderRadius: 4 }} />
              : tab.icon_type === 'profession' && tab.icon_value && PROFESSION_MAP[tab.icon_value]
                ? <img src={PROFESSION_MAP[tab.icon_value].icon} alt="" style={{ width: 36, height: 36, borderRadius: 4 }} />
                : <span className="tab-btn-letter" style={{ color: tab.color }}>{tab.name[0]?.toUpperCase()}</span>
            }
            <span className="tab-btn-name">{tab.name}</span>
            {activeTabId === tab.id && tabs.length > 1 && (
              <button
                className="tab-btn-delete"
                onClick={e => { e.stopPropagation(); onDelete(tab.id) }}
                title="Delete tab"
              >✕</button>
            )}
          </div>
        ))}
      </div>
      <button className="tab-add-btn" onClick={onAdd} title="Add tab">＋</button>
    </div>
  )
}
