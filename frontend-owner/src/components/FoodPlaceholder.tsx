interface FoodPlaceholderProps {
  size?: 'sm' | 'md' | 'lg'
  aspect?: '1/1' | '4/3'
  label?: string
  className?: string
}

const SIZES: Record<string, { width: number; height: number; icon: number }> = {
  sm: { width: 36, height: 36, icon: 18 },
  md: { width: 120, height: 120, icon: 52 },
  lg: { width: 300, height: 300, icon: 112 },
}

export default function FoodPlaceholder({
  size = 'md',
  aspect = '1/1',
  label,
  className = '',
}: FoodPlaceholderProps) {
  const dims = SIZES[size]
  const ratio = aspect === '1/1' ? '1 / 1' : '4 / 3'

  return (
    <div
      className={`food-placeholder food-ph-${size}${className ? ' ' + className : ''}`}
      style={{ aspectRatio: ratio }}
      role="img"
      aria-label={label || 'Illustrated dish placeholder'}
    >
      <svg
        viewBox="0 0 120 120"
        width={dims.icon}
        height={dims.icon}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="60" cy="60" r="44" fill="#F2E8D4" stroke="#C79A3C" strokeWidth="2.5" />
        <path
          d="M42 46c0-7 4-13 8-15M78 46c0-7-4-13-8-15"
          stroke="#C79A3C"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M47 60h26"
          stroke="#C79A3C"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M52 66h16M56 72h8"
          stroke="#B5502F"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {label && <span className="food-ph-label">{label}</span>}
    </div>
  )
}
