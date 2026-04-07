import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-gray-900 px-6">
      <h2 className="text-lg font-semibold text-white">{title ?? "Dashboard"}</h2>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {user?.name ?? user?.email}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {user?.name
            ? user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : "A"}
        </div>
      </div>
    </header>
  );
}
