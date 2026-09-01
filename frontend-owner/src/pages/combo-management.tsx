import { useEffect, useState } from 'react'
import {
  getCombosAdmin,
  getMenuAdmin,
  createCombo,
  updateCombo,
  setComboActive,
  deleteCombo,
} from '../api/client'
import type { Combo, MenuItem } from '../types'
import PriceLabel from '../components/PriceLabel'
import Button from '../components/Button'
import Modal from '../components/Modal'
import ComboForm from '../components/ComboForm'
import { useToast } from '../components/Toast'

export default function ComboManagement() {
  const [combos, setCombos] = useState<Combo[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Combo | null>(null)
  const [adding, setAdding] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    Promise.all([getCombosAdmin(), getMenuAdmin()])
      .then(([c, m]) => {
        if (!mounted) return
        setCombos(c)
        setMenuItems(m)
      })
      .catch(() => mounted && setCombos([]))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  function toPayload(data: Omit<Combo, 'id'>) {
    return {
      name_en: data.name_en,
      name_ar: data.name_ar,
      combo_price: data.combo_price,
      photo_url: data.photo_url || undefined,
      active: data.active,
      items: (data.items ?? []).map((it) => {
        const item = menuItems.find((m) => m.name_en === it.item_name_en)
        return {
          item_id: item?.id ?? it.item_id ?? 0,
          quantity: it.quantity,
        }
      }),
    }
  }

  async function toggleActive(id: number) {
    const combo = combos.find((c) => c.id === id)
    if (!combo) return
    try {
      const updated = await setComboActive(id, !combo.active)
      setCombos((prev) => prev.map((c) => (c.id === id ? updated : c)))
      toast(updated.active ? `${updated.name_en} activated ✓` : `${updated.name_en} paused`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update combo.', 'error')
    }
  }

  async function saveCombo(data: Omit<Combo, 'id'>) {
    try {
      if (editing) {
        const updated = await updateCombo(editing.id, toPayload(data))
        setCombos((prev) => prev.map((c) => (c.id === editing.id ? updated : c)))
        toast(`${updated.name_en} updated ✓`)
      } else {
        const created = await createCombo(toPayload(data))
        setCombos((prev) => [...prev, created])
        toast(`${created.name_en} added ✓`)
      }
      setEditing(null)
      setAdding(false)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save combo.', 'error')
    }
  }

  async function handleDelete(combo: Combo) {
    try {
      await deleteCombo(combo.id)
      setCombos((prev) => prev.filter((c) => c.id !== combo.id))
      toast(`${combo.name_en} deleted`, 'info')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete combo.', 'error')
    }
  }

  if (loading) {
    return <div className="card">Loading combos…</div>
  }

  return (
    <>
      <div className="page-heading menu-heading">
        <div>
          <h1>Combo Management</h1>
          <p>Build bundle offers from your menu items.</p>
        </div>
        <Button onClick={() => setAdding(true)}>+ Add Combo</Button>
      </div>

      <div className="combo-grid">
        {combos.map((combo) => (
          <div className={`card combo-card${!combo.active ? ' combo-paused' : ''}`} key={combo.id}>
            <div className="combo-card-top">
              <div className="combo-photo">{combo.photo_url ? '🛍️' : '🛍️'}</div>
              <span className={`combo-status ${combo.active ? 'on' : 'off'}`}>
                {combo.active ? 'Active' : 'Paused'}
              </span>
            </div>
            <h3>{combo.name_en}</h3>
            <div className="muted">{combo.name_ar}</div>
            <ul className="combo-items">
              {combo.items?.map((it, i) => (
                <li key={i}>
                  {it.quantity}× {it.item_name_en}
                </li>
              ))}
            </ul>
            <div className="combo-pricing">
              <div className="combo-price">
                <PriceLabel value={combo.combo_price} />
              </div>
              {combo.component_sum && combo.component_sum > combo.combo_price && (
                <div className="combo-save">
                  Customer saves{' '}
                  <strong>{combo.component_sum - combo.combo_price} EGP</strong>
                </div>
              )}
            </div>
            <div className="combo-actions">
              <Button variant="secondary" onClick={() => setEditing(combo)}>
                Edit
              </Button>
              <Button
                variant="secondary"
                onClick={() => toggleActive(combo.id)}
              >
                {combo.active ? 'Pause' : 'Activate'}
              </Button>
              <Button variant="ghost" onClick={() => handleDelete(combo)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {adding && (
        <Modal title="Add Combo" onClose={() => setAdding(false)}>
          <ComboForm
            menuItems={menuItems}
            onSave={saveCombo}
            onCancel={() => setAdding(false)}
          />
        </Modal>
      )}

      {editing && (
        <Modal title={`Edit ${editing.name_en}`} onClose={() => setEditing(null)}>
          <ComboForm
            initial={editing}
            menuItems={menuItems}
            onSave={saveCombo}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </>
  )
}
