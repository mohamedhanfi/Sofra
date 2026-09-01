import { useState } from 'react'
import type { MenuItem } from '../types'
import Button from './Button'
import FoodPlaceholder from './FoodPlaceholder'

const CATEGORIES = [
  'Mains',
  'Grills',
  'Koshary & Rice',
  'Sandwiches',
  'Drinks',
  'Desserts',
]

export default function ItemForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: MenuItem
  onSave: (item: Omit<MenuItem, 'id'>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<Omit<MenuItem, 'id'>>({
    name_en: initial?.name_en ?? '',
    name_ar: initial?.name_ar ?? '',
    description_en: initial?.description_en ?? '',
    description_ar: initial?.description_ar ?? '',
    price: initial?.price ?? 0,
    category: initial?.category ?? CATEGORIES[0],
    photo_url: initial?.photo_url ?? '',
    available: initial?.available ?? true,
  })
  const [error, setError] = useState('')

  function set<K extends keyof Omit<MenuItem, 'id'>>(key: K, value: Omit<MenuItem, 'id'>[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name_en.trim() || !form.name_ar.trim()) {
      setError('Name is required in both English and Arabic.')
      return
    }
    if (form.price < 0) {
      setError('Price cannot be negative.')
      return
    }
    if (!form.photo_url?.trim()) {
      setError('Add a dish photo — menu items without a photo show a plain placeholder.')
      return
    }
    onSave(form)
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <span>Name (English)</span>
        <input value={form.name_en} onChange={(e) => set('name_en', e.target.value)} />
      </div>
      <div className="field">
        <span>Name (Arabic)</span>
        <input value={form.name_ar} onChange={(e) => set('name_ar', e.target.value)} />
      </div>
      <div className="field">
        <span>Description (English)</span>
        <textarea
          value={form.description_en}
          onChange={(e) => set('description_en', e.target.value)}
          rows={2}
        />
      </div>
      <div className="field">
        <span>Description (Arabic)</span>
        <textarea
          value={form.description_ar}
          onChange={(e) => set('description_ar', e.target.value)}
          rows={2}
        />
      </div>
      <div className="form-row">
        <div className="field">
          <span>Price (EGP)</span>
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => set('price', Number(e.target.value))}
          />
        </div>
        <div className="field">
          <span>Category</span>
          <select value={form.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <span>Photo URL</span>
        <input value={form.photo_url} onChange={(e) => set('photo_url', e.target.value)} placeholder="Required" />
        {form.photo_url ? (
          <img
            src={form.photo_url}
            alt={form.name_en}
            style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 8, marginTop: 8 }}
          />
        ) : (
          <FoodPlaceholder size="md" aspect="4/3" className="photo-preview" />
        )}
      </div>
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={form.available}
          onChange={(e) => set('available', e.target.checked)}
        />
        <span>Available</span>
      </label>

      {error && <div className="form-error">{error}</div>}

      <div className="modal-footer" style={{ padding: '16px 0 0', border: 'none' }}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? 'Save Changes' : 'Add Item'}</Button>
      </div>
    </form>
  )
}
