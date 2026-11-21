/**
 * Audio conversion utilities for Gemini Live API
 * - Input: 16kHz 16-bit Mono PCM
 * - Output: 24kHz 16-bit Mono PCM
 */

/**
 * Converts Float32Array audio buffer to 16-bit integer PCM ArrayBuffer
 */
export function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new DataView(new ArrayBuffer(input.length * 2));
  for (let i = 0; i < input.length; i++) {
    // Clamp sample between -1 and 1
    const s = Math.max(-1, Math.min(1, input[i]));
    // Scale to signed 16-bit range (-32768 to 32767)
    output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return output.buffer;
}

/**
 * Resamples audio buffer from source sample rate to target sample rate (linear interpolation)
 */
export function resampleAudioBuffer(
  buffer: Float32Array,
  fromSampleRate: number,
  toSampleRate: number
): Float32Array {
  if (fromSampleRate === toSampleRate) {
    return buffer;
  }
  const ratio = fromSampleRate / toSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const originPos = i * ratio;
    const index = Math.floor(originPos);
    const fraction = originPos - index;

    const sample1 = buffer[index] || 0;
    const sample2 = buffer[index + 1] !== undefined ? buffer[index + 1] : sample1;

    result[i] = sample1 + fraction * (sample2 - sample1);
  }
  return result;
}

/**
 * Converts ArrayBuffer (or Uint8Array) to Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 0x8000; // 32k chunking to avoid call stack limits

  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Converts Base64 encoded 16-bit PCM little-endian data to Float32Array
 */
export function base64ToFloat32Array(base64: string): Float32Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const dataView = new DataView(bytes.buffer);
  const sampleCount = Math.floor(bytes.length / 2);
  const float32 = new Float32Array(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    const int16 = dataView.getInt16(i * 2, true);
    // Convert -32768..32767 to -1.0..1.0
    float32[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
  }

  return float32;
}
