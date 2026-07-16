export function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededWave(seed: string, bucket: number, amplitude = 1) {
  const base = hashString(`${seed}:${bucket}`);
  const angle = (base % 360) * (Math.PI / 180);
  const slowAngle = ((bucket + (base % 97)) % 360) * (Math.PI / 180);
  return (Math.sin(angle) * 0.7 + Math.cos(slowAngle) * 0.3) * amplitude;
}

export function currentBucket(intervalMs = 30_000) {
  return Math.floor(Date.now() / intervalMs);
}
