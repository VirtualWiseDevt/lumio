import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { Search, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { authenticatedRoute } from "@/routes/_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";
import { Pagination } from "@/components/shared/Pagination";
import { UserStatsCards } from "@/components/users/UserStatsCards";
import { UserTable } from "@/components/users/UserTable";
import { UserForm } from "@/components/users/UserForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  listUsers,
  deleteUser,
  getUserSessions,
  deleteUserSession,
} from "@/api/users";
import type { AdminUser, UserSession } from "@/api/users";
import { exportToCsv } from "@/lib/csv-export";

const PAGE_SIZE = 20;

export const usersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/users",
  component: UsersPage,
});

function UsersPage() {
  const queryClient = useQueryClient();

  // Filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // UI state
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [sessionsUser, setSessionsUser] = useState<AdminUser | null>(null);

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Query users
  const isActiveParam =
    statusFilter === "active"
      ? true
      : statusFilter === "inactive"
        ? false
        : undefined;

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin-users",
      debouncedSearch,
      statusFilter,
      page,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      listUsers({
        search: debouncedSearch || undefined,
        isActive: isActiveParam,
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortOrder,
      }),
  });

  // Stats: derive from a separate query with no pagination
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-users-stats"],
    queryFn: async () => {
      const [all, active, admins] = await Promise.all([
        listUsers({ limit: 1 }),
        listUsers({ limit: 1, isActive: true }),
        listUsers({ limit: 1, role: "ADMIN" }),
      ]);
      return {
        totalUsers: all.total,
        activeUsers: active.total,
        adminUsers: admins.total,
      };
    },
  });

  // Sessions query
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["admin-user-sessions", sessionsUser?.id],
    queryFn: () => getUserSessions(sessionsUser!.id),
    enabled: sessionsUser !== null,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success("User deactivated successfully");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Failed to delete user");
    },
  });

  // Terminate session mutation
  const terminateSessionMutation = useMutation({
    mutationFn: ({
      userId,
      sessionId,
    }: {
      userId: string;
      sessionId: string;
    }) => deleteUserSession(userId, sessionId),
    onSuccess: () => {
      toast.success("Session terminated");
      void queryClient.invalidateQueries({ queryKey: ["admin-user-sessions"] });
    },
    onError: () => {
      toast.error("Failed to terminate session");
    },
  });

  // Sorting
  const sorting: SortingState = useMemo(
    () => [{ id: sortBy, desc: sortOrder === "desc" }],
    [sortBy, sortOrder],
  );

  const handleSortingChange = useCallback((newSorting: SortingState) => {
    if (newSorting.length > 0) {
      setSortBy(newSorting[0].id);
      setSortOrder(newSorting[0].desc ? "desc" : "asc");
    }
  }, []);

  // CSV export
  const handleExport = useCallback(() => {
    if (!data?.data.length) {
      toast.error("No data to export");
      return;
    }
    exportToCsv(
      data.data,
      [
        { key: "name", header: "Name" },
        { key: "email", header: "Email" },
        { key: "phone", header: "Phone" },
        { key: "role", header: "Role" },
        { key: "isActive", header: "Active" },
        { key: "createdAt", header: "Created" },
      ],
      "users",
    );
    toast.success("Users exported to CSV");
  }, [data?.data]);

  // Form handlers
  const handleAdd = useCallback(() => {
    setEditUser(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((user: AdminUser) => {
    setEditUser(user);
    setShowForm(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setEditUser(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setEditUser(null);
  }, []);

  return (
    <PageContainer title="Users">
      <div className="space-y-6">
        {/* Stats */}
        <UserStatsCards
          totalUsers={statsData?.totalUsers ?? 0}
          activeUsers={statsData?.activeUsers ?? 0}
          adminUsers={statsData?.adminUsers ?? 0}
          loading={statsLoading}
        />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>

          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Table */}
        <UserTable
          data={data?.data ?? []}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onViewSessions={setSessionsUser}
        />

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Add/Edit Form */}
      <UserForm
        user={editUser}
        open={showForm}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &quot;{deleteTarget?.name}
              &quot;? This will disable their account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sessions Dialog */}
      <Dialog
        open={sessionsUser !== null}
        onOpenChange={(open) => !open && setSessionsUser(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Sessions for {sessionsUser?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {sessionsLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading sessions...
              </p>
            ) : sessions && sessions.length > 0 ? (
              sessions.map((session: UserSession) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {session.deviceName ?? "Unknown Device"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {session.deviceType && (
                        <Badge variant="outline" className="text-xs">
                          {session.deviceType}
                        </Badge>
                      )}
                      {session.ipAddress && <span>{session.ipAddress}</span>}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      terminateSessionMutation.mutate({
                        userId: sessionsUser!.id,
                        sessionId: session.id,
                      })
                    }
                    disabled={terminateSessionMutation.isPending}
                  >
                    Terminate
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No active sessions
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
