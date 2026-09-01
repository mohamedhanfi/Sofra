"""Sofra backend — FastAPI application entrypoint.

Runs the single REST API shared by the customer site and the Owner Dashboard,
plus the /ws/admin/orders websocket for live order updates.
"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (register models so create_all sees every table)
from . import ws
from .database import Base, engine
from .routers import analytics, auth, cart, chat, customers, menu, orders, restaurant, ws as ws_router
from .seed import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    ws.set_running_loop(asyncio.get_running_loop())
    Base.metadata.create_all(bind=engine)
    seed_if_empty()
    yield


app = FastAPI(
    title="Sofra Backend",
    description="Egyptian restaurant ordering platform API (shared by customer site + owner dashboard).",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(menu.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(restaurant.router)
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(analytics.router)
app.include_router(customers.router)
app.include_router(ws_router.router)


@app.get("/healthz")
def healthz():
    return {"status": "ok"}
