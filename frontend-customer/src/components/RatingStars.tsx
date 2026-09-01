import { useState } from 'react'
import { useLang } from '../context/LangContext'
import { rateOrder } from '../api/client'
import Button from './Button'

interface RatingStarsProps {
  orderId: number
  onSubmitted?: (stars: number, comment?: string) => void
}

export default function RatingStars({ orderId, onSubmitted }: RatingStarsProps) {
  const { t } = useLang()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [comment, setComment] = useState('')

  async function submit() {
    if (rating === 0) return
    try {
      await rateOrder(orderId, rating, comment || undefined)
    } catch {
      // ignore – optimistic
    }
    setSubmitted(true)
    onSubmitted?.(rating, comment || undefined)
  }

  if (submitted) {
    return (
      <div className="rating-done">
        <span className="rating-stars-display">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
        <p>{t('Thanks for your feedback!', 'شكراً على رأيك!')}</p>
      </div>
    )
  }

  return (
    <div className="rating-prompt">
      <h3>{t('How was your order?', 'ازاي كان أوردرك؟')}</h3>
      <p className="rating-sub">{t('Optional — this helps us improve.', 'اختياري — ده بيساعدنا نتحسن.')}</p>
      <div className="rating-stars-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className={`rating-star${n <= (hovered || rating) ? ' filled' : ''}`}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="rating-comment"
        placeholder={t('Any comments? (optional)', 'تعليق؟ (اختياري)')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
      />
      <Button onClick={submit} disabled={rating === 0}>
        {t('Submit Rating', 'أرسل التقييم')}
      </Button>
    </div>
  )
}
