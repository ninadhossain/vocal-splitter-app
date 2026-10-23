#!/usr/bin/env python3
"""
Meta Demucs v4 Neural Stem Separation Worker using ONNX Runtime.
DirectML GPU accelerated on Windows with multi-threaded CPU fallback.
Outputs lossless 16-bit 44.1kHz PCM stereo stems (Vocals, Drums, Bass, Other).
"""
import os
import sys
import argparse
import json
import time
from typing import cast

# Ensure local portable python_env packages are discoverable if available
_local_site_packages = os.path.join(os.path.dirname(os.path.abspath(__file__)), "python_env", "Lib", "site-packages")
if os.path.isdir(_local_site_packages) and _local_site_packages not in sys.path:
    sys.path.insert(0, _local_site_packages)

import numpy as np

def report_progress(pct, step):
    print(json.dumps({"progress": pct, "step": step}), flush=True)

def main():
    parser = argparse.ArgumentParser(description="AI Audio Stem Separation Worker")
    parser.add_argument("--job-id", required=True, help="Unique Job ID")
    parser.add_argument("--input", required=True, help="Path to input audio file")
    parser.add_argument("--output-dir", required=True, help="Path to output stems directory")
    parser.add_argument("--mode", default="4-stem", choices=["2-stem", "4-stem", "6-stem"], help="Stem separation mode")
    parser.add_argument("--model", default="htdemucs", help="Demucs model name (htdemucs / htdemucs_6s)")
    parser.add_argument("--device", default=None, help="Target device (dml / cpu / cuda)")
    args = parser.parse_args()

    report_progress(5, "Initializing AI Neural Engine")
    os.makedirs(args.output_dir, exist_ok=True)

    try:
        import onnxruntime as ort
        import soundfile as sf
        import demucs_onnx
        import demucs_onnx._hub as demucs_hub
        import demucs_onnx._audio as demucs_audio
        from demucs_onnx import load_audio, write_audio
        from demucs_onnx.inference import (
            N_CHANNELS, N_SAMPLES, SEGMENT_S, SAMPLE_RATE,
            _make_transition_window
        )
    except Exception as e:
        report_progress(5, f"Neural dependencies unavailable: {e}")
        sys.stderr.write(f"Import error: {e}\n")
        sys.exit(1)

    # 1. Resolve model file path
    local_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(local_dir, "models", "htdemucs_fp16weights.onnx"),
        os.path.join(local_dir, "models", "htdemucs.onnx"),
    ]
    model_path = None
    for cand in candidates:
        if os.path.exists(cand) and os.path.getsize(cand) > 10 * 1024 * 1024:
            model_path = cand
            break

    if not model_path:
        report_progress(10, "Loading Demucs v4 Neural Weights")
        try:
            model_path = str(demucs_hub.download_single_model("htdemucs", precision="fp16weights"))
        except Exception as e:
            sys.stderr.write(f"Model load error: {e}\n")
            sys.exit(1)

    # 2. Load audio track
    report_progress(15, "Decoding Audio Track into 44.1kHz Stereo PCM")
    try:
        mix, native_sr = load_audio(args.input, target_sr=SAMPLE_RATE)
    except Exception as e:
        sys.stderr.write(f"Failed to load audio {args.input}: {e}\n")
        sys.exit(1)

    # 3. Configure inference session providers
    available_providers = ort.get_available_providers()
    selected_providers = []
    if 'DmlExecutionProvider' in available_providers and args.device != 'cpu':
        selected_providers.append('DmlExecutionProvider')
    if 'CUDAExecutionProvider' in available_providers and args.device != 'cpu':
        selected_providers.append('CUDAExecutionProvider')
    selected_providers.append('CPUExecutionProvider')

    provider_name = selected_providers[0]
    dev_label = "GPU Acceleration (DirectML)" if "Dml" in provider_name else ("GPU Acceleration (CUDA)" if "CUDA" in provider_name else "CPU Multi-Core")
    report_progress(20, f"Demucs v4 Neural Network Loaded on {dev_label}")

    session = ort.InferenceSession(model_path, providers=selected_providers)

    # 4. Neural inference with chunked overlap-add
    sources = ("drums", "bass", "other", "vocals")
    total_len = mix.shape[1]
    overlap = N_SAMPLES // 4
    stride = N_SAMPLES - overlap
    n_chunks = max(1, (total_len + stride - 1) // stride)

    window = _make_transition_window(N_SAMPLES)
    out = {s: np.zeros((N_CHANNELS, total_len), dtype=np.float32) for s in sources}
    weight = np.zeros(total_len, dtype=np.float32)

    for i in range(n_chunks):
        start = i * stride
        end = min(start + N_SAMPLES, total_len)
        chunk = mix[:, start:end]
        if chunk.shape[1] < N_SAMPLES:
            chunk = np.pad(chunk, ((0, 0), (0, N_SAMPLES - chunk.shape[1])), mode="constant")

        x = chunk[np.newaxis, ...].astype(np.float32, copy=False)
        chunk_len = end - start
        w = window[:chunk_len]

        raw_outputs = session.run(["stems"], {"mix": x})
        stems_res = cast(np.ndarray, raw_outputs[0])[0]  # (4, 2, N)
        for s in sources:
            row = sources.index(s)
            out[s][:, start:end] += stems_res[row, :, :chunk_len] * w

        weight[start:end] += w
        pct = 20 + int(((i + 1) / n_chunks) * 70)
        report_progress(pct, f"Demucs Neural Inference (Chunk {i + 1}/{n_chunks})")

    weight = np.maximum(weight, 1e-8)
    for s in out:
        out[s] /= weight

    report_progress(92, "Synthesizing Isolated Stems to 24-bit WAV")

    # 5. Resample back to native rate if needed
    if native_sr != SAMPLE_RATE:
        out = {s: demucs_audio.resample_to_native(arr, SAMPLE_RATE, native_sr) for s, arr in out.items()}

    # 6. Save separated files
    if args.mode == "2-stem":
        vocals_path = os.path.join(args.output_dir, "vocals.wav")
        no_vocals_path = os.path.join(args.output_dir, "no_vocals.wav")
        write_audio(vocals_path, out["vocals"], native_sr)
        inst = out["drums"] + out["bass"] + out["other"]
        write_audio(no_vocals_path, inst, native_sr)
    else:
        for stem_name, audio_data in out.items():
            stem_path = os.path.join(args.output_dir, f"{stem_name}.wav")
            write_audio(stem_path, audio_data, native_sr)

    report_progress(100, "Neural Stem Separation Completed Successfully")

if __name__ == "__main__":
    main()
