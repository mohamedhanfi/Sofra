import { useState } from 'react'
import type { Combo, MenuItem, ComboItemLine } from '../types'
import Button from './Button'
import FoodPlaceholder from './FoodPlaceholder'

export default function ComboForm({
  initial,
  menuItems,
  onSave,
  onCancel,
}: {
  initial?: Combo
  menuItems: MenuItem[]
  onSave: (data: Omit<Combo, 'id'>) => void
  onCancel: () => void
}) {
  const [nameEn, setNameEn] = useState(initial?.name_en ?? '')
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? '')
  const [price, setPrice] = useState(initial?.combo_price ?? 0)
  const [photo, setPhoto] = useState(initial?.photo_url ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [lines, setLines] = useState<ComboItemLine[]>(
    initial?.items
      ? initial.items.map((it) => ({
          item_id: menuItems.find((m) => m.name_en === it.item_name_en)?.id ?? 0,
          quantity: it.quantity,
        }))
      : []
  )
  const [error, setError] = useState('')

  function componentSum() {
    return lines.reduce((sum, line) => {
      const item = menuItems.find((m) => m.id === line.item_id)
      return item ? sum + item.price * line.quantity : sum
    }, 0)
  }
  const compSum = componentSum()
  const savings = compSum - price
  const warns = price > compSum && lines.length > 0

  function addLine() {
    const first = menuItems.find((m) => !lines.some((l) => l.item_id === m.id))
    if (first) setLines((l) => [...l, { item_id: first.id, quantity: 1 }])
  }

  function updateLine(index: number, patch: Partial<ComboItemLine>) {
    setLines((l) => l.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  function removeLine(index: number) {
    setLines((l) => l.filter((_, i) => i !== index))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameEn.trim() || !nameAr.trim()) {
      setError('Name is required in both English and Arabic.')
      return
    }
    if (price < 0) {
      setError('Combo price cannot be negative.')
      return
    }
    if (lines.length === 0) {
      setError('Add at least one item to the combo.')
      return
    }
    if (!photo.trim()) {
      setError('Add a combo photo — combos without a photo show a plain placeholder.')
      return
    }
    onSave({
      name_en: nameEn,
      name_ar: nameAr,
      combo_price: price,
      photo_url: photo || undefined,
      active,
      items: lines
        .map((l) => {
          const item = menuItems.find((m) => m.id === l.item_id)
          return item
            ? { item_name_en: item.name_en, item_name_ar: item.name_ar, quantity: l.quantity }
            : null
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
      component_sum: compSum,
    })
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <span>Combo Name (English)</span>
        <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
      </div>
      <div className="field">
        <span>Combo Name (Arabic)</span>
        <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
      </div>
      <div className="form-row">
        <div className="field">
          <span>Combo Price (EGP)</span>
          <input type="number" min="0" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </div>
        <div className="field">
          <span>Photo URL</span>
          <input value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="Required" />
          {photo ? (
            <img
              src={photo}
              alt={nameEn}
              style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 8, marginTop: 8 }}
            />
          ) : (
            <FoodPlaceholder size="md" aspect="4/3" className="photo-preview" />
          )}
        </div>
      </div>

      <div className="field">
        <span>Items in Combo</span>
        {lines.length === 0 && (
          <div className="muted combo-empty">No items yet — add some below.</div>
        )}
        {lines.map((line, index) => {
          const item = menuItems.find((m) => m.id === line.item_id)
          return (
            <div className="combo-line" key={index}>
              <select
                value={line.item_id}
                onChange={(e) => updateLine(index, { item_id: Number(e.target.value) })}
              >
                {menuItems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name_en}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={line.quantity}
                onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
                className="qty-input"
              />
              <span className="muted">
                {item ? `${item.price * line.quantity} EGP` : ''}
              </span>
              <Button type="button" variant="ghost" onClick={() => removeLine(index)}>
                Remove
              </Button>
            </div>
          )
        })}
        <div className="add-line">
          <Button type="button" variant="secondary" onClick={addLine}>
            + Add Item Line
          </Button>
        </div>
      </div>

      {lines.length > 0 && (
        <div className={`combo-summary ${warns ? 'combo-warn' : ''}`}>
          <div>Sum of items: <strong>{compSum} EGP</strong></div>
          <div>
            {savings > 0
              ? `Customer saves ${savings} EGP`
              : warns
                ? `Warning: combo price (${price}) is higher than the sum of items (${compSum}).`
                : 'Combo is priced at or below the sum of items.'}
          </div>
        </div>
      )}

      <label className="toggle-row">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        <span>Active</span>
      </label>

      {error && <div className="form-error">{error}</div>}

      <div className="modal-footer" style={{ padding: '16px 0 0', border: 'none' }}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? 'Save Changes' : 'Add Combo'}</Button>
      </div>
    </form>
  )
}
