// Builds multipart FormData for image uploads. File arrays are re-keyed to
// their multer field names, primitive arrays are comma-joined for `toArray`,
// and nested objects/arrays are JSON-stringified for server-side parsing.
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
