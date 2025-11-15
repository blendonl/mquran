export interface ASRResult {
  text: string;
  words: string[];
  confidence: number;
  isFinal: boolean;
  timestamp: number;
}

export interface ASRConfig {
  language: string;
  sampleRate: number;
  encoding: string;
  modelPath?: string;
}

export interface ASRService {
  initialize(config: ASRConfig): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  processAudio(audioData: ArrayBuffer): Promise<ASRResult | null>;
  isListening(): boolean;
  destroy(): Promise<void>;
}

export enum ASREventType {
  STARTED = 'started',
  STOPPED = 'stopped',
  RESULT = 'result',
  ERROR = 'error',
  PARTIAL_RESULT = 'partialResult',
}

export interface ASREvent {
  type: ASREventType;
  data?: any;
  error?: Error;
}

export type ASREventListener = (event: ASREvent) => void;
