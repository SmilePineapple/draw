#!/usr/bin/env python3
"""Records every phrase in audio/texts.json as British-English female speech.

    pip install piper-tts numpy        # default engine: Piper (offline neural TTS, no account or service needed)
    node scripts/audio-texts.mjs       # lists the phrases -> audio/texts.json
    python3 scripts/gen_audio.py       # records them      -> audio/*.mp3 + audio/index.json

Engines (TTS_ENGINE):
  piper (default)  open-source Piper voice, runs right here. TTS_VOICE=en_GB-cori-medium (also: en_GB-jenny_dioco-medium,
                   en_GB-alba-medium). Needs ffmpeg for the mp3 conversion.
  edge             Microsoft Edge neural voice (TTS_VOICE=en-GB-SoniaNeural) - pip install edge-tts. Microsoft refuses
                   requests from cloud servers such as GitHub's, so this one is for running on your own computer.

Re-running only records new or changed phrases. It never exits with an error, so a deploy can't fail because of it:
anything that could not be recorded is simply read by the device's own voice instead.
"""
import asyncio
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import time
import wave
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "audio"
ENGINE = os.environ.get("TTS_ENGINE", "piper").lower()
TOKEN = re.compile(r"[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*")
PIPER_VOICES = ["en_GB-cori-medium", "en_GB-jenny_dioco-medium", "en_GB-alba-medium"]  # tried in this order
VOICE = os.environ.get("TTS_VOICE") or ("en-GB-SoniaNeural" if ENGINE == "edge" else PIPER_VOICES[0])
LENGTH_SCALE = float(os.environ.get("TTS_LENGTH_SCALE", "1.12"))  # Piper: >1 = slower, a touch calmer for little listeners
EDGE_RATE = os.environ.get("TTS_RATE", "-8%")
BUDGET_MIN = float(os.environ.get("TTS_BUDGET_MIN", "40"))  # stop starting new clips after this long; the next run carries on


def filename(key: str) -> str:
    return hashlib.sha1(f"{ENGINE}|{VOICE}|{LENGTH_SCALE}|{key}".encode()).hexdigest()[:14] + ".mp3"


# ------------------------------------------------------------------------------------------ word timings
def estimate_words(text: str, duration_ms: float) -> list:
    """Start time (ms) of each word, spread over the clip by word length, with longer beats after punctuation."""
    parts = list(TOKEN.finditer(text))
    if not parts:
        return []
    weights = []
    for i, m in enumerate(parts):
        end = parts[i + 1].start() if i + 1 < len(parts) else len(text)
        gap = text[m.end():end]
        w = len(re.sub(r"[^A-Za-z0-9]", "", m.group(0))) + 1.2
        if re.search(r"[.!?]", gap):
            w += 3.5
        elif re.search(r"[,;:—-]", gap):
            w += 1.8
        weights.append(w)
    total = sum(weights)
    starts, acc = [], 0.0
    for w in weights:
        starts.append(int(duration_ms * acc / total))
        acc += w
    return starts


# ------------------------------------------------------------------------------------------ audio helpers
def wav_to_mp3(wav_bytes: bytes):
    """Trim silence, convert to a small mono mp3. Returns (mp3 bytes, duration ms)."""
    import numpy as np

    with wave.open(io.BytesIO(wav_bytes)) as w:
        rate, n, data = w.getframerate(), w.getnframes(), w.readframes(w.getnframes())
    pcm = np.frombuffer(data, dtype=np.int16)
    loud = np.nonzero(np.abs(pcm) > 250)[0]
    if loud.size:
        pad = int(rate * 0.04)
        pcm = pcm[max(0, loud[0] - pad): min(len(pcm), loud[-1] + pad)]
    dur = len(pcm) * 1000.0 / rate
    proc = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-f", "s16le", "-ar", str(rate), "-ac", "1", "-i", "pipe:0",
         "-codec:a", "libmp3lame", "-b:a", "48k", "-f", "mp3", "pipe:1"],
        input=pcm.tobytes(), capture_output=True, check=True,
    )
    return proc.stdout, dur


# ------------------------------------------------------------------------------------------ engines
class Piper:
    def __init__(self):
        from piper import PiperVoice, SynthesisConfig

        self.cfg = SynthesisConfig(length_scale=LENGTH_SCALE)
        models = AUDIO / ".models"
        models.mkdir(parents=True, exist_ok=True)
        names = [VOICE] + [v for v in PIPER_VOICES if v != VOICE] if not os.environ.get("TTS_VOICE") else [VOICE]
        last = None
        for name in names:
            try:
                path = models / f"{name}.onnx"
                if not path.exists():
                    subprocess.run([sys.executable, "-m", "piper.download_voices", "--download-dir", str(models), name],
                                   check=True, capture_output=True, text=True)
                self.voice = PiperVoice.load(path)
                self.name = name
                break
            except Exception as e:  # noqa: BLE001
                last = getattr(e, "stderr", None) or e
                print(f"  voice {name} unavailable: {str(last).strip()[-200:]}")
        else:
            raise RuntimeError(f"no Piper voice could be loaded ({last})")
        globals()["VOICE"] = self.name  # the voice that actually loaded (used in clip file names)
        print(f"Piper voice: {self.name}")

    def record_sync(self, text: str, want_words: bool):
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            self.voice.synthesize_wav(text, w, syn_config=self.cfg)
        mp3, dur = wav_to_mp3(buf.getvalue())
        return mp3, (estimate_words(text, dur) if want_words else None)


class Edge:
    def __init__(self):
        import edge_tts
        import edge_tts.communicate as comm
        import edge_tts.constants as const
        import edge_tts.voices as voices

        self.edge_tts, self.mods = edge_tts, (const, comm, voices)

    def set_version(self, full: str) -> None:
        const = self.mods[0]
        major = full.split(".")[0]
        for mod in self.mods:
            if hasattr(mod, "SEC_MS_GEC_VERSION"):
                mod.SEC_MS_GEC_VERSION = f"1-{full}"
        for hdr in (const.BASE_HEADERS, const.WSS_HEADERS, const.VOICE_HEADERS):
            if "User-Agent" in hdr:
                hdr["User-Agent"] = re.sub(r"(Chrome|Edg)/\d+\.0\.0\.0", rf"\1/{major}.0.0.0", hdr["User-Agent"])

    async def record(self, text: str, want_words: bool):
        try:
            comm = self.edge_tts.Communicate(text, VOICE, rate=EDGE_RATE, boundary="WordBoundary")
        except TypeError:
            comm = self.edge_tts.Communicate(text, VOICE, rate=EDGE_RATE)
        audio, events = bytearray(), []
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                audio += chunk["data"]
            elif chunk["type"] == "WordBoundary":
                events.append({"text": chunk["text"], "ms": chunk["offset"] / 10000})
        if not audio:
            raise RuntimeError("no audio returned")
        words = None
        if want_words:
            toks = TOKEN.findall(text)
            norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())  # noqa: E731
            starts, j = [None] * len(toks), 0
            for ev in events:
                n = norm(ev["text"])
                for k in range(j, min(j + 3, len(toks))):
                    if n and (norm(toks[k]) == n or norm(toks[k]).startswith(n) or n.startswith(norm(toks[k]))):
                        starts[k] = starts[k] if starts[k] is not None else int(ev["ms"])
                        j = k + 1
                        break
            words = [s if s is not None else (starts[i - 1] + 250 if i and starts[i - 1] is not None else 0) for i, s in enumerate(starts)]
        return bytes(audio), words

    async def connect(self) -> bool:
        last = None
        for full in [None] + [f"{m}.0.0.0" for m in range(144, 171)]:
            if full:
                self.set_version(full)
            try:
                await self.record("Hello", False)
                return True
            except Exception as e:  # noqa: BLE001
                last = e
        print(f"Edge TTS is not reachable from here ({last})")
        return False


class Stub:  # for testing the pipeline without a voice
    def record_sync(self, text: str, want_words: bool):
        import numpy as np

        rate, secs = 22050, 0.12 * max(1, len(text.split())) + 0.2
        t = np.linspace(0, secs, int(rate * secs), endpoint=False)
        pcm = (np.sin(2 * np.pi * 220 * t) * 6000).astype(np.int16)
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pcm.tobytes())
        mp3, dur = wav_to_mp3(buf.getvalue())
        return mp3, (estimate_words(text, dur) if want_words else None)


# ------------------------------------------------------------------------------------------ parallel workers
_ENGINE = None


def _init_worker():
    global _ENGINE
    _ENGINE = {"piper": Piper, "stub": Stub}[ENGINE]()


def _work(args):
    text, want_words = args
    return _ENGINE.record_sync(text, want_words)


def write_index(clips):
    if clips:
        (AUDIO / "index.json").write_text(json.dumps({"engine": ENGINE, "voice": VOICE, "clips": dict(sorted(clips.items()))}, separators=(",", ":")))


def record_parallel(todo, clips):
    """Record with several worker processes; checkpoint the index as we go; stop starting new clips when out of time."""
    workers = max(1, min(4, os.cpu_count() or 2))
    deadline = time.time() + BUDGET_MIN * 60
    print(f"recording with {workers} workers (budget {BUDGET_MIN:.0f} min)")
    failed = done = 0
    with ProcessPoolExecutor(max_workers=workers, initializer=_init_worker) as ex:
        futs = {ex.submit(_work, (it["text"], it["page"])): (it, fn) for it, fn in todo}
        for fut in as_completed(futs):
            it, fn = futs[fut]
            try:
                data, words = fut.result()
                (AUDIO / fn).write_bytes(data)
                clips[it["k"]] = {"f": fn, **({"w": words} if words else {})}
            except Exception as e:  # noqa: BLE001
                failed += 1
                print(f"  could not record {it['text'][:40]!r}: {e}")
            done += 1
            if done % 50 == 0:
                write_index(clips)
                print(f"  {done}/{len(todo)} recorded ({time.time() - deadline + BUDGET_MIN * 60:.0f}s)", flush=True)
            if time.time() > deadline:
                print("time budget reached - saving what we have; run again to finish the rest")
                for f in futs:
                    f.cancel()
                break
    return failed


# ------------------------------------------------------------------------------------------ main
async def main():
    texts_path = AUDIO / "texts.json"
    if not texts_path.exists():
        print("audio/texts.json missing - run: node scripts/audio-texts.mjs")
        return
    try:
        engine = {"piper": Piper, "edge": Edge, "stub": Stub}[ENGINE]()
    except Exception as e:  # noqa: BLE001
        print(f"Could not start the {ENGINE} voice engine ({e}) - the device voice will be used instead")
        return
    if ENGINE == "edge" and not await engine.connect():
        return
    if ENGINE != "edge":
        os.environ["TTS_VOICE"] = VOICE  # workers load exactly this voice

    if ENGINE != "edge" and not shutil.which("ffmpeg"):
        print("ffmpeg is not installed (needed to make the mp3 files) - the device voice will be used instead")
        return
    items = json.loads(texts_path.read_text())
    index_path = AUDIO / "index.json"
    old = {}
    if index_path.exists():
        try:
            old = json.loads(index_path.read_text()).get("clips", {})
        except Exception:  # noqa: BLE001
            old = {}

    clips, todo = {}, []
    for it in items:
        key, fn = it["k"], filename(it["k"])
        prev = old.get(key)
        if prev and prev.get("f") == fn and (AUDIO / fn).exists() and (not it["page"] or "w" in prev):
            clips[key] = prev
        else:
            todo.append((it, fn))
    print(f"{len(clips)} clips already recorded, {len(todo)} to record ({ENGINE}: {VOICE})")

    failed = 0
    if ENGINE != "edge":
        if todo:
            failed = record_parallel(todo, clips)
    else:
        sem = asyncio.Semaphore(6)

        async def work(it, fn):
            nonlocal failed
            async with sem:
                last = None
                for attempt in range(3):
                    try:
                        data, words = await engine.record(it["text"], it["page"])
                        (AUDIO / fn).write_bytes(data)
                        clips[it["k"]] = {"f": fn, **({"w": words} if words else {})}
                        return
                    except Exception as e:  # noqa: BLE001
                        last = e
                        await asyncio.sleep(1 + attempt)
                failed += 1
                print(f"  could not record {it['text'][:40]!r}: {last}")

        await asyncio.gather(*(work(it, fn) for it, fn in todo))
    write_index(clips)
    print(f"index.json: {len(clips)} clips ({failed} failed)")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:  # noqa: BLE001  never break a deploy
        print(f"voice clip generation skipped: {e}")
    sys.exit(0)
