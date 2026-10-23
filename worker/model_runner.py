"""
Demucs v4 Hybrid Audio Separation Runner
Loads Meta Demucs (htdemucs / htdemucs_6s) and performs neural stem isolation.
"""
import os
import torch
import torchaudio
import soundfile as sf
import json

def report_progress(pct, step):
    print(json.dumps({"progress": pct, "step": step}), flush=True)

def run_demucs_separation(input_path, output_dir, mode='4-stem', model_name='htdemucs', device=None):
    from demucs.pretrained import get_model
    from demucs.apply import apply_model

    if device is None:
        device = 'cuda' if torch.cuda.is_available() else 'cpu'

    report_progress(10, f"Loading Demucs Model: {model_name} on {device.upper()}")
    model = get_model(model_name)
    model.to(device)
    model.eval()

    report_progress(25, "Loading Audio File & Resampling to 44.1kHz")
    wav, sr = torchaudio.load(input_path)
    if sr != model.samplerate:
        resampler = torchaudio.transforms.Resample(sr, model.samplerate)
        wav = resampler(wav)

    if wav.shape[0] == 1:
        # Convert mono to stereo
        wav = wav.repeat(2, 1)

    ref = wav.mean(0)
    wav = (wav - ref.mean()) / ref.std()

    report_progress(45, "Running Neural Network Inference (Hybrid Spectrogram + Waveform)")
    with torch.no_grad():
        # Shape: (sources, channels, time)
        sources = apply_model(model, wav[None], device=device, shifts=1, split=True, overlap=0.25)[0]

    sources = sources * ref.std() + ref.mean()
    sources = sources.cpu()

    os.makedirs(output_dir, exist_ok=True)
    source_names = model.sources # ['drums', 'bass', 'other', 'vocals']

    report_progress(80, "Writing Lossless Audio Stems")

    if mode == '2-stem':
        # Vocal Remover mode: vocals vs no_vocals
        vocals_idx = source_names.index('vocals')
        vocals = sources[vocals_idx]

        # Calculate instrumental as the sum of non-vocal stems or difference
        other_indices = [i for i, s in enumerate(source_names) if s != 'vocals']
        no_vocals = sources[other_indices].sum(dim=0)

        sf.write(os.path.join(output_dir, 'vocals.wav'), vocals.t().numpy(), model.samplerate)
        sf.write(os.path.join(output_dir, 'no_vocals.wav'), no_vocals.t().numpy(), model.samplerate)
    else:
        # 4-stem or 6-stem mode
        for idx, stem_name in enumerate(source_names):
            stem_audio = sources[idx]
            stem_path = os.path.join(output_dir, f"{stem_name}.wav")
            sf.write(stem_path, stem_audio.t().numpy(), model.samplerate)

    report_progress(100, "Separation Completed Successfully")
