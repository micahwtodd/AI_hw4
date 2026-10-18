from pathlib import Path
import hashlib
import hmac
import json
import secrets
import sqlite3
import time
from datetime import datetime, timedelta
from urllib.parse import unquote

from fastapi import Cookie, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from agent import redact, stream_reply
from models import ChatReply, ChatRequest, ChatTurn, ProductCard, ShopDeps

ALGORITHM = "pbkdf2_sha256"
ITERATIONS = 120_000
# Used only when an account is missing, so login still spends the same hash time.
DUMMY_SALT = "campus-customs-timing"
DUMMY_DIGEST = "0" * 64


def _digest(password: str, salt: str) -> str:
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        ITERATIONS,
    )
    return hashed.hex()


def make_password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    return f"{ALGORITHM}${salt}${_digest(password, salt)}"


def verify_password(stored: str | None, password: str) -> bool:
    salt = DUMMY_SALT
    digest = DUMMY_DIGEST
    if stored:
        parts = stored.split("$")
        if len(parts) == 3 and parts[0] == ALGORITHM and parts[1] and parts[2]:
            salt = parts[1]
            digest = parts[2]
    candidate = _digest(password, salt)
    if len(candidate) != len(digest):
        return False
    return hmac.compare_digest(candidate, digest)

HISTORY_LIMIT = 8


def _timestamp() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _colors(value: str | None) -> list[str]:
    try:
        parsed = json.loads(value or "[]")
    except json.JSONDecodeError:
        return []
    if not isinstance(parsed, list):
        return []
    return [str(item) for item in parsed]


def shopper_row(connection: sqlite3.Connection, user_id: int) -> sqlite3.Row | None:
    return connection.execute(
        "SELECT id, name, email, first_name, last_name FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()


def _product_fields(connection: sqlite3.Connection, product_id: str) -> sqlite3.Row | None:
    return connection.execute(
        """
        SELECT product_id, name, garment_type, description, colors, price, image_file_path
        FROM catalogue
        WHERE product_id = ?
        """,
        (product_id,),
    ).fetchone()


def build_deps(connection: sqlite3.Connection, shopper: sqlite3.Row | None, page: str) -> ShopDeps:
    """Pack the logged-in shopper and the open product page, when there is one."""
    path = unquote((page or "").strip())
    if len(path) > 300:
        path = path[:300]
    deps = ShopDeps(page_path=path)
    if shopper is not None:
        deps.user_id = int(shopper["id"])
        deps.name = shopper["name"]
        deps.first_name = shopper["first_name"]
        deps.last_name = shopper["last_name"]
        deps.email = shopper["email"]
    prefix = "/products/"
    if path.startswith(prefix):
        product_id = path[len(prefix) :].split("/", 1)[0]
        row = _product_fields(connection, product_id) if product_id else None
        if row is not None:
            deps.product_id = row["product_id"]
            deps.product_name = row["name"]
            deps.garment_type = row["garment_type"]
            deps.colors = _colors(row["colors"])
    return deps


def recent_turns(connection: sqlite3.Connection, user_id: int) -> list[ChatTurn]:
    """The last few saved lines, oldest first, for the next reply."""
    rows = connection.execute(
        """
        SELECT role, content
        FROM chat_messages
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
        """,
        (user_id, HISTORY_LIMIT),
    ).fetchall()
    turns: list[ChatTurn] = []
    for row in reversed(rows):
        role = row["role"]
        if role not in ("user", "assistant"):
            continue
        turns.append(ChatTurn(role=role, content=row["content"] or ""))
    return turns


def _stock_total(connection: sqlite3.Connection, product_id: str) -> int:
    row = connection.execute(
        "SELECT COALESCE(SUM(quantity), 0) AS total FROM inventory WHERE product_id = ?",
        (product_id,),
    ).fetchone()
    return int(row["total"]) if row else 0


def _cards(connection: sqlite3.Connection, products_json: str | None) -> list[ProductCard]:
    if not products_json:
        return []
    try:
        parsed = json.loads(products_json)
    except json.JSONDecodeError:
        return []
    if not isinstance(parsed, list):
        return []
    cards: list[ProductCard] = []
    for item in parsed:
        if not isinstance(item, dict):
            continue
        product_id = str(item.get("product_id") or "")
        row = _product_fields(connection, product_id) if product_id else None
        if row is None:
            continue
        filename = str(row["image_file_path"]).replace("\\", "/").split("/")[-1]
        cards.append(
            ProductCard(
                product_id=row["product_id"],
                name=row["name"],
                price=float(row["price"]),
                garment_type=row["garment_type"],
                image_url=f"/media/products/{filename}",
                total_stock=_stock_total(connection, row["product_id"]),
                colors=_colors(row["colors"]),
            )
        )
    return cards


def stored_messages(connection: sqlite3.Connection, user_id: int) -> list[dict]:
    """Every saved line for the chat widget, oldest first."""
    rows = connection.execute(
        """
        SELECT role, content, products_json
        FROM chat_messages
        WHERE user_id = ?
        ORDER BY id
        """,
        (user_id,),
    ).fetchall()
    messages: list[dict] = []
    for row in rows:
        role = row["role"]
        if role not in ("user", "assistant"):
            continue
        messages.append(
            {
                "role": role,
                "content": row["content"] or "",
                "products": _cards(connection, row["products_json"]),
            }
        )
    return messages


def save_exchange(
    connection: sqlite3.Connection,
    user_id: int,
    message: str,
    reply: str,
    products: list[ProductCard],
) -> None:
    """Store the shopper line and the assistant line from this turn."""
    stamp = _timestamp()
    connection.execute(
        """
        INSERT INTO chat_messages (user_id, role, content, products_json, created_at)
        VALUES (?, 'user', ?, '', ?)
        """,
        (user_id, message, stamp),
    )
    payload = json.dumps([card.model_dump() for card in products])
    connection.execute(
        """
        INSERT INTO chat_messages (user_id, role, content, products_json, created_at)
        VALUES (?, 'assistant', ?, ?, ?)
        """,
        (user_id, reply, payload, stamp),
    )
    connection.commit()


CHAT_LIMIT = 50


def ensure_usage_table(connection: sqlite3.Connection) -> None:
    """A separate tally from chat history, so clearing the chat does not reset the hourly cap."""
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS chat_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shopper_key TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    connection.commit()


def _hour_cutoff() -> str:
    return (datetime.now() - timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")


def messages_this_hour(connection: sqlite3.Connection, shopper_key: str) -> int:
    """How many questions this shopper already sent in the last hour."""
    ensure_usage_table(connection)
    cutoff = _hour_cutoff()
    connection.execute("DELETE FROM chat_usage WHERE created_at < ?", (cutoff,))
    row = connection.execute(
        """
        SELECT COUNT(*) AS total
        FROM chat_usage
        WHERE shopper_key = ? AND created_at >= ?
        """,
        (shopper_key, cutoff),
    ).fetchone()
    connection.commit()
    return int(row["total"]) if row else 0


def record_chat_use(connection: sqlite3.Connection, shopper_key: str) -> None:
    ensure_usage_table(connection)
    connection.execute(
        "INSERT INTO chat_usage (shopper_key, created_at) VALUES (?, ?)",
        (shopper_key, _timestamp()),
    )
    connection.commit()


def clear_history(connection: sqlite3.Connection, user_id: int) -> None:
    """Delete one shopper's saved chat. Leaves the hourly cap and every other shopper alone."""
    connection.execute("DELETE FROM chat_messages WHERE user_id = ?", (user_id,))
    connection.commit()

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "campus_customs.db"
PRODUCTS_DIR = ROOT / "data" / "products"
SIZE_ORDER = ("XS", "S", "M", "L", "XL", "XXL")

if not DB_PATH.is_file() or not PRODUCTS_DIR.is_dir():
    raise RuntimeError(
        "Place the data pack first: data/campus_customs.db and data/products/ next to backend/."
    )

app = FastAPI(title="Campus Customs")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

SESSION_COOKIE = "campus_session"
SESSION_SECONDS = 7 * 24 * 60 * 60
MIN_PASSWORD = 8
MAX_PASSWORD = 128
FAILURE_LIMIT = 8
FAILURE_WINDOW = 10 * 60
GUEST_COOKIE = "campus_guest"
CHAT_LIMIT_NOTICE = (
    "You've reached 50 messages this hour. Please wait before sending more, "
    "so the shopping assistant stays available."
)
_failures: dict[str, list[float]] = {}
_revoked_sessions: set[str] = set()
_chat_epoch: dict[str, int] = {}


def session_secret() -> bytes:
    path = Path(__file__).resolve().parent / ".session_secret"
    if path.exists():
        secret = path.read_bytes().strip()
        if secret:
            return secret
    secret = secrets.token_hex(32).encode()
    path.write_bytes(secret)
    return secret


SECRET = session_secret()


class LoginBody(BaseModel):
    email: str
    password: str


class SignupBody(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    confirm_password: str


def normalize_email(email: str) -> str:
    return email.strip().lower()


def email_ok(email: str) -> bool:
    local, separator, domain = email.partition("@")
    return bool(separator and local and "." in domain and " " not in email)


def public_user(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "first_name": row["first_name"],
        "last_name": row["last_name"],
        "email": row["email"],
    }


def too_many_attempts(email: str) -> bool:
    now = time.time()
    recent = [stamp for stamp in _failures.get(email, []) if now - stamp < FAILURE_WINDOW]
    _failures[email] = recent
    return len(recent) >= FAILURE_LIMIT


def record_failure(email: str) -> None:
    _failures.setdefault(email, []).append(time.time())


def clear_failures(email: str) -> None:
    _failures.pop(email, None)


def write_session(response: Response, user_id: int) -> None:
    expires = int(time.time()) + SESSION_SECONDS
    payload = f"{user_id}.{expires}"
    signature = hmac.new(SECRET, payload.encode(), hashlib.sha256).hexdigest()
    response.set_cookie(
        SESSION_COOKIE,
        f"{payload}.{signature}",
        httponly=True,
        samesite="lax",
        max_age=SESSION_SECONDS,
        path="/",
    )


def read_session(token: str | None) -> int | None:
    if not token or token in _revoked_sessions:
        return None
    user_id_text, separator, rest = token.partition(".")
    expires_text, separator2, signature = rest.partition(".")
    if not separator or not separator2 or not signature:
        return None
    payload = f"{user_id_text}.{expires_text}"
    expected = hmac.new(SECRET, payload.encode(), hashlib.sha256).hexdigest()
    if len(signature) != len(expected) or not hmac.compare_digest(signature, expected):
        return None
    try:
        user_id = int(user_id_text)
        expires = int(expires_text)
    except ValueError:
        return None
    if expires < time.time():
        return None
    return user_id


def password_problem(password: str, confirm_password: str) -> str | None:
    if password != confirm_password:
        return "Passwords do not match."
    if len(password) < MIN_PASSWORD:
        return f"Password must be at least {MIN_PASSWORD} characters."
    if len(password) > MAX_PASSWORD:
        return f"Password must be at most {MAX_PASSWORD} characters."
    return None


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def image_url(image_file_path: str) -> str:
    filename = Path(image_file_path).name
    return f"/media/products/{filename}"


def parse_list(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return []
    if not isinstance(parsed, list):
        return []
    return [str(item) for item in parsed]


def product_summary(row: sqlite3.Row) -> dict:
    return {
        "product_id": row["product_id"],
        "name": row["name"],
        "garment_type": row["garment_type"],
        "description": row["description"],
        "price": row["price"],
        "image_url": image_url(row["image_file_path"]),
    }


def inventory_for(connection: sqlite3.Connection, product_id: str) -> list[dict]:
    rows = connection.execute(
        """
        SELECT size, quantity
        FROM inventory
        WHERE product_id = ?
        """,
        (product_id,),
    ).fetchall()
    by_size = {row["size"]: row["quantity"] for row in rows}
    return [
        {"size": size, "quantity": by_size[size]}
        for size in SIZE_ORDER
        if size in by_size
    ]


@app.get("/api/products")
def list_products() -> list[dict]:
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT product_id, name, garment_type, description, colors, price, image_file_path
            FROM catalogue
            ORDER BY name
            """
        ).fetchall()
        stock = connection.execute(
            "SELECT product_id, size, quantity FROM inventory"
        ).fetchall()
    quantities: dict[str, dict[str, int]] = {}
    for row in stock:
        quantities.setdefault(row["product_id"], {})[row["size"]] = row["quantity"]
    products = []
    for row in rows:
        product = product_summary(row)
        product["colors"] = parse_list(row["colors"])
        by_size = quantities.get(row["product_id"], {})
        product["inventory"] = [
            {"size": size, "quantity": by_size[size]}
            for size in SIZE_ORDER
            if size in by_size
        ]
        products.append(product)
    return products


@app.get("/api/products/{product_id}")
def get_product(product_id: str) -> dict:
    with connect() as connection:
        row = connection.execute(
            """
            SELECT product_id, name, garment_type, description, colors, price, image_file_path
            FROM catalogue
            WHERE product_id = ?
            """,
            (product_id,),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Product not found")
        product = product_summary(row)
        product["colors"] = parse_list(row["colors"])
        product["inventory"] = inventory_for(connection, product_id)
    return product


@app.post("/api/login")
def login(body: LoginBody, response: Response) -> dict:
    email = normalize_email(body.email)
    if too_many_attempts(email):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again in a few minutes.")
    with connect() as connection:
        row = connection.execute(
            """
            SELECT id, name, email, first_name, last_name, password_hash
            FROM users
            WHERE email = ?
            """,
            (email,),
        ).fetchone()
    stored = row["password_hash"] if row else None
    if row is None or not verify_password(stored, body.password):
        record_failure(email)
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    clear_failures(email)
    write_session(response, row["id"])
    return public_user(row)


@app.post("/api/account")
def create_account(body: SignupBody, response: Response) -> dict:
    first_name = body.first_name.strip()
    last_name = body.last_name.strip()
    email = normalize_email(body.email)
    if not first_name or not last_name:
        raise HTTPException(status_code=400, detail="First and last name are required.")
    if not email_ok(email):
        raise HTTPException(status_code=400, detail="Enter a valid email.")
    problem = password_problem(body.password, body.confirm_password)
    if problem:
        raise HTTPException(status_code=400, detail=problem)
    password_hash = make_password_hash(body.password)
    try:
        with connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO users (name, email, password_hash, first_name, last_name)
                VALUES (?, ?, ?, ?, ?)
                """,
                (f"{first_name} {last_name}", email, password_hash, first_name, last_name),
            )
            user_id = cursor.lastrowid
            row = connection.execute(
                """
                SELECT id, name, email, first_name, last_name
                FROM users
                WHERE id = ?
                """,
                (user_id,),
            ).fetchone()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="An account with that email already exists.")
    write_session(response, row["id"])
    return public_user(row)


@app.get("/api/me")
def current_account(campus_session: str | None = Cookie(default=None)) -> dict:
    user_id = read_session(campus_session)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not logged in.")
    with connect() as connection:
        row = connection.execute(
            """
            SELECT id, name, email, first_name, last_name
            FROM users
            WHERE id = ?
            """,
            (user_id,),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=401, detail="Not logged in.")
    return public_user(row)


@app.post("/api/logout")
def logout(response: Response, campus_session: str | None = Cookie(default=None)) -> dict:
    if campus_session:
        _revoked_sessions.add(campus_session)
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


def guest_identity(token: str | None) -> tuple[str, str | None]:
    """A guest has no account, so the hourly cap follows a cookie kept in this browser."""
    if token and len(token) == 32 and all(character in "0123456789abcdef" for character in token):
        return f"guest:{token}", None
    fresh = secrets.token_hex(16)
    return f"guest:{fresh}", fresh


def apply_guest_cookie(response: Response, fresh: str | None) -> None:
    if not fresh:
        return
    response.set_cookie(
        GUEST_COOKIE,
        fresh,
        httponly=True,
        samesite="lax",
        max_age=30 * 24 * 60 * 60,
        path="/",
    )


def bump_chat_epoch(key: str) -> None:
    _chat_epoch[key] = _chat_epoch.get(key, 0) + 1


def chat_epoch(key: str) -> int:
    return _chat_epoch.get(key, 0)


def keep_known_cards(cards: list[ProductCard]) -> list[ProductCard]:
    if not cards:
        return []
    ids = [card.product_id for card in cards]
    placeholders = ",".join("?" for _ in ids)
    with connect() as connection:
        rows = connection.execute(
            f"SELECT product_id FROM catalogue WHERE product_id IN ({placeholders})",
            ids,
        ).fetchall()
    known = {row["product_id"] for row in rows}
    return [card for card in cards if card.product_id in known]


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


@app.get("/api/chat/history")
def chat_history(campus_session: str | None = Cookie(default=None)) -> list[dict]:
    user_id = read_session(campus_session)
    if user_id is None:
        return []
    with connect() as connection:
        if shopper_row(connection, user_id) is None:
            return []
        return stored_messages(connection, user_id)


@app.post("/api/chat/clear")
def clear_chat(
    response: Response,
    campus_session: str | None = Cookie(default=None),
    campus_guest: str | None = Cookie(default=None),
) -> dict:
    user_id = read_session(campus_session)
    fresh: str | None = None
    if user_id is not None:
        key = f"user:{user_id}"
        with connect() as connection:
            if shopper_row(connection, user_id) is not None:
                clear_history(connection, user_id)
    else:
        key, fresh = guest_identity(campus_guest)
    bump_chat_epoch(key)
    apply_guest_cookie(response, fresh)
    return {"ok": True}


@app.post("/api/chat")
async def chat(
    body: ChatRequest,
    request: Request,
    campus_session: str | None = Cookie(default=None),
    campus_guest: str | None = Cookie(default=None),
) -> StreamingResponse:
    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Type a message first.")
    if len(message) > 2000:
        raise HTTPException(status_code=400, detail="That message is too long.")
    user_id = read_session(campus_session)
    fresh: str | None = None
    with connect() as connection:
        shopper = shopper_row(connection, user_id) if user_id is not None else None
        if shopper is not None:
            key = f"user:{int(shopper['id'])}"
        else:
            key, fresh = guest_identity(campus_guest)
        if messages_this_hour(connection, key) >= CHAT_LIMIT:
            raise HTTPException(status_code=429, detail=CHAT_LIMIT_NOTICE)
        record_chat_use(connection, key)
        deps = build_deps(connection, shopper, body.page)
        history = recent_turns(connection, int(shopper["id"])) if shopper is not None else body.history[-8:]
        shopper_id = int(shopper["id"]) if shopper is not None else None
    started = chat_epoch(key)

    async def events():
        final: ChatReply | None = None
        try:
            async for piece in stream_reply(message, history, deps):
                if isinstance(piece, str):
                    yield _sse({"kind": "text", "reply": piece})
                    continue
                final = piece
        except Exception as exc:
            detail = redact(str(exc)) or "The shopping assistant could not answer."
            yield _sse({"kind": "error", "detail": detail})
            return
        if final is None:
            yield _sse({"kind": "error", "detail": "The shopping assistant could not answer."})
            return
        final.products = keep_known_cards(final.products)
        if shopper_id is not None and chat_epoch(key) == started and not await request.is_disconnected():
            with connect() as connection:
                save_exchange(connection, shopper_id, message, final.reply, final.products)
        if await request.is_disconnected():
            return
        yield _sse(
            {
                "kind": "done",
                "reply": final.reply,
                "products": [card.model_dump() for card in final.products],
            }
        )

    response = StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
    apply_guest_cookie(response, fresh)
    return response


app.mount("/media/products", StaticFiles(directory=PRODUCTS_DIR), name="product-images")
