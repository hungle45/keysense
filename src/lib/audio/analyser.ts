export function createAnalyser(audioContext: AudioContext): AnalyserNode {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.8;
  return analyser;
}

export function getFrequencyData(
  analyser: AnalyserNode
): Float32Array {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  analyser.getFloatFrequencyData(dataArray);
  return dataArray;
}

export function getTimeDomainData(
  analyser: AnalyserNode
): Float32Array {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  analyser.getFloatTimeDomainData(dataArray);
  return dataArray;
}

export function calculateRMS(dataArray: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i] * dataArray[i];
  }
  return Math.sqrt(sum / dataArray.length);
}

export function rmsToDecibels(rms: number): number {
  return 20 * Math.log10(rms + 0.0001);
}
