package com.mquran.asr

import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import java.nio.FloatBuffer
import kotlin.math.sqrt

class QuranASRModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var ortEnvironment: OrtEnvironment? = null
    private var ortSession: OrtSession? = null
    private var audioRecord: AudioRecord? = null
    private var recordingJob: Job? = null
    private var isRecording = false

    private val scope = CoroutineScope(Dispatchers.Default)

    // Audio configuration
    private val sampleRate = 16000 // wav2vec2 expects 16kHz
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT
    private val bufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)

    companion object {
        const val NAME = "QuranASRModule"
        private const val AUDIO_CHUNK_DURATION_MS = 1000 // Process 1 second chunks
        private const val MIN_AUDIO_ENERGY = 0.01f // Minimum energy threshold for voice activity
    }

    override fun getName(): String = NAME

    /**
     * Initialize the ASR model
     */
    @ReactMethod
    fun initialize(modelPath: String, promise: Promise) {
        try {
            // Initialize ONNX Runtime
            ortEnvironment = OrtEnvironment.getEnvironment()

            // Load the model
            val sessionOptions = OrtSession.SessionOptions()
            sessionOptions.addConfigEntry("session.load_model_format", "ONNX")

            ortSession = ortEnvironment?.createSession(modelPath, sessionOptions)

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", "Failed to initialize ASR model: ${e.message}", e)
        }
    }

    /**
     * Start recording and processing audio
     */
    @ReactMethod
    fun startRecording(promise: Promise) {
        try {
            // Check permission
            if (ActivityCompat.checkSelfPermission(
                    reactApplicationContext,
                    Manifest.permission.RECORD_AUDIO
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                promise.reject("PERMISSION_ERROR", "Audio recording permission not granted")
                return
            }

            if (isRecording) {
                promise.reject("ALREADY_RECORDING", "Already recording")
                return
            }

            // Initialize AudioRecord
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                sampleRate,
                channelConfig,
                audioFormat,
                bufferSize * 2
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                promise.reject("AUDIO_INIT_ERROR", "Failed to initialize audio recorder")
                return
            }

            audioRecord?.startRecording()
            isRecording = true

            // Start processing audio in background
            recordingJob = scope.launch {
                processAudioStream()
            }

            sendEvent("onRecordingStarted", null)
            promise.resolve(true)

        } catch (e: Exception) {
            promise.reject("START_ERROR", "Failed to start recording: ${e.message}", e)
        }
    }

    /**
     * Stop recording
     */
    @ReactMethod
    fun stopRecording(promise: Promise) {
        try {
            isRecording = false
            recordingJob?.cancel()

            audioRecord?.stop()
            audioRecord?.release()
            audioRecord = null

            sendEvent("onRecordingStopped", null)
            promise.resolve(true)

        } catch (e: Exception) {
            promise.reject("STOP_ERROR", "Failed to stop recording: ${e.message}", e)
        }
    }

    /**
     * Process audio stream continuously
     */
    private suspend fun processAudioStream() {
        val chunkSize = (sampleRate * AUDIO_CHUNK_DURATION_MS) / 1000
        val audioBuffer = ShortArray(chunkSize)

        while (isRecording) {
            try {
                val bytesRead = audioRecord?.read(audioBuffer, 0, chunkSize) ?: 0

                if (bytesRead > 0) {
                    // Convert short array to float array normalized to [-1, 1]
                    val floatArray = FloatArray(bytesRead) { i ->
                        audioBuffer[i] / 32768.0f
                    }

                    // Check if audio has enough energy (voice activity detection)
                    if (hasVoiceActivity(floatArray)) {
                        // Process with ONNX model
                        val result = runInference(floatArray)
                        if (result != null) {
                            sendEvent("onASRResult", result)
                        }
                    }
                }
            } catch (e: Exception) {
                sendEvent("onASRError", Arguments.createMap().apply {
                    putString("error", e.message)
                })
            }
        }
    }

    /**
     * Run inference on audio chunk using ONNX Runtime
     */
    private fun runInference(audioData: FloatArray): WritableMap? {
        try {
            ortSession?.let { session ->
                ortEnvironment?.let { env ->
                    // Prepare input tensor
                    // wav2vec2 expects input shape: [batch_size, sequence_length]
                    val inputShape = longArrayOf(1, audioData.size.toLong())
                    val inputBuffer = FloatBuffer.wrap(audioData)
                    val inputTensor = OnnxTensor.createTensor(env, inputBuffer, inputShape)

                    // Run inference
                    val inputs = mapOf("input" to inputTensor)
                    val outputs = session.run(inputs)

                    // Process output
                    // This is a simplified version - actual processing depends on model output format
                    val output = outputs[0] as OnnxTensor
                    val outputData = output.floatBuffer.array()

                    // TODO: Decode output to text using tokenizer
                    // For now, return a placeholder
                    val result = Arguments.createMap()
                    result.putString("text", decodeOutput(outputData))
                    result.putDouble("confidence", 0.8) // Placeholder
                    result.putDouble("timestamp", System.currentTimeMillis().toDouble())

                    inputTensor.close()
                    outputs.close()

                    return result
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return null
    }

    /**
     * Simple voice activity detection based on audio energy
     */
    private fun hasVoiceActivity(audioData: FloatArray): Boolean {
        val energy = audioData.map { it * it }.average()
        val rms = sqrt(energy).toFloat()
        return rms > MIN_AUDIO_ENERGY
    }

    /**
     * Decode model output to text
     * TODO: Implement proper CTC decoding or use a tokenizer
     */
    private fun decodeOutput(output: FloatArray): String {
        // This is a placeholder - actual implementation needs:
        // 1. CTC decoding
        // 2. Tokenizer to convert token IDs to text
        // 3. Handling of special tokens
        return ""
    }

    /**
     * Send event to JavaScript
     */
    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    /**
     * Check if model is initialized
     */
    @ReactMethod
    fun isInitialized(promise: Promise) {
        promise.resolve(ortSession != null)
    }

    /**
     * Clean up resources
     */
    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        isRecording = false
        recordingJob?.cancel()
        audioRecord?.release()
        ortSession?.close()
        ortEnvironment?.close()
    }
}
