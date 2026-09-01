import { useEffect, useMemo, useState } from 'react'
import {
  getMenuAdmin,
  createItem,
  updateItem,
  setItemAvailability,
  deleteItem,
} from '../api/client'
import type { MenuItem } from '../types'
import FoodPlaceholder from '../components/FoodPlaceholder'
import PriceLabel from '../components/PriceLabel'
import Button from '../components/Button'
import Modal from '../components/Modal'
import ItemForm from '../components/ItemForm'
import { useToast } from '../components/Toast'

export default function MenuManagement() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [adding, setAdding] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    getMenuAdmin()
      .then((data) => mounted && setItems(data))
      .catch(() => mounted && setItems([]))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))),
    [items]
  )

  async function toggleAvailability(id: number) {
    const item = items.find((i) => i.id === id)
    if (!item) return
    try {
      const updated = await setItemAvailability(id, !item.available)
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
      toast(
        updated.available
          ? `${updated.name_en} is back on the menu ✓`
          : `${updated.name_en} marked as Sold Out`
      )
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update availability.', 'error')
    }
  }

  async function saveItem(data: Omit<MenuItem, 'id'>) {
    try {
      if (editing) {
        const updated = await updateItem(editing.id, data)
        setItems((prev) => prev.map((i) => (i.id === editing.id ? updated : i)))
        toast(`${updated.name_en} updated ✓`)
      } else {
        const created = await createItem(data)
        setItems((prev) => [...prev, created])
        toast(`${created.name_en} added to the menu ✓`)
      }
      setEditing(null)
      setAdding(false)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save item.', 'error')
    }
  }

  async function handleDelete(item: MenuItem) {
    try {
      await deleteItem(item.id)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      toast(`${item.name_en} removed from the menu`, 'info')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete item.', 'error')
    }
  }

  if (loading) {
    return <div className="card">Loading menu…</div>
  }

  return (
    <>
      <div className="page-heading menu-heading">
        <div>
          <h1>Menu Management</h1>
          <p>Add, edit, and toggle availability for your dishes.</p>
        </div>
        <Button onClick={() => setAdding(true)}>+ Add Item</Button>
      </div>

      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category === cat)
        return (
          <div className="dash-section" key={cat}>
            <h2>{cat}</h2>
            <table className="menu-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {catItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="item-cell">
                        {item.photo_url ? (
                          <img src={item.photo_url} alt={item.name_en} className="thumb thumb-img" />
                        ) : (
                          <FoodPlaceholder size="sm" />
                        )}
                        <div>
                          <strong>{item.name_en}</strong>
                          <div className="muted">{item.name_ar}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <PriceLabel value={item.price} />
                    </td>
                    <td>
                      <button
                        className={`availability-toggle ${item.available ? 'on' : 'off'}`}
                        onClick={() => toggleAvailability(item.id)}
                      >
                        {item.available ? 'Available' : 'Sold out'}
                      </button>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Button variant="secondary" onClick={() => setEditing(item)}>
                          Edit
                        </Button>
                        <Button variant="ghost" onClick={() => handleDelete(item)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {adding && (
        <Modal title="Add Item" onClose={() => setAdding(false)}>
          <ItemForm onSave={saveItem} onCancel={() => setAdding(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title={`Edit ${editing.name_en}`} onClose={() => setEditing(null)}>
          <ItemForm initial={editing} onSave={saveItem} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </>
  )
}
