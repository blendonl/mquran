import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  PermissionsAndroid,
  Platform,
} from 'react-native';

const RecitationScreen: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [currentAyah, setCurrentAyah] = useState<{
    surah: number;
    ayah: number;
    text: string;
  } | null>(null);

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'MQuran needs access to your microphone to listen to recitation',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const startListening = async () => {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      console.log('Microphone permission denied');
      return;
    }

    setIsListening(true);
    // TODO: Start ASR service
    console.log('Started listening for recitation...');
  };

  const stopListening = () => {
    setIsListening(false);
    // TODO: Stop ASR service
    console.log('Stopped listening');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <View style={styles.container}>
      {/* Current Ayah Display */}
      <ScrollView style={styles.ayahContainer}>
        {currentAyah ? (
          <View style={styles.ayahContent}>
            <Text style={styles.ayahReference}>
              Surah {currentAyah.surah}, Ayah {currentAyah.ayah}
            </Text>
            <Text style={styles.ayahText}>{currentAyah.text}</Text>
            {currentWord && (
              <Text style={styles.currentWord}>
                Current Word: <Text style={styles.highlightedWord}>{currentWord}</Text>
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              Tap the microphone button below to start reciting
            </Text>
            <Text style={styles.placeholderSubtext}>
              The app will automatically detect and follow your recitation
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.micButton,
            isListening && styles.micButtonActive,
          ]}
          onPress={toggleListening}>
          <Text style={styles.micButtonText}>
            {isListening ? '⏸ Stop' : '🎤 Start'}
          </Text>
        </TouchableOpacity>

        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, isListening && styles.statusDotActive]} />
          <Text style={styles.statusText}>
            {isListening ? 'Listening...' : 'Ready'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  ayahContainer: {
    flex: 1,
    padding: 20,
  },
  ayahContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ayahReference: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
  },
  ayahText: {
    fontSize: 28,
    lineHeight: 48,
    textAlign: 'right',
    fontFamily: 'Arial', // TODO: Replace with proper Arabic font
    color: '#1A1A1A',
  },
  currentWord: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  highlightedWord: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  placeholderText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 12,
  },
  placeholderSubtext: {
    fontSize: 14,
    textAlign: 'center',
    color: '#999',
  },
  controlsContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  micButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  micButtonActive: {
    backgroundColor: '#D32F2F',
  },
  micButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#999',
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: '#D32F2F',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
});

export default RecitationScreen;
