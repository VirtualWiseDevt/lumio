import { ContentCard } from "./ContentCard";
import type { Content } from "@/api/content";

interface ContentGridProps {
  data: Content[];
  onEdit: (content: Content) => void;
  onDelete: (content: Content) => void;
}

export function ContentGrid({ data, onEdit, onDelete }: ContentGridProps) {
  if (data.length === 0) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border">
        <p className="text-muted-foreground">No content found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {data.map((content) => (
        <ContentCard
          key={content.id}
          content={content}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
