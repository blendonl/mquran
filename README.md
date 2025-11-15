# MQuran - Quran Recitation Tracker

A React Native mobile application that tracks Quran recitation in real-time using Arabic speech recognition. Like Shazam for Quran recitation, but it continues to follow along as you recite.

## Features

- **Real-time Speech Recognition**: Uses on-device Arabic speech recognition (wav2vec2 model)
- **Word-level Tracking**: Tracks each word as it's being recited
- **Any Reciter**: Works with any reciter, not just specific voices
- **Translation Support**: Toggle between Arabic text and translations
- **Offline-first**: All processing happens on-device (no internet required after setup)
- **Cross-platform**: Android and iOS support

## Project Structure

This is a monorepo managed with Yarn Workspaces and Turborepo:

```
mquran/
├── apps/
│   ├── mobile/          # React Native app
│   │   ├── android/    # Android native code + ONNX Runtime integration
│   │   ├── ios/        # iOS native code (future)
│   │   └── src/        # React Native TypeScript code
│   └── backend/        # NestJS backend API (optional, for future features)
├── packages/
│   ├── quran-data/     # Quran text, translations, and data management
│   ├── asr-service/    # Speech recognition service abstraction
│   └── word-matcher/   # Word matching algorithm for tracking recitation
└── scripts/
    └── ml-models/      # Scripts to download and convert AI models
```

## Tech Stack

### Mobile App
- **React Native** (bare workflow, Android focus)
- **TypeScript**
- **ONNX Runtime** for on-device model inference
- **wav2vec2** Arabic speech recognition model (Nuwaisir/Quran_speech_recognizer)

### Backend (Optional)
- **NestJS**
- **TypeScript**
- **PostgreSQL** (future feature for user accounts)

### Shared Packages
- **quran-data**: Quran text processing and search
- **asr-service**: Speech recognition abstraction layer
- **word-matcher**: Real-time word matching algorithm

## Getting Started

### Prerequisites

- Node.js >= 18
- Yarn >= 1.22
- Android Studio (for Android development)
- Python 3.8+ (for model conversion)
- JDK 17

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mquran
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Download Quran data**
   ```bash
   yarn workspace @mquran/quran-data download-quran
   ```
   This downloads the complete Quran with word-by-word data and English translation from api.quran.com

4. **Download and convert the ASR model**

   Install Python dependencies:
   ```bash
   pip install -r scripts/ml-models/requirements.txt
   ```

   Download and convert the model:
   ```bash
   python scripts/ml-models/download_and_convert_model.py
   ```

   This will:
   - Download the Nuwaisir/Quran_speech_recognizer model from Hugging Face
   - Convert it to ONNX format for mobile deployment
   - Optimize it for on-device inference
   - Save it to `apps/mobile/android/app/src/main/assets/models/`

### Running the App

#### Android

1. **Start Metro bundler**
   ```bash
   yarn mobile
   ```

2. **Run on Android device/emulator**
   ```bash
   yarn mobile:android
   ```

#### Backend (Optional)

```bash
yarn backend
```

The backend API will be available at `http://localhost:3000`

## Development

### Build all packages
```bash
yarn build
```

### Run linting
```bash
yarn lint
```

### Clean all build artifacts
```bash
yarn clean
```

## How It Works

### 1. Audio Capture
The app captures audio from the device microphone in real-time using Android's AudioRecord API.

### 2. Speech Recognition
Audio chunks are processed using the wav2vec2 model running on ONNX Runtime:
- Audio is sampled at 16kHz (model requirement)
- Voice Activity Detection filters out silence
- Model outputs Arabic text for each chunk

### 3. Word Matching
The `WordMatcher` class matches recognized Arabic text to Quran words:
- Uses fuzzy matching to handle pronunciation variations
- Considers context from previous matches
- Boosts confidence for sequential words
- Normalizes Arabic text (removes diacritics, normalizes forms)

### 4. Position Tracking
As words are matched, the app:
- Updates the current position (Surah, Ayah, Word)
- Displays the current Ayah with highlighted word
- Shows translation (if enabled)
- Automatically advances as recitation continues

## Architecture Decisions

### Why ONNX Runtime?
- Cross-platform (Android, iOS, Web)
- Excellent performance on mobile
- Supports quantization for smaller models
- Active maintenance and community

### Why wav2vec2 over Whisper?
- Smaller model size (better for mobile)
- Faster inference
- Specifically fine-tuned for Quran recitation
- Good word-level accuracy

### Why Monorepo?
- Share code between mobile and backend
- Consistent versioning
- Simplified dependency management
- Better developer experience with Turborepo caching

## Next Steps / Roadmap

- [ ] Complete CTC decoding in the native module
- [ ] Add proper tokenizer integration
- [ ] Implement iOS support
- [ ] Add user accounts and progress tracking
- [ ] Support multiple translations
- [ ] Bookmark and favorites
- [ ] Recitation history
- [ ] Offline model updates
- [ ] Tajweed error detection
- [ ] Recitation speed adjustment

## Model Information

**Model**: [Nuwaisir/Quran_speech_recognizer](https://huggingface.co/Nuwaisir/Quran_speech_recognizer)
- Base model: wav2vec2-large-xlsr-53-arabic
- Fine-tuned on: Quran ASR Challenge dataset
- Language: Arabic
- Task: Automatic Speech Recognition (ASR)
- Input: 16kHz audio waveform
- Output: Arabic text transcription

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See LICENSE file for details.

## Acknowledgments

- Quran data from [api.quran.com](https://api.quran.com)
- ASR model by [Nuwaisir](https://huggingface.co/Nuwaisir)
- Base model by [wav2vec2-large-xlsr-53](https://huggingface.co/facebook/wav2vec2-large-xlsr-53)
