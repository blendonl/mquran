#!/usr/bin/env python3
"""
Download and convert wav2vec2 Quran ASR model to ONNX format for mobile deployment.

This script:
1. Downloads the Nuwaisir/Quran_speech_recognizer model from Hugging Face
2. Converts it to ONNX format for ONNX Runtime
3. Optimizes it for mobile deployment
4. Saves the processor/tokenizer for decoding

Requirements:
    pip install transformers torch onnx onnxruntime optimum
"""

import os
import torch
import json
from pathlib import Path
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
from optimum.onnxruntime import ORTModelForCTC

# Model configuration
MODEL_NAME = "Nuwaisir/Quran_speech_recognizer"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "apps" / "mobile" / "android" / "app" / "src" / "main" / "assets"
MODEL_DIR = OUTPUT_DIR / "models"

def download_model():
    """Download the model and processor from Hugging Face"""
    print(f"📥 Downloading model: {MODEL_NAME}")

    try:
        # Download the model
        model = Wav2Vec2ForCTC.from_pretrained(MODEL_NAME)
        processor = Wav2Vec2Processor.from_pretrained(MODEL_NAME)

        print("✅ Model and processor downloaded successfully")
        return model, processor

    except Exception as e:
        print(f"❌ Error downloading model: {e}")
        raise

def convert_to_onnx(model, processor):
    """Convert the PyTorch model to ONNX format"""
    print("\n🔄 Converting model to ONNX format...")

    try:
        # Create output directory
        MODEL_DIR.mkdir(parents=True, exist_ok=True)

        # Export to ONNX using Optimum
        ort_model = ORTModelForCTC.from_pretrained(
            MODEL_NAME,
            export=True,
        )

        # Save the ONNX model
        onnx_path = MODEL_DIR / "quran_asr_model.onnx"
        ort_model.save_pretrained(MODEL_DIR)

        print(f"✅ ONNX model saved to: {onnx_path}")

        return onnx_path

    except Exception as e:
        print(f"❌ Error converting to ONNX: {e}")
        print("\n⚠️  Falling back to manual ONNX export...")
        return manual_onnx_export(model)

def manual_onnx_export(model):
    """Manual ONNX export as fallback"""
    try:
        # Set model to evaluation mode
        model.eval()

        # Create dummy input
        dummy_input = torch.randn(1, 16000)  # 1 second of audio at 16kHz

        # Export to ONNX
        onnx_path = MODEL_DIR / "quran_asr_model.onnx"

        torch.onnx.export(
            model,
            dummy_input,
            onnx_path,
            export_params=True,
            opset_version=14,
            do_constant_folding=True,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes={
                'input': {0: 'batch_size', 1: 'sequence_length'},
                'output': {0: 'batch_size', 1: 'sequence_length'}
            }
        )

        print(f"✅ ONNX model saved to: {onnx_path}")
        return onnx_path

    except Exception as e:
        print(f"❌ Error in manual ONNX export: {e}")
        raise

def save_processor_config(processor):
    """Save processor configuration for decoding in the app"""
    print("\n💾 Saving processor configuration...")

    try:
        # Save tokenizer
        tokenizer_path = MODEL_DIR / "tokenizer.json"
        processor.save_pretrained(MODEL_DIR)

        # Create a simplified config for mobile
        config = {
            "vocab": processor.tokenizer.get_vocab(),
            "sampling_rate": processor.feature_extractor.sampling_rate,
            "padding_value": processor.feature_extractor.padding_value,
            "return_attention_mask": processor.feature_extractor.return_attention_mask,
        }

        config_path = MODEL_DIR / "processor_config.json"
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)

        print(f"✅ Processor config saved to: {config_path}")

        # Create reverse vocab for decoding
        reverse_vocab = {v: k for k, v in config["vocab"].items()}
        reverse_vocab_path = MODEL_DIR / "reverse_vocab.json"
        with open(reverse_vocab_path, 'w', encoding='utf-8') as f:
            json.dump(reverse_vocab, f, ensure_ascii=False, indent=2)

        print(f"✅ Reverse vocabulary saved to: {reverse_vocab_path}")

    except Exception as e:
        print(f"❌ Error saving processor config: {e}")
        raise

def optimize_for_mobile(onnx_path):
    """Optimize ONNX model for mobile deployment"""
    print("\n⚡ Optimizing model for mobile...")

    try:
        import onnxruntime as ort

        # Load the ONNX model
        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        sess_options.optimized_model_filepath = str(MODEL_DIR / "quran_asr_model_optimized.onnx")

        # Create inference session (this will optimize the model)
        session = ort.InferenceSession(str(onnx_path), sess_options)

        print(f"✅ Optimized model saved")
        print(f"\n📊 Model Info:")
        print(f"   Input: {session.get_inputs()[0].name} - {session.get_inputs()[0].shape}")
        print(f"   Output: {session.get_outputs()[0].name} - {session.get_outputs()[0].shape}")

    except Exception as e:
        print(f"⚠️  Warning: Could not optimize model: {e}")
        print("   Using non-optimized version")

def create_readme():
    """Create README with usage instructions"""
    readme_content = """# Quran ASR Model

This directory contains the ONNX model for Quran speech recognition.

## Files:
- `quran_asr_model.onnx`: The main ONNX model file
- `quran_asr_model_optimized.onnx`: Optimized version for mobile
- `processor_config.json`: Configuration for audio preprocessing
- `reverse_vocab.json`: Vocabulary mapping for decoding model output

## Model Details:
- Base Model: Nuwaisir/Quran_speech_recognizer (wav2vec2)
- Input: Audio waveform (16kHz sampling rate)
- Output: CTC logits for Arabic characters

## Usage in Android:
The model is loaded using ONNX Runtime in the QuranASRModule.
See apps/mobile/android/app/src/main/java/com/mquran/asr/QuranASRModule.kt

## Re-generating the model:
```bash
python scripts/ml-models/download_and_convert_model.py
```
"""

    readme_path = MODEL_DIR / "README.md"
    with open(readme_path, 'w') as f:
        f.write(readme_content)

    print(f"\n📄 README created at: {readme_path}")

def main():
    print("=" * 60)
    print("Quran ASR Model Download and Conversion Tool")
    print("=" * 60)

    try:
        # Step 1: Download model
        model, processor = download_model()

        # Step 2: Convert to ONNX
        onnx_path = convert_to_onnx(model, processor)

        # Step 3: Save processor config
        save_processor_config(processor)

        # Step 4: Optimize for mobile
        optimize_for_mobile(onnx_path)

        # Step 5: Create README
        create_readme()

        print("\n" + "=" * 60)
        print("✨ Model conversion complete!")
        print(f"📁 Model files saved to: {MODEL_DIR}")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

if __name__ == "__main__":
    main()
