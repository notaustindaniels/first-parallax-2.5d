/**
 * Measure the duration of an audio file in seconds.
 * Uses the Web Audio API — only valid in a browser / Chromium context
 * (i.e., inside calculateMetadata, Remotion Studio, or the render pipeline).
 */
export async function getAudioDuration(src: string): Promise<number> {
  const res = await fetch(src);
  if (!res.ok) {
    throw new Error(`getAudioDuration: failed to fetch ${src} (${res.status})`);
  }
  const buffer = await res.arrayBuffer();

  return new Promise<number>((resolve, reject) => {
    const ctx = new AudioContext();
    ctx.decodeAudioData(
      buffer,
      (decoded) => {
        ctx.close();
        resolve(decoded.duration);
      },
      (err) => {
        ctx.close();
        reject(err);
      },
    );
  });
}
