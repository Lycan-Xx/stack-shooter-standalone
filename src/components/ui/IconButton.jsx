import GameIcon from './GameIcon';
import './IconButton.css';

export default function IconButton({ icon, label, size = 22, variant = 'default', className = '', ...props }) {
  return (
    <button className={`icon-button icon-button--${variant} ${className}`.trim()} aria-label={label} title={label} {...props}>
      <GameIcon name={icon} size={size} />
    </button>
  );
}
