"""Tools the shop agent can call.

Price and stock come from the local catalogue. This file does not read passwords.
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from pydantic_ai import RunContext

from models import (
    ShopDeps,
    CatalogueOverview,
    GarmentCount,
    ProductCard,
    ProductDescription,
    ProductPrice,
    ProductStock,
    SizeStock,
)

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "campus_customs.db"
MAX_RESULTS = 6
SIZE_ORDER = ("XS", "S", "M", "L", "XL", "XXL")
_STOP_WORDS = frozenset(
    {
        "a",
        "an",
        "the",
        "do",
        "you",
        "have",
        "any",
        "please",
        "yes",
        "me",
        "i",
        "we",
        "some",
        "of",
        "for",
        "and",
        "or",
        "to",
        "in",
        "on",
        "is",
        "are",
        "there",
        "what",
        "which",
        "how",
        "much",
        "many",
        "hi",
        "hello",
        "hey",
        "im",
        "looking",
        "show",
        "want",
        "need",
        "about",
        "can",
        "could",
        "would",
        "like",
        "got",
    }
)
_catalogue_tokens: set[str] | None = None
_overview_cache: CatalogueOverview | None = None


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def _fold(text: str) -> str:
    """Letters and digits only, so hyphen and spacing do not change a spelling."""
    return "".join(ch for ch in text.lower() if ch.isalnum())


def _tokens(text: str) -> set[str]:
    words: set[str] = set()
    for raw in text.lower().replace("/", " ").split():
        folded = _fold(raw)
        if folded:
            words.add(folded)
    return words


def _json_texts(value: str) -> list[str]:
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return []
    if not isinstance(parsed, list):
        return []
    return [str(item) for item in parsed]


def _catalogue_words(connection: sqlite3.Connection) -> set[str]:
    """Words already written in the catalogue. Loaded once per process."""
    global _catalogue_tokens
    if _catalogue_tokens is not None:
        return _catalogue_tokens
    rows = connection.execute(
        "SELECT name, garment_type, description, colors, search_tags FROM catalogue"
    ).fetchall()
    words: set[str] = set()
    for row in rows:
        for field in (row["name"], row["garment_type"], row["description"]):
            words.update(_tokens(field or ""))
        for text in _json_texts(row["colors"] or "[]"):
            words.update(_tokens(text))
        for text in _json_texts(row["search_tags"] or "[]"):
            words.update(_tokens(text))
    _catalogue_tokens = words
    return words


def _edits_apart(left: str, right: str) -> int:
    if abs(len(left) - len(right)) > 2:
        return 3
    previous = list(range(len(right) + 1))
    for i, left_ch in enumerate(left, start=1):
        current = [i]
        for j, right_ch in enumerate(right, start=1):
            cost = 0 if left_ch == right_ch else 1
            current.append(min(current[-1] + 1, previous[j] + 1, previous[j - 1] + cost))
        previous = current
    return previous[-1]


def _close(shopper: str, catalogue: str) -> bool:
    """A catalogue word one letter away from a shopper word of five letters or more.

    A letter added only at the front or back is a different word, such as tshirt and shirt.
    """
    if len(shopper) < 5 or len(catalogue) < 5:
        return False
    if _edits_apart(shopper, catalogue) != 1:
        return False
    shorter, longer = (shopper, catalogue) if len(shopper) <= len(catalogue) else (catalogue, shopper)
    if len(longer) == len(shorter) + 1 and (longer.endswith(shorter) or longer.startswith(shorter)):
        return False
    return True


def _spellings(word: str) -> set[str]:
    folded = _fold(word)
    if not folded:
        return set()
    spellings = {folded}
    if folded.endswith("s") and not folded.endswith("ss") and len(folded) > 3:
        spellings.add(folded[:-1])
    return spellings


def _terms(word: str, catalogue: set[str]) -> list[str]:
    spellings = _spellings(word)
    found = {token for token in catalogue if token in spellings or any(_close(spelling, token) for spelling in spellings)}
    if not found:
        found.update(spellings)
    return sorted(found)


def _words(query: str) -> list[str]:
    words: list[str] = []
    for raw in query.split():
        word = raw.strip("?.!,;:\"'()").lower()
        if not word or word in _STOP_WORDS:
            continue
        words.append(word)
        if len(words) == 6:
            break
    return words


def _flat(column: str) -> str:
    """Catalogue text with hyphens removed and punctuation turned into spaces."""
    expression = f"replace(lower({column}), '-', '')"
    for mark in ("/", '"', "[", "]", ",", "{", "}", ".", ":"):
        expression = f"replace({expression}, '{mark}', ' ')"
    expression = f"replace({expression}, '''', ' ')"
    return f"(' ' || {expression} || ' ')"


def _matching_rows(connection: sqlite3.Connection, query: str) -> list[sqlite3.Row]:
    words = _words(query)
    if not words:
        return []
    catalogue = _catalogue_words(connection)
    columns = ("name", "garment_type", "description", "colors", "search_tags")
    clauses: list[str] = []
    params: list[str] = []
    for word in words:
        term_sql: list[str] = []
        for term in _terms(word, catalogue):
            like = f"% {term} %"
            for column in columns:
                term_sql.append(f"{_flat(column)} LIKE ?")
                params.append(like)
        clauses.append("(" + " OR ".join(term_sql) + ")")
    sql = f"""
        SELECT product_id, name, garment_type, description, colors, price, image_file_path
        FROM catalogue
        WHERE {' AND '.join(clauses)}
        ORDER BY name
        LIMIT {MAX_RESULTS}
    """
    return list(connection.execute(sql, params).fetchall())


def _colors(value: str) -> list[str]:
    return _json_texts(value)


def _size_key(size: str) -> tuple[int, str]:
    try:
        return (SIZE_ORDER.index(size), size)
    except ValueError:
        return (len(SIZE_ORDER), size)


def open_product(ctx: RunContext[ShopDeps]) -> list[ProductDescription]:
    """The product page the shopper has open.

    Call this when they say this, it, or this one, and before you say whether that item comes in a color.
    An empty list means no product page is open.
    """
    product_id = (ctx.deps.product_id or "").strip()
    if not product_id:
        return []
    with _connect() as connection:
        row = connection.execute(
            "SELECT product_id, name, description, colors FROM catalogue WHERE product_id = ?",
            (product_id,),
        ).fetchone()
    if row is None:
        return []
    return [
        ProductDescription(
            product_id=row["product_id"],
            name=row["name"],
            description=row["description"],
            colors=_colors(row["colors"]),
        )
    ]


def product_description(query: str) -> list[ProductDescription]:
    """Look up catalogue descriptions.

    Call this for a question about what a product is, what it looks like, or its description.
    Use only the description text returned here.
    """
    with _connect() as connection:
        rows = _matching_rows(connection, query)
    return [
        ProductDescription(
            product_id=row["product_id"],
            name=row["name"],
            description=row["description"],
            colors=_colors(row["colors"]),
        )
        for row in rows
    ]


def product_price(query: str) -> list[ProductPrice]:
    """Look up catalogue prices.

    Call this before you state a price. Use only the price returned here.
    """
    with _connect() as connection:
        rows = _matching_rows(connection, query)
    return [ProductPrice(product_id=row["product_id"], name=row["name"], price=row["price"]) for row in rows]


def stock_by_size(query: str) -> list[ProductStock]:
    """Look up how many units are on hand for each size.

    Call this before you say whether a size is in stock or how many are left.
    A quantity of 0 means that size is out of stock. Do not treat zero as a backorder.
    """
    with _connect() as connection:
        rows = _matching_rows(connection, query)
        if not rows:
            return []
        ids = [row["product_id"] for row in rows]
        placeholders = ",".join("?" for _ in ids)
        stock_rows = connection.execute(
            f"SELECT product_id, size, quantity FROM inventory WHERE product_id IN ({placeholders})",
            ids,
        ).fetchall()
    by_product: dict[str, list[SizeStock]] = {row["product_id"]: [] for row in rows}
    for stock in stock_rows:
        by_product[stock["product_id"]].append(SizeStock(size=stock["size"], quantity=int(stock["quantity"])))
    for sizes in by_product.values():
        sizes.sort(key=lambda item: _size_key(item.size))
    return [
        ProductStock(product_id=row["product_id"], name=row["name"], sizes=by_product[row["product_id"]])
        for row in rows
    ]


def catalogue_overview() -> CatalogueOverview:
    """Garment types in the shop and how many products use each.

    Call this for a broad question: what the shop carries, what types of items, Yale gear, Yale garb, or Yale apparel.
    Do not call this for a named garment such as a hoodie or sweatpants. Those use search_products.
    Report only these types and counts. Do not add a type that is not in the list, and do not put this list in the products cards.
    """
    global _overview_cache
    if _overview_cache is not None:
        return _overview_cache
    with _connect() as connection:
        rows = connection.execute(
            """
            SELECT garment_type, COUNT(*) AS product_count
            FROM catalogue
            GROUP BY garment_type
            ORDER BY product_count DESC, garment_type
            """
        ).fetchall()
    garment_types = [
        GarmentCount(garment_type=row["garment_type"], product_count=int(row["product_count"]))
        for row in rows
    ]
    _overview_cache = CatalogueOverview(
        product_total=sum(item.product_count for item in garment_types),
        garment_types=garment_types,
    )
    return _overview_cache


def search_products(query: str) -> list[ProductCard]:
    """Find products to show as cards.

    Call this when a shopper asks if you carry a named garment, such as a hoodie or sweatpants. Do not call this for Yale gear, Yale garb, Yale apparel, or a question about what types the shop carries. Those questions use catalogue_overview. Pass the color and garment they mean. A plural and a one-letter misspelling of a catalogue word still match. If this returns nothing, call it once more with a shorter or corrected query. If it is still empty, the item is missing. Say so. Do not ask for a color instead. Short spellings such as grey and gray are not guessed here.
    If this returns cards, those products exist. A returned color of gray is the grey the shopper may have asked for. Put the cards in the products list.
    The stock number is the total across every size. For a description, a price, or a count by size, call the lookup tool for that fact instead of this one.
    For alternatives, call this again with a related color or garment, and recommend only cards it returns.
    """
    with _connect() as connection:
        rows = _matching_rows(connection, query)
        if not rows:
            return []
        ids = [row["product_id"] for row in rows]
        placeholders = ",".join("?" for _ in ids)
        stock_rows = connection.execute(
            f"SELECT product_id, quantity FROM inventory WHERE product_id IN ({placeholders})",
            ids,
        ).fetchall()
    totals: dict[str, int] = {}
    for row in stock_rows:
        totals[row["product_id"]] = totals.get(row["product_id"], 0) + int(row["quantity"])
    cards: list[ProductCard] = []
    for row in rows:
        filename = Path(row["image_file_path"]).name
        cards.append(
            ProductCard(
                product_id=row["product_id"],
                name=row["name"],
                price=row["price"],
                garment_type=row["garment_type"],
                image_url=f"/media/products/{filename}",
                total_stock=totals.get(row["product_id"], 0),
                colors=_colors(row["colors"]),
            )
        )
    return cards
