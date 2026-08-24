export default function GamePanel({ className = '', children, ...props }) {
  return <section className={`game-panel ${className}`.trim()} {...props}>{children}</section>;
}
