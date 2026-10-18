"""Campus Customs shop agent.

Loads the system prompt from prompts/prompt.md and calls gpt-6-luna through Portkey.
The API key stays in the local .env file.
"""

from __future__ import annotations

import json
import os
from collections.abc import AsyncIterator
from datetime import datetime
from pathlib import Path

os.environ.setdefault("PYDANTIC_AI_NO_BANNER", "1")

from dotenv import dotenv_values
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIResponsesModel, OpenAIResponsesModelSettings
from pydantic_ai.profiles.openai import OpenAIModelProfile
from pydantic_ai.providers.openai import OpenAIProvider

from models import ChatReply, ChatTurn, ProductCard, ShopDeps, visit_note
from tools import (
    catalogue_overview,
    open_product,
    product_description,
    product_price,
    search_products,
    stock_by_size,
)

BACKEND = Path(__file__).resolve().parent
ROOT = BACKEND.parent
PROMPT_PATH = BACKEND / "prompts" / "prompt.md"
PORTKEY_BASE_URL = "https://api.portkey.ai/v1"
MODEL_NAME = "gpt-6-luna"

_agent: Agent[ShopDeps, ChatReply] | None = None


def _env_file_value(name: str) -> str:
    """Read one value from the homework .env files. Ignores the process environment."""
    found = ""
    for path in (ROOT / ".env", BACKEND / ".env"):
        if not path.is_file():
            continue
        value = (dotenv_values(path).get(name) or "").strip()
        if value:
            found = value
    return found


def get_portkey_api_key() -> str:
    key = _env_file_value("PORTKEY_API_KEY")
    if not key or key == "your_key_here":
        raise RuntimeError(
            "PORTKEY_API_KEY is not set. Add it to the local .env file in this homework folder. "
            "Do not paste the key into chat or source."
        )
    return key


def redact(text: str) -> str:
    for key in (_env_file_value("PORTKEY_API_KEY"), os.environ.get("PORTKEY_API_KEY", "")):
        key = key.strip()
        if key and key != "your_key_here":
            text = text.replace(key, "[REDACTED]")
    return text


def load_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8").strip()


def make_model() -> OpenAIResponsesModel:
    # gpt-6-luna rejects function tools on chat completions. The responses endpoint accepts them.
    # Reasoning is off: this assistant looks up the catalogue, and reasoning made each reply take about a minute.
    return OpenAIResponsesModel(
        MODEL_NAME,
        provider=OpenAIProvider(
            base_url=PORTKEY_BASE_URL,
            api_key=get_portkey_api_key(),
        ),
        profile=OpenAIModelProfile(
            openai_supports_strict_tool_definition=False,
        ),
        settings=OpenAIResponsesModelSettings(openai_reasoning_effort="none"),
    )


def get_agent() -> Agent[ShopDeps, ChatReply]:
    global _agent
    if _agent is None:
        agent: Agent[ShopDeps, ChatReply] = Agent(
            make_model(),
            deps_type=ShopDeps,
            output_type=ChatReply,
            tools=[
                open_product,
                product_description,
                product_price,
                stock_by_size,
                search_products,
                catalogue_overview,
            ],
        )

        @agent.system_prompt(dynamic=True)
        def shop_prompt(ctx: RunContext[ShopDeps]) -> str:
            return f"{load_prompt()}\n\n{visit_note(ctx.deps)}"

        _agent = agent
    return _agent


def _cards_from_search(result: object) -> list[ProductCard]:
    """Product cards search_products already returned during this turn."""
    cards: list[ProductCard] = []
    seen: set[str] = set()
    new_messages = getattr(result, "new_messages", None)
    if not callable(new_messages):
        return cards
    for message in new_messages():
        for part in getattr(message, "parts", ()):
            if getattr(part, "part_kind", None) != "tool-return":
                continue
            if getattr(part, "tool_name", None) != "search_products":
                continue
            content = getattr(part, "content", None)
            if not isinstance(content, list):
                continue
            for item in content:
                try:
                    card = item if isinstance(item, ProductCard) else ProductCard.model_validate(item)
                except Exception:
                    continue
                if card.product_id in seen:
                    continue
                seen.add(card.product_id)
                cards.append(card)
    return cards


def _tool_returned(result: object, name: str) -> bool:
    new_messages = getattr(result, "new_messages", None)
    if not callable(new_messages):
        return False
    for message in new_messages():
        for part in getattr(message, "parts", ()):
            if getattr(part, "part_kind", None) != "tool-return":
                continue
            if getattr(part, "tool_name", None) == name:
                return True
    return False


def _shopper_text(message: str, history: list[ChatTurn]) -> str:
    lines: list[str] = []
    for turn in history[-8:]:
        speaker = "Shopper" if turn.role == "user" else "Assistant"
        lines.append(f"{speaker}: {turn.content.strip()}")
    lines.append(f"Shopper: {message.strip()}")
    return "\n".join(lines)


def _as_reply(value: object) -> ChatReply:
    if isinstance(value, ChatReply):
        return value
    return ChatReply.model_validate(value)


def _with_search_cards(reply: ChatReply, result: object) -> ChatReply:
    # The sentence and the cards are separate. If the model names a search but leaves
    # the card list empty, keep the cards the tool already returned so the shop can link them.
    if not reply.products:
        reply.products = _cards_from_search(result)
    if not reply.products and _claims_a_find(reply.reply) and not _tool_returned(result, "catalogue_overview"):
        reply.reply = (
            "I checked the catalogue, and that item is missing. "
            "Campus Customs does not carry it, so I don't have a link to show."
        )
    return reply


def _claims_a_find(text: str) -> bool:
    """A reply that says items were found, while no card came back."""
    lowered = text.lower()
    if "$" in text:
        return False
    if any(
        phrase in lowered
        for phrase in (
            "does not carry",
            "doesn't carry",
            "do not carry",
            "not carry",
            "could not find",
            "couldn't find",
            "cannot find",
            "can't find",
            "is missing",
            "are missing",
            "no matching",
            "don't have",
            "do not have",
            "garment type",
            "types of",
        )
    ):
        return False
    return any(phrase in lowered for phrase in ("i found", "i've found", "here are", "tracked down"))


async def reply_to_shopper(message: str, history: list[ChatTurn], deps: ShopDeps) -> ChatReply:
    try:
        result = await get_agent().run(_shopper_text(message, history), deps=deps)
    except Exception as exc:
        record_agent_run(None, f"error: {shorten_error(exc)}")
        raise
    record_agent_run(result, "")
    return _with_search_cards(_as_reply(result.output), result)


def shorten_error(exc: BaseException) -> str:
    return redact(str(exc))[:180]


async def stream_reply(
    message: str, history: list[ChatTurn], deps: ShopDeps
) -> AsyncIterator[str | ChatReply]:
    """Yield the reply text as it arrives, then the finished reply.

    The assistant still chooses its tools first. Words start appearing on the last step,
    when the model writes the answer.
    """
    try:
        async with get_agent().run_stream(_shopper_text(message, history), deps=deps) as result:
            seen = ""
            async for partial in result.stream_output(debounce_by=0.05):
                text = _as_reply(partial).reply or ""
                if text and text != seen:
                    seen = text
                    yield text
            final = _with_search_cards(_as_reply(await result.get_output()), result)
            record_agent_run(result, "")
            yield final
    except Exception as exc:
        record_agent_run(None, f"error: {shorten_error(exc)}")
        raise

TRAIL_PATH = ROOT / "output" / "audit_trail.json"
SHORT = 180
RESULT_LIMIT = 250


def _secrets() -> list[str]:
    found: list[str] = []
    for name in ("PORTKEY_API_KEY", "OPENAI_API_KEY"):
        for source in (
            os.environ.get(name, ""),
            *[(dotenv_values(path).get(name) or "") for path in (ROOT / ".env", BACKEND / ".env") if path.is_file()],
        ):
            value = source.strip()
            if value and value != "your_key_here":
                found.append(value)
    return found


def shorten(value: object, limit: int = SHORT) -> str:
    if value is None:
        return ""
    if hasattr(value, "model_dump"):
        value = value.model_dump()
    text = value if isinstance(value, str) else json.dumps(value, default=str)
    for secret in _secrets():
        text = text.replace(secret, "[REDACTED]")
    if len(text) > limit:
        return text[:limit] + "…"
    return text


def _load() -> list[dict[str, str]]:
    if not TRAIL_PATH.is_file() or TRAIL_PATH.stat().st_size == 0:
        return []
    loaded = json.loads(TRAIL_PATH.read_text(encoding="utf-8"))
    if not isinstance(loaded, list):
        raise ValueError("audit trail is not a list")
    return loaded


def append_events(events: list[dict[str, str]]) -> None:
    """Add events. If the current file cannot be read, leave it untouched."""
    if not events:
        return
    try:
        existing = _load()
    except (OSError, json.JSONDecodeError, ValueError):
        return
    existing.extend(events)
    TRAIL_PATH.parent.mkdir(parents=True, exist_ok=True)
    temporary = TRAIL_PATH.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(existing, indent=2), encoding="utf-8")
    temporary.replace(TRAIL_PATH)


def _now() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def record_agent_run(result: object | None, stop_reason: str) -> None:
    """Write this run's tool calls, then one line for why the loop stopped."""
    events: list[dict[str, str]] = []
    pending: dict[str, dict[str, str]] = {}
    finish = ""
    new_messages = getattr(result, "new_messages", None) if result is not None else None
    if callable(new_messages):
        for message in new_messages():
            message_finish = getattr(message, "finish_reason", None)
            if message_finish:
                finish = str(message_finish)
            for part in getattr(message, "parts", ()):
                kind = getattr(part, "part_kind", None)
                name = str(getattr(part, "tool_name", "") or "")
                if kind == "tool-call":
                    event = {
                        "time": _now(),
                        "tool_name": name,
                        "args": shorten(getattr(part, "args", "")),
                        "result": "",
                        "stop_reason": "",
                    }
                    events.append(event)
                    pending[name] = event
                elif kind == "tool-return":
                    summary = shorten(getattr(part, "content", ""), RESULT_LIMIT)
                    if name in pending and pending[name]["result"] == "":
                        pending[name]["result"] = summary
                    else:
                        events.append(
                            {
                                "time": _now(),
                                "tool_name": name,
                                "args": "",
                                "result": summary,
                                "stop_reason": "",
                            }
                        )
    events.append(
        {
            "time": _now(),
            "tool_name": "",
            "args": "",
            "result": "",
            "stop_reason": stop_reason or finish or "complete",
        }
    )
    append_events(events)
