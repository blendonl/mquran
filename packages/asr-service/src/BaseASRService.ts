import {
  ASRService,
  ASRConfig,
  ASRResult,
  ASREvent,
  ASREventType,
  ASREventListener,
} from './types';

export abstract class BaseASRService implements ASRService {
  protected config: ASRConfig | null = null;
  protected listening: boolean = false;
  protected listeners: Map<ASREventType, Set<ASREventListener>> = new Map();

  /**
   * Initialize the ASR service with configuration
   */
  abstract initialize(config: ASRConfig): Promise<void>;

  /**
   * Start listening for audio input
   */
  abstract start(): Promise<void>;

  /**
   * Stop listening for audio input
   */
  abstract stop(): Promise<void>;

  /**
   * Process audio data and return recognition result
   */
  abstract processAudio(audioData: ArrayBuffer): Promise<ASRResult | null>;

  /**
   * Clean up resources
   */
  abstract destroy(): Promise<void>;

  /**
   * Check if currently listening
   */
  isListening(): boolean {
    return this.listening;
  }

  /**
   * Add event listener
   */
  addEventListener(type: ASREventType, listener: ASREventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(type: ASREventType, listener: ASREventListener): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit event to listeners
   */
  protected emit(event: ASREvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }

  /**
   * Helper to emit result event
   */
  protected emitResult(result: ASRResult): void {
    this.emit({
      type: result.isFinal ? ASREventType.RESULT : ASREventType.PARTIAL_RESULT,
      data: result,
    });
  }

  /**
   * Helper to emit error event
   */
  protected emitError(error: Error): void {
    this.emit({
      type: ASREventType.ERROR,
      error,
    });
  }

  /**
   * Helper to emit started event
   */
  protected emitStarted(): void {
    this.emit({
      type: ASREventType.STARTED,
    });
  }

  /**
   * Helper to emit stopped event
   */
  protected emitStopped(): void {
    this.emit({
      type: ASREventType.STOPPED,
    });
  }
}
