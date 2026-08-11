import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

interface ImageUploadProps {
  label: string;
  hint?: string;
  required?: boolean;
  multiple?: boolean;
  // Existing stored image URL shown as the "Current" preview (edit mode).
  currentSrc?: string;
  // Newly selected files to upload.
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  // Aspect classes for the preview tiles (defaults to a portrait poster).
  previewClassName?: string;
}

interface Preview {
  url: string;
  name: string;
}

const DEFAULT_PREVIEW_CLASS = "w-20 h-28";

export default function ImageUpload({
  label,
  hint,
  required,
  multiple = false,
  currentSrc,
  files,
  onChange,
  disabled,
  previewClassName = DEFAULT_PREVIEW_CLASS,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const nextFiles = multiple ? [...files, ...selected] : selected.slice(0, 1);
    const urls = nextFiles.map((file) => URL.createObjectURL(file));
    onChange(nextFiles);
    setPreviews(
      nextFiles.map((file, index) => ({ url: urls[index], name: file.name })),
    );
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (index: number) => {
    const removed = previews[index];
    if (removed) URL.revokeObjectURL(removed.url);
    onChange(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="flex flex-wrap gap-3">
        {currentSrc && files.length === 0 && (
          <div
            className={`relative ${previewClassName} rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shrink-0`}
          >
            <img
              src={currentSrc}
              alt="Current"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[9px] text-center text-slate-300 py-0.5">
              Current
            </span>
          </div>
        )}

        {previews.map((preview, index) => (
          <div
            key={preview.url}
            className={`relative ${previewClassName} rounded-lg overflow-hidden border border-red-600/40 bg-slate-950 shrink-0`}
          >
            <img
              src={preview.url}
              alt={preview.name}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              title="Remove image"
              className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 text-white hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={`${previewClassName} rounded-lg border border-dashed border-slate-700 hover:border-red-600/50 bg-slate-950/40 flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-white transition-colors disabled:opacity-50`}
        >
          <ImagePlus className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Upload</span>
        </button>
      </div>

      {hint && <p className="text-slate-600 text-[11px] mt-1.5">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={handleSelect}
      />
    </div>
  );
}
