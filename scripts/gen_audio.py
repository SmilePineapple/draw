#!/usr/bin/env python3
"""Records every phrase in audio/texts.json with Microsoft Edge TTS (British female voice).

    pip install edge-tts
    node scripts/audio-texts.mjs     # lists the phrases -> audio/texts.json
    python3 scripts/gen_audio.py     # records them     -> audio/*.mp3 + audio/index.json

Re-running only records phrases that are new or changed. Never exits with an error, so a deploy can't fail
because of it: anything that could not be recorded is simply read by the device's own voice instead.
"""
import asyncio
import hashlib
import json
import os
import re
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("edge-tts is not installed (pip install edge-tts) - skipping voice clips")
    sys.exit(0)

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "audio"
VOICE = os.environ.get("TTS_VOICE", "en-GB-SoniaNeural")  # British English, female
RATE = os.environ.get("TTS_RATE", "-8%")                  # a touch slower for little listeners
CONCURRENCY = int(os.environ.get("TTS_CONCURRENCY", "6"))
TOKEN = re.compile(r"[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*")


def filename(key: str) -> str:
    return hashlib.sha1(f"{VOICE}|{RATE}|{key}".encode()).hexdigest()[:14] + ".mp3"


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def align(text: str, events: list) -> list:
    """Start time (ms) of each word token in `text`, matched against the voice's word-boundary events."""
    toks = TOKEN.findall(text)
    starts = [None] * len(toks)
    j = 0
    for ev in events:
        n = norm(ev["text"])
        if not n:
            continue
        for k in range(j, min(j + 3, len(toks))):
            t = norm(toks[k])
            if t == n or t.startswith(n) or n.startswith(t):
                if starts[k] is None:
                    starts[k] = ev["ms"]
                j = k + 1 if (t == n or n.startswith(t)) else k
                break
    # fill any gaps by interpolating between known neighbours
    known = [(i, s) for i, s in enumerate(starts) if s is not None]
    if not known:
        return [0] * len(toks)
    out = []
    for i in range(len(toks)):
        if starts[i] is not None:
            out.append(int(starts[i]))
            continue
        prev = max((k for k in known if k[0] < i), default=None, key=lambda k: k[0])
        nxt = min((k for k in known if k[0] > i), default=None, key=lambda k: k[0])
        if prev and nxt:
            out.append(int(prev[1] + (nxt[1] - prev[1]) * (i - prev[0]) / (nxt[0] - prev[0])))
        elif prev:
            out.append(int(prev[1] + 250 * (i - prev[0])))
        else:
            out.append(max(0, int(nxt[1] - 250 * (nxt[0] - i))))
    return out


async def record(text: str, want_words: bool):
    try:
        comm = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    except TypeError:  # older edge-tts: word boundaries are the default
        comm = edge_tts.Communicate(text, VOICE, rate=RATE)
    audio = bytearray()
    events = []
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]
        elif chunk["type"] == "WordBoundary":
            events.append({"text": chunk["text"], "ms": chunk["offset"] / 10000})
    if not audio:
        raise RuntimeError("no audio returned")
    return bytes(audio), (align(text, events) if want_words else None)


async def main():
    texts_path = AUDIO / "texts.json"
    if not texts_path.exists():
        print("audio/texts.json missing - run: node scripts/audio-texts.mjs")
        return
    items = json.loads(texts_path.read_text())
    index_path = AUDIO / "index.json"
    old = {}
    if index_path.exists():
        try:
            old = json.loads(index_path.read_text()).get("clips", {})
        except Exception:
            old = {}

    clips, todo = {}, []
    for it in items:
        key, fn = it["k"], filename(it["k"])
        prev = old.get(key)
        if prev and prev.get("f") == fn and (AUDIO / fn).exists() and (not it["page"] or "w" in prev):
            clips[key] = prev
        else:
            todo.append((it, fn))
    print(f"{len(clips)} clips already recorded, {len(todo)} to record with {VOICE}")

    sem = asyncio.Semaphore(CONCURRENCY)
    failed = 0

    async def work(it, fn):
        nonlocal failed
        async with sem:
            for attempt in range(4):
                try:
                    data, words = await record(it["text"], it["page"])
                    (AUDIO / fn).write_bytes(data)
                    clips[it["k"]] = {"f": fn, **({"w": words} if words else {})}
                    return
                except Exception as e:  # noqa: BLE001
                    last = e
                    await asyncio.sleep(1.5 * (attempt + 1))
            failed += 1
            print(f"  could not record {it['text'][:40]!r}: {last}")

    if todo:
        # if the very first request fails the service is unreachable - don't wait on every phrase
        try:
            await record("Hello", False)
        except Exception as e:  # noqa: BLE001
            print(f"Edge TTS is not reachable from here ({e}) - the device voice will be used instead")
            if not clips:
                return
            todo = []
        await asyncio.gather(*(work(it, fn) for it, fn in todo))

    index_path.write_text(json.dumps({"voice": VOICE, "rate": RATE, "clips": dict(sorted(clips.items()))}, separators=(",", ":")))
    print(f"index.json: {len(clips)} clips ({failed} failed)")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:  # noqa: BLE001  never break a deploy
        print(f"voice clip generation skipped: {e}")
    sys.exit(0)
