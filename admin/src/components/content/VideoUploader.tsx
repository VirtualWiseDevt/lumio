import { useState, useRef } from "react";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadVideo } from "@/api/video-upload";
import { TranscodingBadge } from "./TranscodingBadge";

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
const ACCEPTED_TYPES = [
  "video/mp4",
  "video/x-matroska",
  "video/quicktime",
];
const ACCEPTED_EXTENSIONS = ".mp4,.mkv,.mov";

type UploadState = "idle" | "uploading" | "uploaded" | "error";

interface VideoUploaderProps {
  contentId: string;
  episodeId?: string;
  currentKey?: string | null;
  transcodingStatus?: string | null;
  transcodingError?: string | null;
  onUploadComplete?: (key: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function extractFilename(key: string): string {
  return key.split("/").pop() ?? key;
}

export function VideoUploader({
  contentId,
  episodeId,
  currentKey,
  transcodingStatus,
  transcodingError,
  onUploadComplete,
}: VideoUploaderProps) {
  const [state, setState] = useState<UploadState>(
    currentKey ? "uploaded" : "idle",
  );
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMessage("Unsupported file type. Use MP4, MKV, or MOV.");
      setState("error");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(
        `File too large (${formatFileSize(file.size)}). Maximum is 5 GB.`,
      );
      setState("error");
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setProgress(0);
    setState("uploading");

    try {
      const { key } = await uploadVideo(file, contentId, episodeId, (percent) => {
        setProgress(percent);
      });

      setState("uploaded");
      toast.success("Video uploaded successfully");
      onUploadComplete?.(key);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setErrorMessage(message);
      setState("error");
      toast.error("Video upload failed");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Video File</span>
        {transcodingStatus && (
          <TranscodingBadge
            status={transcodingStatus}
            error={transcodingError}
          />
        )}
      </div>

      <div className="rounded-lg border border-dashed border-border p-4">
        {state === "idle" && (
          <div className="flex flex-col items-center gap-3 py-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Select a video file to upload
              </p>
              <p className="text-xs text-muted-foreground">
                MP4, MKV, or MOV up to 5 GB
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
          </div>
        )}

        {state === "uploading" && selectedFile && (
          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Uploading... {progress}% ({formatFileSize(selectedFile.size)})
                </p>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {state === "uploaded" && (
          <div className="flex items-center gap-3 py-2">
            <CheckCircle2 className="h-8 w-8 shrink-0 text-green-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Video uploaded</p>
              <p className="truncate text-xs text-muted-foreground">
                {currentKey
                  ? extractFilename(currentKey)
                  : selectedFile
                    ? selectedFile.name
                    : "Source video ready"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Replace
            </Button>
          </div>
        )}

        {state === "error" && (
          <div className="flex items-center gap-3 py-2">
            <AlertCircle className="h-8 w-8 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-destructive">
                Upload failed
              </p>
              <p className="text-xs text-muted-foreground">
                {errorMessage ?? "An unknown error occurred"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Try Again
            </Button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
