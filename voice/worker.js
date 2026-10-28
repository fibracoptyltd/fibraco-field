// Fibraco Field voice engine: turns a recording into English text on the phone itself (Whisper base, no internet needed
// once it is on the phone). Word for word: no rewording, no translating.
import { pipeline, env } from "./tf/transformers.min.js";
const base = new URL("./", import.meta.url).href;
env.allowRemoteModels = false; env.allowLocalModels = true; env.localModelPath = base + "models/";
env.useBrowserCache = false; // the app's own voice cache keeps the files, so they are not stored twice
env.backends.onnx.wasm.wasmPaths = { mjs: base + "tf/ort-wasm-simd-threaded.jsep.js", wasm: base + "tf/ort-wasm-simd-threaded.jsep.wasm" }; // .js, not .mjs, so any web server sends it as JavaScript
env.backends.onnx.wasm.numThreads = 1;
let asr = null;
const load = () => asr || (asr = pipeline("automatic-speech-recognition", "Xenova/whisper-base", { dtype: "q8",
  progress_callback: p => { if (p.status === "progress") self.postMessage({ progress: p.file, pct: Math.round(p.progress || 0) }); } }));
self.onmessage = async e => {
  const { id, audio } = e.data;
  try {
    const m = await load();
    if (!audio) return self.postMessage({ id, ready: true });
    const out = await m(audio, { language: "english", task: "transcribe", chunk_length_s: 30, stride_length_s: 5 });
    self.postMessage({ id, text: String(out.text || "").trim() });
  } catch (err) { asr = null; self.postMessage({ id, error: String(err && err.message || err) }); }
};
