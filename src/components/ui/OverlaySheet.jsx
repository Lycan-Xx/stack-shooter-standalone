import IconButton from './IconButton';
import './OverlaySheet.css';

export default function OverlaySheet({ title, kicker, onClose, children, className = '', labelledBy = 'overlay-sheet-title' }) {
  return (
    <div className="overlay-sheet" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <section className={`overlay-sheet__surface ${className}`.trim()}>
        <header className="overlay-sheet__header">
          <div>
            {kicker && <p className="overlay-sheet__kicker">{kicker}</p>}
            <h2 id={labelledBy}>{title}</h2>
          </div>
          {onClose && <IconButton icon="close" label="Close" onClick={onClose} />}
        </header>
        <div className="overlay-sheet__body">{children}</div>
      </section>
    </div>
  );
}
