import { useLang } from '../../LangContext.jsx'

export default function ChangelogModal({ changes, currentVersion, onClose }) {
  const { t } = useLang()

  if (!changes || changes.length === 0) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{t('whatsNewTitle')}</div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--fg2)',
              cursor: 'pointer',
              fontSize: '18px',
              padding: 0,
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: '400px' }}>
          {changes.map((item, idx) => (
            <div key={idx}>
              <div style={{ marginBottom: '8px' }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--gold)',
                  marginBottom: '6px'
                }}>
                  v{item.version}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--fg2)',
                  marginBottom: '8px'
                }}>
                  {new Date(item.date).toLocaleDateString()}
                </div>
                <ul style={{
                  marginLeft: '16px',
                  fontSize: '12px',
                  color: 'var(--fg)',
                  lineHeight: '1.6'
                }}>
                  {item.changes.map((change, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{change}</li>
                  ))}
                </ul>
              </div>
              {idx < changes.length - 1 && (
                <div style={{
                  height: '1px',
                  background: 'var(--border)',
                  margin: '12px 0'
                }} />
              )}
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            {t('closeBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
