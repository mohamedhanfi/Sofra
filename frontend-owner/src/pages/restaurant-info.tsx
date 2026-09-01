import { useEffect, useState } from 'react'
import { getRestaurant, updateRestaurant } from '../api/client'
import Button from '../components/Button'
import { useToast } from '../components/Toast'

function stringify(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

export default function RestaurantInfo() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [hours, setHours] = useState('')
  const [zones, setZones] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    getRestaurant()
      .then((r) => {
        if (!mounted) return
        setName(r.name ?? '')
        setAddress(r.address ?? '')
        setPhone(r.phone ?? '')
        setPaymentNote(r.payment_note ?? '')
        setHours(stringify(r.opening_hours))
        setZones(stringify(r.delivery_zones))
      })
      .catch(() => mounted && toast('Failed to load restaurant info.', 'error'))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateRestaurant({
        name: name || undefined,
        address: address || undefined,
        phone: phone || undefined,
        payment_note: paymentNote || undefined,
        opening_hours: hours.trim() ? hours : undefined,
        delivery_zones: zones.trim() ? zones : undefined,
      })
      toast('Restaurant info saved ✓')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save restaurant info.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="card">Loading restaurant info…</div>
  }

  return (
    <form onSubmit={save}>
      <div className="page-heading">
        <h1>Restaurant Info</h1>
        <p>Hours, address, delivery zones, and payment details.</p>
      </div>

      <div className="ri-wrap">
        <div className="card ri-section">
          <h3>General</h3>
          <div className="field">
            <span>Restaurant Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <span>Address</span>
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="field">
            <span>Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="field">
            <span>Payment Note</span>
            <input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} />
          </div>
        </div>

        <div className="card ri-section">
          <h3>Opening Hours</h3>
          <p className="muted">Free text or JSON.</p>
          <textarea
            rows={5}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder={`{"sat":"12:00 - 00:00", ...} or plain text`}
          />
        </div>

        <div className="card ri-section">
          <h3>Delivery Zones</h3>
          <p className="muted">Free text or JSON.</p>
          <textarea
            rows={5}
            value={zones}
            onChange={(e) => setZones(e.target.value)}
            placeholder={`[{"area":"Downtown","fee":20}, ...] or plain text`}
          />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
