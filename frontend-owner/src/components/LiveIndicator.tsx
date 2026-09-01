type LiveState = 'connected' | 'reconnecting' | 'offline'

export default function LiveIndicator({ state = 'connected' }: { state?: LiveState }) {
  return (
    <span className={`live-indicator live-${state}`}>
      <span className="live-dot" />
      {state === 'connected' && 'Live'}
      {state === 'reconnecting' && 'Reconnecting…'}
      {state === 'offline' && 'Offline'}
    </span>
  )
}
