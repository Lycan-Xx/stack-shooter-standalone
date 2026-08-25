import './GlassSurface.css';

export default function GlassSurface({ as: Element = 'section', className = '', children, ...props }) {
  return <Element className={`glass-surface ${className}`.trim()} {...props}>{children}</Element>;
}
