import { Badge } from "@/components/ui/badge";

interface TranscodingBadgeProps {
  status: string | null | undefined;
  error?: string | null;
}

export function TranscodingBadge({ status, error }: TranscodingBadgeProps) {
  if (!status) return null;

  switch (status) {
    case "pending":
      return (
        <Badge className="bg-yellow-600/20 text-yellow-500 border-yellow-600/30">
          Pending
        </Badge>
      );
    case "processing":
      return (
        <Badge className="animate-pulse bg-blue-600/20 text-blue-400 border-blue-600/30">
          Processing
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-green-600/20 text-green-500 border-green-600/30">
          Ready
        </Badge>
      );
    case "failed":
      return (
        <Badge
          className="bg-red-600/20 text-red-500 border-red-600/30"
          title={error ?? "Transcoding failed"}
        >
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      );
  }
}
