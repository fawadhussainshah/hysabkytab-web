/** True when the stored value is an S3 object key (not http(s) or a data URL). */
export function needsSignedUrl(value: string): boolean {
  if (/^https?:\/\//i.test(value)) return false;
  if (value.startsWith("data:")) return false;
  return true;
}
