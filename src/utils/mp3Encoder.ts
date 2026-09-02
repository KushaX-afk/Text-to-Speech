import * as lamejs from 'lamejs';

/**
 * Converts a WAV audio URL or Base64 data URL into an MP3 Blob
 * using pure client-side LAME MP3 encoding.
 */
export async function convertWavToMp3Blob(audioUrl: string): Promise<Blob> {
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  
  // Create MP3 encoder (128kbps stereo or mono)
  const Mp3Encoder = (lamejs as any).Mp3Encoder || (lamejs as any).default?.Mp3Encoder;
  const mp3encoder = new Mp3Encoder(channels, sampleRate, 128);

  const samplesLeft = audioBuffer.getChannelData(0);
  const samplesRight = channels > 1 ? audioBuffer.getChannelData(1) : samplesLeft;

  const sampleCount = samplesLeft.length;
  const leftInt16 = new Int16Array(sampleCount);
  const rightInt16 = new Int16Array(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    const sL = Math.max(-1, Math.min(1, samplesLeft[i]));
    leftInt16[i] = sL < 0 ? sL * 0x8000 : sL * 0x7fff;

    const sR = Math.max(-1, Math.min(1, samplesRight[i]));
    rightInt16[i] = sR < 0 ? sR * 0x8000 : sR * 0x7fff;
  }

  const mp3Data: Uint8Array[] = [];
  const sampleBlockSize = 1152;

  for (let i = 0; i < sampleCount; i += sampleBlockSize) {
    const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
    let mp3buf: any;
    if (channels === 1) {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    } else {
      const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    }
    if (mp3buf && mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }
  }

  const flushBuf = mp3encoder.flush();
  if (flushBuf && flushBuf.length > 0) {
    mp3Data.push(new Uint8Array(flushBuf));
  }

  await audioContext.close();

  return new Blob(mp3Data as any, { type: 'audio/mp3' });
}
