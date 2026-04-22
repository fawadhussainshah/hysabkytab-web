/**
 * Resize large photos in the browser before S3 upload (smaller payload, faster PUT).
 * Falls back to the original file if decoding fails (e.g. some HEIC on older browsers).
 */
export async function compressImageForUpload(
  file: File,
  maxEdge = 1280,
  quality = 0.78,
): Promise<{ blob: Blob; contentType: string }> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return { blob: file, contentType: file.type || "application/octet-stream" };
  }

  try {
    const bitmap = await createImageBitmap(file);
    try {
      let w = bitmap.width;
      let h = bitmap.height;
      const longest = Math.max(w, h);
      const scale = longest > maxEdge ? maxEdge / longest : 1;
      w = Math.round(w * scale);
      h = Math.round(h * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return { blob: file, contentType: file.type };
      }
      ctx.drawImage(bitmap, 0, 0, w, h);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
          "image/jpeg",
          quality,
        );
      });
      return { blob, contentType: "image/jpeg" };
    } finally {
      bitmap.close();
    }
  } catch {
    return { blob: file, contentType: file.type || "image/jpeg" };
  }
}
