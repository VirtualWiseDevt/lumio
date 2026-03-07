import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  uploadPoster,
  uploadBackdrop,
  type ImagePaths,
} from "@/api/upload";

interface ImageUploaderProps {
  type: "poster" | "backdrop";
  value: ImagePaths | null;
  onChange: (paths: ImagePaths | null) => void;
  label: string;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export function ImageUploader({
  type,
  value,
  onChange,
  label,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const uploadFn = type === "poster" ? uploadPoster : uploadBackdrop;
        const result = await uploadFn(file);
        onChange(result.paths);
        toast.success(`${label} uploaded successfully`);
      } catch {
        toast.error(`Failed to upload ${label.toLowerCase()}`);
      } finally {
        setIsUploading(false);
      }
    },
    [type, onChange, label],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: isUploading,
    onDropRejected: (rejections) => {
      const error = rejections[0]?.errors[0];
      if (error?.code === "file-too-large") {
        toast.error("File is too large. Maximum size is 10MB.");
      } else if (error?.code === "file-invalid-type") {
        toast.error("Invalid file type. Use JPEG, PNG, or WebP.");
      } else {
        toast.error("File rejected. Please try another.");
      }
    },
  });

  const handleReplace = () => {
    onChange(null);
  };

  const previewSrc = value
    ? `/api/media/${value.thumbnail ?? value.medium}`
    : null;

  const aspectClass =
    type === "poster" ? "aspect-[2/3]" : "aspect-[16/9]";
  const aspectHint =
    type === "poster" ? "2:3 portrait" : "16:9 landscape";

  // Uploaded state: show preview
  if (value && previewSrc) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
        <div className="relative inline-block">
          <div
            className={`${aspectClass} w-full max-w-[200px] overflow-hidden rounded-lg border border-border`}
          >
            <img
              src={previewSrc}
              alt={label}
              className="h-full w-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -right-2 -top-2 h-7 w-7 rounded-full p-0"
            onClick={handleReplace}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Uploading state
  if (isUploading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
        <div
          className={`${aspectClass} flex max-w-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50`}
        >
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">Uploading...</p>
        </div>
      </div>
    );
  }

  // Idle / drag-and-drop state
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div
        {...getRootProps()}
        className={`${aspectClass} flex max-w-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/25 bg-muted/50 hover:border-muted-foreground/50"
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <>
            <Upload className="h-8 w-8 text-primary" />
            <p className="mt-2 text-xs text-primary">Drop image here</p>
          </>
        ) : (
          <>
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Drag & drop or click
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground/60">
              {aspectHint}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
