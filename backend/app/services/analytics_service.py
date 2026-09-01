from datetime import datetime, timedelta

from sqlalchemy import text
from sqlalchemy.orm import Session

PERIODS = {
    "today": 1,
    "7d": 7,
    "30d": 30,
}


def _start(period: str) -> datetime:
    days = PERIODS.get(period, 7)
    return datetime.utcnow() - timedelta(days=days)


def get_summary(db: Session, period: str) -> dict:
    start = _start(period)

    # Order count, revenue (excluding cancelled), average order value
    counts = db.execute(
        text(
            """
            SELECT COUNT(*),
                   COALESCE(SUM(total), 0),
                   COALESCE(AVG(total), 0)
            FROM orders
            WHERE status != 'cancelled' AND created_at >= :start
            """
        ),
        {"start": start},
    ).one()
    order_count, revenue, avg_order_value = counts

    # Top-selling items
    top_items = db.execute(
        text(
            """
            SELECT oi.item_name_en, SUM(oi.quantity) AS qty, SUM(oi.quantity * oi.unit_price) AS revenue
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE o.status != 'cancelled' AND o.created_at >= :start
            GROUP BY oi.item_id, oi.item_name_en
            ORDER BY qty DESC
            LIMIT 5
            """
        ),
        {"start": start},
    ).all()

    # Peak hours
    peak_hours = db.execute(
        text(
            """
            SELECT strftime('%H', created_at) AS hour, COUNT(*) AS order_count
            FROM orders
            WHERE created_at >= :start
            GROUP BY hour
            ORDER BY order_count DESC
            LIMIT 6
            """
        ),
        {"start": start},
    ).all()

    # Average rating
    avg_rating = db.execute(
        text(
            """
            SELECT COALESCE(AVG(stars), 0)
            FROM ratings r
            JOIN orders o ON o.id = r.order_id
            WHERE o.created_at >= :start
            """
        ),
        {"start": start},
    ).scalar()

    return {
        "order_count": order_count,
        "revenue": round(revenue, 2),
        "avg_order_value": round(avg_order_value, 2),
        "avg_rating": round(avg_rating or 0, 2),
        "top_items": [
            {"name": row[0], "quantity": row[1], "revenue": round(row[2], 2)} for row in top_items
        ],
        "peak_hours": [
            {"hour": row[0], "order_count": row[1]} for row in peak_hours
        ],
    }
