# Setup Guide for MQuran

This guide will walk you through setting up the MQuran development environment from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Downloading Quran Data](#downloading-quran-data)
4. [Setting Up the ML Model](#setting-up-the-ml-model)
5. [Running the Mobile App](#running-the-mobile-app)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js** (>= 18.0.0)
   ```bash
   node --version  # Should be 18.x or higher
   ```

2. **Yarn** (>= 1.22.0)
   ```bash
   yarn --version
   ```

3. **Java Development Kit** (JDK 17)
   ```bash
   java --version  # Should be version 17
   ```

4. **Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK Platform 35
   - Install Android SDK Build-Tools 35.0.0
   - Install Android Emulator (optional, for testing)

5. **Python** (>= 3.8, for model conversion)
   ```bash
   python --version  # or python3 --version
   ```

### Environment Variables

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export JAVA_HOME=/path/to/jdk-17  # Adjust to your JDK installation
```

Reload your shell:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd mquran

# Install all dependencies
yarn install

# This will install dependencies for:
# - Root workspace
# - Mobile app
# - Backend
# - All shared packages
```

### 2. Build Shared Packages

```bash
# Build all packages
yarn build

# Or build individual packages
yarn workspace @mquran/quran-data build
yarn workspace @mquran/word-matcher build
yarn workspace @mquran/asr-service build
```

## Downloading Quran Data

The Quran data needs to be downloaded separately as it's not included in the repository.

```bash
# Download Quran data (this may take a few minutes)
yarn workspace @mquran/quran-data download-quran
```

This script will:
- Download all 114 Surahs
- Download word-by-word Arabic text
- Download English translation (Sahih International)
- Save to `packages/quran-data/data/quran.json`

**Expected output:**
```
Downloading Quran chapters...
Downloaded 114 chapters

Processing Surah 1: Al-Fatihah
  - Downloaded 7 verses
...
✅ Successfully downloaded and saved Quran data!
📁 Data saved to: packages/quran-data/data/quran.json
📊 Total surahs: 114
📊 Total ayahs: 6236
📊 Total translations: 6236
```

## Setting Up the ML Model

The ASR (Automatic Speech Recognition) model needs to be downloaded and converted to ONNX format.

### 1. Install Python Dependencies

```bash
cd scripts/ml-models
pip install -r requirements.txt
```

**Note:** We recommend using a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Download and Convert the Model

```bash
python download_and_convert_model.py
```

This will:
1. Download the `Nuwaisir/Quran_speech_recognizer` model from Hugging Face
2. Convert it from PyTorch to ONNX format
3. Optimize it for mobile deployment
4. Save it to `apps/mobile/android/app/src/main/assets/models/`

**Expected time:** 5-15 minutes depending on your internet connection

**Expected output:**
```
============================================================
Quran ASR Model Download and Conversion Tool
============================================================
📥 Downloading model: Nuwaisir/Quran_speech_recognizer
✅ Model and processor downloaded successfully

🔄 Converting model to ONNX format...
✅ ONNX model saved to: .../quran_asr_model.onnx

💾 Saving processor configuration...
✅ Processor config saved
✅ Reverse vocabulary saved

⚡ Optimizing model for mobile...
✅ Optimized model saved

📊 Model Info:
   Input: input - [1, -1]
   Output: output - [1, -1, 42]

📄 README created
============================================================
✨ Model conversion complete!
📁 Model files saved to: .../models
============================================================
```

### Model Files Created

After conversion, you should have:
- `quran_asr_model.onnx` - Main model file
- `quran_asr_model_optimized.onnx` - Optimized for mobile
- `processor_config.json` - Audio preprocessing config
- `reverse_vocab.json` - For decoding model output
- `README.md` - Model documentation

## Running the Mobile App

### 1. Start Metro Bundler

In the project root:
```bash
yarn mobile
```

Keep this running in a separate terminal.

### 2. Run on Android Device/Emulator

#### Option A: Using a Physical Device

1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect your device via USB
4. Verify connection:
   ```bash
   adb devices
   ```

#### Option B: Using Android Emulator

1. Open Android Studio
2. Go to Tools > AVD Manager
3. Create a new Virtual Device (Pixel 5, API 34+ recommended)
4. Start the emulator

### 3. Build and Run

```bash
yarn mobile:android
```

This will:
- Build the Android app
- Install it on your device/emulator
- Launch the app

**First build may take 5-10 minutes.**

### 4. Verify the App is Running

You should see:
- The MQuran splash screen
- Main screen with "Start Recitation" button
- Microphone permission prompt (grant it)

## Running the Backend (Optional)

The backend is optional but useful for future features:

```bash
# Start in development mode
yarn backend

# Or with watch mode
yarn workspace @mquran/backend start:dev
```

Backend will be available at: http://localhost:3000

Test it:
```bash
curl http://localhost:3000/health
```

## Troubleshooting

### Issue: "Quran data not found"

**Solution:**
```bash
yarn workspace @mquran/quran-data download-quran
```

### Issue: "Model file not found"

**Solution:**
```bash
cd scripts/ml-models
python download_and_convert_model.py
```

### Issue: Android build fails with "SDK not found"

**Solution:**
1. Verify ANDROID_HOME is set:
   ```bash
   echo $ANDROID_HOME
   ```
2. Create `apps/mobile/android/local.properties`:
   ```
   sdk.dir=/path/to/Android/Sdk
   ```

### Issue: "Unable to load script" on device

**Solution:**
1. Verify Metro bundler is running
2. Shake device and select "Reload"
3. Or run:
   ```bash
   adb reverse tcp:8081 tcp:8081
   ```

### Issue: Python packages installation fails

**Solution:**
1. Upgrade pip:
   ```bash
   pip install --upgrade pip
   ```
2. Install packages one by one:
   ```bash
   pip install transformers torch onnx onnxruntime optimum
   ```

### Issue: App crashes on startup

**Solution:**
1. Check Android logs:
   ```bash
   adb logcat | grep MQuran
   ```
2. Verify model file exists:
   ```bash
   ls apps/mobile/android/app/src/main/assets/models/
   ```
3. Rebuild:
   ```bash
   cd apps/mobile/android
   ./gradlew clean
   cd ../../..
   yarn mobile:android
   ```

### Issue: Microphone not working

**Solution:**
1. Verify permission is granted in app settings
2. Check AndroidManifest.xml has:
   ```xml
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   ```
3. Request permission at runtime (implemented in RecitationScreen)

### Issue: Metro bundler port 8081 already in use

**Solution:**
```bash
# Find and kill the process
lsof -ti:8081 | xargs kill -9

# Or use a different port
yarn mobile --port 8082
```

## Next Steps

Once everything is set up:

1. **Test the ASR**: Tap the microphone button and recite any Quran verse
2. **Check the logs**: Look for ASR results in the console
3. **Try different reciters**: The app should work with any reciter

## Getting Help

If you encounter issues not covered here:

1. Check the main README.md
2. Look at the code in `apps/mobile/src/`
3. Check Android logs: `adb logcat`
4. Open an issue on GitHub

## Development Tips

- **Hot Reload**: Shake device > Enable Hot Reloading
- **Debug Menu**: Shake device or `adb shell input keyevent 82`
- **Fast Refresh**: Enabled by default
- **Clear Cache**: `yarn mobile -- --reset-cache`
