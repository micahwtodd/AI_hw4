"""Structured types for the Campus Customs shop agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from pydantic import BaseModel, Field


class ProductCard(BaseModel):
    """One catalogue item the chat can show."""

    product_id: str
    name: str
    price: float
    garment_type: str
    image_url: str
    total_stock: int = Field(description="Units on hand across every size.")
    colors: list[str] = Field(
        default_factory=list,
        description="Catalogue colors. Gray and grey are the same color.",
    )


class ProductDescription(BaseModel):
    """The catalogue description for one product."""

    product_id: str
    name: str
    description: str
    colors: list[str] = Field(
        default_factory=list,
        description="Catalogue colors. Gray and grey are the same color.",
    )


class ProductPrice(BaseModel):
    """The catalogue price for one product."""

    product_id: str
    name: str
    price: float = Field(description="Price in dollars from the catalogue. Do not change it.")


class SizeStock(BaseModel):
    """Units on hand for one size."""

    size: str
    quantity: int = Field(description="Units on hand for this size. Zero means out of stock.")


class ProductStock(BaseModel):
    """Stock by size for one product."""

    product_id: str
    name: str
    sizes: list[SizeStock]


class ChatTurn(BaseModel):
    """One earlier line from the shopper or the assistant."""

    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    """What the website sends for one new shopper message."""

    message: str
    history: list[ChatTurn] = Field(default_factory=list)
    page: str = ""


class ChatReply(BaseModel):
    """What the agent returns to the website."""

    reply: str = Field(description="The words the shopper should read.")
    products: list[ProductCard] = Field(
        default_factory=list,
        description="Catalogue items mentioned in the reply. Use only items a tool returned.",
    )


class GarmentCount(BaseModel):
    """How many catalogue products share one garment type."""

    garment_type: str
    product_count: int = Field(description="Products with this garment type. Do not change the count.")


class CatalogueOverview(BaseModel):
    """The garment types in the shop. This is not a list of individual products."""

    product_total: int = Field(description="Products in the catalogue.")
    garment_types: list[GarmentCount]



@dataclass
class ShopDeps:
    """Who is chatting, and which page they have open."""

    user_id: int | None = None
    name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    page_path: str = ""
    product_id: str | None = None
    product_name: str | None = None
    garment_type: str | None = None
    colors: list[str] = field(default_factory=list)


def visit_note(deps: ShopDeps) -> str:
    """The visit facts appended to the system prompt."""
    lines = ["This visit:"]
    if deps.user_id is None:
        lines.append("The shopper is a guest. No name or email is known. Do not invent one.")
    else:
        lines.append(
            "The shopper is logged in. "
            f"Name: {deps.name or 'unknown'}. "
            f"First name: {deps.first_name or 'unknown'}. "
            f"Last name: {deps.last_name or 'unknown'}. "
            f"Email: {deps.email or 'unknown'}."
        )
    lines.append(f"Page: {deps.page_path or 'unknown'}.")
    if deps.product_id and deps.product_name:
        colors = ", ".join(deps.colors) if deps.colors else "none recorded"
        lines.append(
            "Open product id: "
            f"{deps.product_id}. Name: {deps.product_name}. "
            f"Garment: {deps.garment_type or 'unknown'}. Catalogue colors: {colors}."
        )
    else:
        lines.append("No product page is open.")
    return "\n".join(lines)
