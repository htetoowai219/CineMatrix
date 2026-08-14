// Converts a payload object into multipart FormData for image uploads.
// - `imageFiles` / `galleryFiles` File[] are re-keyed to `images` / `gallery`
//   so they land in the right multer field on the backend.
// - Arrays of primitives (e.g. image URLs, genres) are joined as
//   comma-separated strings so the backend `toArray` can split them.
// - Nested objects and arrays-of-objects (e.g. cinema `rooms`, whose each room
//   contains a nested `grid` array, and `announcements`) are JSON-stringified
//   and parsed back on the server.
export const toFormData = (payload: Record<string, unknown>): FormData => {
  const fd = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === "imageFiles" && Array.isArray(value)) {
      (value as File[]).forEach((file) => fd.append("images", file));
      return;
    }
    if (key === "galleryFiles" && Array.isArray(value)) {
      (value as File[]).forEach((file) => fd.append("gallery", file));
      return;
    }
    if (value instanceof File) {
      fd.append(key, value);
      return;
    }
    if (Array.isArray(value)) {
      const hasNested = value.some(
        (item) => typeof item === "object" && item !== null,
      );
      fd.append(
        key,
        hasNested ? JSON.stringify(value) : (value as unknown[]).join(", "),
      );
      return;
    }
    if (typeof value === "object") {
      fd.append(key, JSON.stringify(value));
      return;
    }
    fd.append(key, String(value));
  });

  return fd;
};
