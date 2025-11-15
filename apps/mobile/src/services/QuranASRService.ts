import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';

const { QuranASRModule } = NativeModules;

export interface ASRResult {
  text: string;
  confidence: number;
  timestamp: number;
}

export interface ASREventListeners {
  onResult?: (result: ASRResult) => void;
  onPartialResult?: (result: ASRResult) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onStop?: () => void;
}

class QuranASRService {
  private eventEmitter: NativeEventEmitter;
  private listeners: EmitterSubscription[] = [];
  private initialized: boolean = false;

  constructor() {
    this.eventEmitter = new NativeEventEmitter(QuranASRModule);
  }

  /**
   * Initialize the ASR service with the model path
   */
  async initialize(modelPath: string): Promise<void> {
    try {
      await QuranASRModule.initialize(modelPath);
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize ASR service: ${error}`);
    }
  }

  /**
   * Start recording and processing audio
   */
  async start(): Promise<void> {
    if (!this.initialized) {
      throw new Error('ASR service not initialized. Call initialize() first.');
    }

    try {
      await QuranASRModule.startRecording();
    } catch (error) {
      throw new Error(`Failed to start recording: ${error}`);
    }
  }

  /**
   * Stop recording
   */
  async stop(): Promise<void> {
    try {
      await QuranASRModule.stopRecording();
    } catch (error) {
      throw new Error(`Failed to stop recording: ${error}`);
    }
  }

  /**
   * Check if the service is initialized
   */
  async isInitialized(): Promise<boolean> {
    try {
      return await QuranASRModule.isInitialized();
    } catch (error) {
      return false;
    }
  }

  /**
   * Add event listeners for ASR events
   */
  addEventListener(eventListeners: ASREventListeners): void {
    // Remove existing listeners
    this.removeAllListeners();

    // Add new listeners
    if (eventListeners.onResult) {
      this.listeners.push(
        this.eventEmitter.addListener('onASRResult', eventListeners.onResult)
      );
    }

    if (eventListeners.onPartialResult) {
      this.listeners.push(
        this.eventEmitter.addListener('onPartialASRResult', eventListeners.onPartialResult)
      );
    }

    if (eventListeners.onError) {
      this.listeners.push(
        this.eventEmitter.addListener('onASRError', (event: { error: string }) => {
          eventListeners.onError!(event.error);
        })
      );
    }

    if (eventListeners.onStart) {
      this.listeners.push(
        this.eventEmitter.addListener('onRecordingStarted', eventListeners.onStart)
      );
    }

    if (eventListeners.onStop) {
      this.listeners.push(
        this.eventEmitter.addListener('onRecordingStopped', eventListeners.onStop)
      );
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.listeners.forEach(listener => listener.remove());
    this.listeners = [];
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.removeAllListeners();
    this.initialized = false;
  }
}

export default new QuranASRService();
