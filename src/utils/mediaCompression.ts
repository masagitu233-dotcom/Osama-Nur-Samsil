/**
 * Client-side image compression before uploading to Firebase Storage.
 * Keeps PNG/JPEG/WebP under optimal dimensions and size without losing visual sharpness.
 */
export async function compressImageIfNeeded(
  file: File,
  maxWidth = 1600,
  quality = 0.84
): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  // Skip compression for small images (< 300KB)
  if (file.size < 300 * 1024) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const targetMime = file.type === 'image/png' ? 'image/webp' : file.type;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((result) => resolve(result), targetMime, quality)
    );

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const ext = targetMime === 'image/webp' ? '.webp' : targetMime === 'image/png' ? '.png' : '.jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}${ext}`, { type: targetMime });
  } catch {
    return file;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
