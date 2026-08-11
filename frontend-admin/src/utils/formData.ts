// Converts a payload object into multipart FormData for image uploads.
// - `imageFiles` / `galleryFiles` File[] are re-keyed to `images` / `gallery`
//   so they land in the right multer field on the backend.
// - Arrays are joined as comma-separated strings.
// - Nested objects (e.g. cinema `address`, `location`) are JSON-stringified
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
      fd.append(key, (value as unknown[]).join(", "));
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
