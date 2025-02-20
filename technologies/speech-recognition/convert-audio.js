// Convert WebM to WAV using Web Audio API
async function convertToWav(oggBlob) {
    const audioCtx = new AudioContext();
    const arrayBuffer = await oggBlob.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  
    // Create WAV file from AudioBuffer
    return audioBufferToWav(audioBuffer);
  }
  
  // Convert AudioBuffer to WAV Blob
  function audioBufferToWav(audioBuffer) {
    const sampleRate = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;
    const numFrames = audioBuffer.length;
    const bytesPerSample = 2; // 16-bit PCM
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const wavHeaderSize = 44;
    const dataSize = numFrames * blockAlign;
    const buffer = new ArrayBuffer(wavHeaderSize + dataSize);
    const view = new DataView(buffer);
  
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);
  
    const floatToPCM = (output, offset, input) => {
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    };
  
    let offset = wavHeaderSize;
    for (let ch = 0; ch < numChannels; ch++) {
        floatToPCM(view, offset + ch * 2, audioBuffer.getChannelData(ch));
    }
  
    return new Blob([buffer], { type: "audio/wav" });
  }
  
  // Helper function to write strings in WAV header
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
  }