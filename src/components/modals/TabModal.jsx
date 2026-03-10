import { useState, useEffect, useRef } from 'react'
import { WOW_PROFESSIONS } from '../../assets/professions/index.js'
import { useLang } from '../../LangContext.jsx'

const PROFESSION_MAP = Object.fromEntries(WOW_PROFESSIONS.map(p => [p.id, p]))

const PRESET_COLORS = [
  '#c59953', '#4a94d8', '#52a34a', '#d04040', '#9b59b6',
  '#e67e22', '#1abc9c', '#e91e63', '#607d8b', '#ff9800',
  '#00bcd4', '#795548',
]

export default function TabModal({ title, initial = null, onSubmit, onClose }) {
  const { t } = useLang()
  const [name,           setName]           = useState(initial?.name || '')
  const [color,          setColor]          = useState(initial?.color || '#c59953')
  const [iconType,       setIconType]       = useState(initial?.icon_type || 'letter')
  const [iconImage,      setIconImage]      = useState(initial?.icon_type === 'image'      ? (initial.icon_value || null) : null)
  const [iconProfession, setIconProfession] = useState(initial?.icon_type === 'profession' ? (initial.icon_value || null) : null)
  const inputRef = useRef()
  const imageRef = useRef()

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { setIconImage(ev.target.result); setIconType('image') }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const iconValue = iconType === 'image' ? iconImage : iconType === 'profession' ? iconProfession : null
    onSubmit({ name: name.trim(), color, icon_type: iconType, icon_value: iconValue })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* Live preview */}
            <div className="tab-preview" style={{ borderColor: color, background: color + '18' }}>
              <div className="tab-preview-visual">
                {iconType === 'image' && iconImage
                  ? <img src={iconImage} alt="tab" className="tab-preview-img" />
                  : iconType === 'profession' && iconProfession && PROFESSION_MAP[iconProfession]
                    ? <img src={PROFESSION_MAP[iconProfession].icon} alt={iconProfession} className="tab-preview-img" />
                    : <span className="tab-preview-letter" style={{ color: iconType === 'letter' ? color : 'var(--fg3)' }}>{name[0]?.toUpperCase() || '?'}</span>
                }
              </div>
              <span className="tab-preview-name" style={{ color }}>{name || t('tabPreviewPlaceholder')}</span>
            </div>

            <div className="form-group">
              <label className="form-label">{t('tabNameLabel')}</label>
              <input
                ref={inputRef}
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('tabNamePlaceholder')}
                maxLength={30}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('colorLabel')}</label>
              <div className="color-swatches">
                {PRESET_COLORS.map(c => (
                  <button
                    type="button" key={c}
                    className={`color-swatch ${color === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
                <input
                  type="color"
                  className="color-custom"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  title={t('customColorTooltip')}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('iconLabel')}</label>
              <div className="tab-icon-picker">

                {/* Upload image cell */}
                <button
                  type="button"
                  title={t('uploadIconTooltip')}
                  className={`tab-icon-cell ${iconType === 'image' ? 'selected' : ''}`}
                  onClick={() => imageRef.current.click()}
                >
                  {iconType === 'image' && iconImage
                    ? <img src={iconImage} alt="" className="class-btn-img" />
                    : <span className="tab-icon-upload-plus">＋</span>
                  }
                </button>
                <input ref={imageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

                {/* Letter cell */}
                <button
                  type="button"
                  title={t('letterIconTooltip')}
                  className={`tab-icon-cell tab-icon-letter-cell ${iconType === 'letter' ? 'selected' : ''}`}
                  style={{ color: iconType === 'letter' ? color : undefined }}
                  onClick={() => setIconType('letter')}
                >
                  {name[0]?.toUpperCase() || 'A'}
                </button>

                {/* Profession icons */}
                {WOW_PROFESSIONS.map(prof => (
                  <button
                    key={prof.id}
                    type="button"
                    title={prof.name}
                    className={`tab-icon-cell ${iconType === 'profession' && iconProfession === prof.id ? 'selected' : ''}`}
                    onClick={() => { setIconType('profession'); setIconProfession(prof.id) }}
                  >
                    <img src={prof.icon} alt={prof.name} className="class-btn-img" />
                  </button>
                ))}
              </div>
              {iconType === 'image' && !iconImage && (
                <p style={{ fontSize: 11, color: 'var(--fg3)', marginTop: 4 }}>{t('uploadIconHint')}</p>
              )}
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('cancelBtn')}</button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>{t('saveBtn')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
