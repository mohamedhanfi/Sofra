const WS_URL = 'ws://127.0.0.1:8000/ws/admin/orders'

export function connectOrdersWS({ onEvent, onStatus }) {
  let socket = null
  let closedByUser = false
  let reconnectTimer = null
  let retryCount = 0

  function setStatus(status) {
    if (onStatus) onStatus(status)
  }

  function connect() {
    if (closedByUser) return

    try {
      socket = new WebSocket(WS_URL)
    } catch {
      scheduleReconnect()
      return
    }

    socket.onopen = function () {
      retryCount = 0
      setStatus('connected')
    }

    socket.onmessage = function (event) {
      let data
      try {
        data = JSON.parse(event.data)
      } catch {
        return
      }
      if (!data || typeof data.event !== 'string') return

      if (data.event === 'connected') {
        return
      }

      if (data.event === 'order_created' || data.event === 'status_changed') {
        if (typeof onEvent === 'function') {
          onEvent(data.event, data.order)
        }
      }
    }

    socket.onerror = function () {
      try {
        socket.close()
      } catch {}
    }

    socket.onclose = function () {
      setStatus('reconnecting')
      scheduleReconnect()
    }
  }

  function scheduleReconnect() {
    if (closedByUser) return
    retryCount += 1
    const delay = Math.min(1000 * retryCount, 10000)
    clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(connect, delay)
  }

  function close() {
    closedByUser = true
    clearTimeout(reconnectTimer)
    if (socket) {
      try {
        socket.close()
      } catch {}
    }
  }

  connect()

  return { close }
}
