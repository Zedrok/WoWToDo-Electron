import { useLang } from '../../LangContext.jsx'

export default function ConfirmModal({ title, message, variant = 'danger', onConfirm, onClose }) {
  const { t } = useLang()
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="confirm-message">{message}</p>
          <p className="confirm-warn">{t('confirmWarning')}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>{t('cancelBtn')}</button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {t('confirmBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
