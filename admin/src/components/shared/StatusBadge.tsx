import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  isPublished: boolean;
  className?: string;
}

export function StatusBadge({ isPublished, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        isPublished
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
        className,
      )}
    >
      {isPublished ? "Published" : "Draft"}
    </Badge>
  );
}
