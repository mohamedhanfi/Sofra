import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  LayoutGrid,
  Soup,
  Sandwich,
  Flame,
  Cake,
  CupSoda,
  Utensils,
} from 'lucide-react'
import { useLang } from '../context/LangContext'
import { getMenu, getCombos } from '../api/client'
import type { MenuItem, Combo } from '../types'
import MenuCard from '../components/MenuCard'
import ComboCard from '../components/ComboCard'

const CATEGORY_ICONS: Record<string, typeof Soup> = {
  Mains: Utensils,
  Grills: Flame,
  'Koshary & Rice': Soup,
  Sandwiches: Sandwich,
  Drinks: CupSoda,
  Desserts: Cake,
}

export default function Menu() {
  const { lang, t } = useLang()
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [combos, setCombos] = useState<Combo[]>([])

  useEffect(() => {
    getMenu(true).then(setMenuItems).catch(() => {})
    getCombos().then(setCombos).catch(() => {})
  }, [])

  const categories = useMemo(
    () => [...new Set(menuItems.map((i) => i.category))],
    [menuItems],
  )

  const filtered = menuItems.filter((i) => {
    if (!i.available) return false
    if (activeCat && i.category !== activeCat) return false
    if (search) {
      const q = search.toLowerCase()
      const name = (lang === 'ar' ? i.name_ar : i.name_en).toLowerCase()
      if (!name.includes(q)) return false
    }
    return true
  })

  return (
    <>
      <div className="menu-hero">
        <h1>{t('Our Menu', 'المنيو')}</h1>
        <div className="menu-search-wrap">
          <Search size={16} className="menu-search-icon" />
          <input
            className="menu-search"
            placeholder={t('Search dishes...', 'ابحث عن أكل...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {combos.length > 0 && (
        <section className="menu-combos">
          <h2>{t('Combos & Offers', 'الكومبوهات والعروض')}</h2>
          <div className="combos-row">
            {combos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
        </section>
      )}

      <div className="cat-tabs">
        <button
          className={`cat-tab${activeCat === null ? ' active' : ''}`}
          onClick={() => setActiveCat(null)}
        >
          <LayoutGrid size={14} />
          {t('All', 'الكل')}
        </button>
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat] || Utensils
          return (
            <button
              key={cat}
              className={`cat-tab${activeCat === cat ? ' active' : ''}`}
              onClick={() => setActiveCat(cat)}
            >
              <Icon size={14} />
              {cat}
            </button>
          )
        })}
      </div>

      <section className="menu-grid">
        {filtered.map((item) => (
          <MenuCard key={item.id} item={item} />
        ))}
        {filtered.length === 0 && (
          <div className="menu-empty">{t('No items found.', 'مفيش حاجة هنا.')}</div>
        )}
      </section>
    </>
  )
}
