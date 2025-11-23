# Expo Migration Guide

This document outlines the migration from React Native CLI to Expo for the MQuran mobile app.

## Changes Made

### 1. Package Dependencies

**Removed:**
- `@react-native-community/cli`
- `@react-native/babel-preset`
- `@react-native/eslint-config`
- `@react-native/metro-config`
- `@react-native/typescript-config`
- `metro` and related packages (now handled by Expo)
- `connect` (no longer needed)
- `react-native-vector-icons` (replaced with Expo alternatives)

**Added:**
- `expo` (~52.0.0)
- `expo-status-bar` (~2.0.0)
- `babel-preset-expo` (~12.0.0)

### 2. Configuration Files

#### babel.config.js
Changed from `@react-native/babel-preset` to `babel-preset-expo`:
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

#### metro.config.js
Updated to use Expo's Metro config:
```javascript
const { getDefaultConfig } = require('expo/metro-config');
```

#### app.json
Created Expo configuration file with:
- App name and bundle identifiers
- Platform-specific settings (iOS, Android, Web)
- Asset configuration
- Splash screen and icon settings

### 3. Android Native Configuration

Updated Android native files to work with Expo autolinking:

#### settings.gradle
- Removed React Native CLI plugin management
- Added Expo autolinking: `apply from: expo/scripts/autolinking.gradle`
- Simplified to use `useExpoModules()`

#### build.gradle (root)
- Removed React Native gradle plugin dependency
- Updated node_modules paths for monorepo structure
- Kept Kotlin and Android gradle plugin

#### app/build.gradle
- Replaced `com.facebook.react` plugin with Expo autolinking
- Updated to use Expo modules: `useExpoModules()`
- Changed applicationId to match app.json: `com.mquran.app`
- Kept namespace as `com.mquran` to match existing package structure

#### MainActivity.kt
- Added `ReactActivityDelegateWrapper` import
- Wrapped delegate with Expo's wrapper for proper module initialization
- Preserved existing component name and architecture settings

#### MainApplication.kt
- Wrapped ReactNativeHost with `ReactNativeHostWrapper`
- Added `ApplicationLifecycleDispatcher.onApplicationCreate()` call
- Preserved custom `QuranASRPackage` integration
- Maintained all existing React Native and architecture settings

### 4. Entry Point

Created `App.tsx` at the root of the mobile directory that imports from `src/App.tsx`:
```typescript
import App from './src/App';
export default App;
```

### 5. Scripts

Updated package.json scripts:
- `start`: Changed from custom metro script to `expo start`
- `android`: Changed from `react-native run-android` to `expo run:android`
- `ios`: Changed from `react-native run-ios` to `expo run:ios`
- `web`: Added `expo start --web` for web support

### 6. Removed Files

- Removed `scripts/start-metro.js` (no longer needed)
- Removed custom Metro launcher scripts

## Running the App

### Development Mode
```bash
# Start Expo dev server
yarn mobile

# Or from the mobile directory
cd apps/mobile
yarn start
```

### Platform-Specific Development
```bash
# Android
yarn mobile:android

# iOS
yarn mobile:ios

# Web
yarn mobile:web
```

## Monorepo Considerations

The Metro configuration has been updated to work with the monorepo structure:
- `watchFolders` includes the monorepo root
- `nodeModulesPaths` includes both project and monorepo node_modules

## Assets

The app requires the following assets in `apps/mobile/assets/`:
- `icon.png` - App icon (1024x1024)
- `splash.png` - Splash screen
- `adaptive-icon.png` - Android adaptive icon (1024x1024)
- `favicon.png` - Web favicon (48x48)

See `assets/README.md` for more details.

## Benefits of Expo

1. **Simplified Development**: No need to manage native build configurations
2. **Web Support**: Can run the app in a web browser
3. **OTA Updates**: Support for over-the-air updates with Expo Updates
4. **Better DX**: Faster refresh, better error messages
5. **Easier Testing**: Test on physical devices without complex setup
6. **Cross-platform**: Single codebase for iOS, Android, and Web

## Next Steps

1. Add app icons and splash screens to the `assets/` directory
2. Test on iOS, Android, and Web platforms
3. Configure environment-specific settings in `app.json`
4. Set up EAS Build for production builds (optional)
5. Consider adding Expo modules for native features as needed

## Troubleshooting

### Cache Issues
If you encounter cache issues, clear the Expo cache:
```bash
yarn start --clear
```

### Metro Bundler Issues
Reset Metro bundler:
```bash
rm -rf node_modules/.cache
yarn start --reset-cache
```

### Platform-Specific Issues
For iOS or Android build issues, you may need to:
```bash
cd ios && pod install  # iOS only
cd android && ./gradlew clean  # Android only
```

## Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [Expo SDK API Reference](https://docs.expo.dev/versions/latest/)
- [Migrating from React Native CLI](https://docs.expo.dev/bare/installing-expo-modules/)
