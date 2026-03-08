import { Users, UserCheck, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface UserStatsCardsProps {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  loading: boolean;
}

const stats = [
  { key: "total", label: "Total Users", icon: Users },
  { key: "active", label: "Active Users", icon: UserCheck },
  { key: "admin", label: "Admin Users", icon: Shield },
] as const;

export function UserStatsCards({
  totalUsers,
  activeUsers,
  adminUsers,
  loading,
}: UserStatsCardsProps) {
  const values: Record<string, number> = {
    total: totalUsers,
    active: activeUsers,
    admin: adminUsers,
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{values[s.key]}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
