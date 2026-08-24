export default function GameButton({ variant = 'default', className = '', children, ...props }) {
  return (
    <button className={`game-button game-button--${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
