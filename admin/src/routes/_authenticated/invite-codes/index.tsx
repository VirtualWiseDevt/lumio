import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Copy, Loader2 } from "lucide-react";
import { authenticatedRoute } from "@/routes/_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  listInviteCodes,
  createInviteCode,
  toggleInviteCode,
} from "@/api/invite-codes";
import type { InviteCode } from "@/api/invite-codes";

export const inviteCodesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/invite-codes",
  component: InviteCodesPage,
});

function InviteCodesPage() {
  const queryClient = useQueryClient();
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [maxUses, setMaxUses] = useState(1);

  const { data: codes, isLoading } = useQuery({
    queryKey: ["invite-codes"],
    queryFn: listInviteCodes,
  });

  const createMutation = useMutation({
    mutationFn: (maxUses: number) => createInviteCode(maxUses),
    onSuccess: (newCode) => {
      void queryClient.invalidateQueries({ queryKey: ["invite-codes"] });
      toast.success(`Invite code ${newCode.code} created`);
      setShowGenerateDialog(false);
      setMaxUses(1);
    },
    onError: () => {
      toast.error("Failed to create invite code");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleInviteCode(id, isActive),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["invite-codes"] });
      toast.success(
        `Code ${updated.isActive ? "activated" : "deactivated"}`,
      );
    },
    onError: () => {
      toast.error("Failed to update invite code");
    },
  });

  async function handleCopyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard");
    } catch {
      toast.error("Failed to copy code");
    }
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(maxUses);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <PageContainer title="Invite Codes">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Generate and manage invite codes for bootstrapping users
          </p>
          <Button
            size="sm"
            onClick={() => setShowGenerateDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate Code
          </Button>
        </div>

        <div className="rounded-md border border-border">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_80px_100px_100px_160px_100px] gap-4 border-b border-border bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
            <span>Code</span>
            <span>Max Uses</span>
            <span>Used</span>
            <span>Remaining</span>
            <span>Status</span>
            <span>Created</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-0">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_80px_80px_100px_100px_160px_100px] gap-4 border-b border-border px-4 py-3"
                >
                  <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-10 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-10 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-10 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-16 animate-pulse rounded bg-muted ml-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && codes && codes.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No invite codes yet. Generate your first code to start inviting users.
            </div>
          )}

          {/* Code rows */}
          {codes?.map((code: InviteCode) => (
            <div
              key={code.id}
              className="grid grid-cols-[1fr_80px_80px_100px_100px_160px_100px] items-center gap-4 border-b border-border px-4 py-2 last:border-b-0"
            >
              <button
                type="button"
                className="flex items-center gap-2 text-left"
                onClick={() => void handleCopyCode(code.code)}
                title="Click to copy"
              >
                <code className="font-mono text-sm font-semibold">
                  {code.code}
                </code>
                <Copy className="h-3 w-3 text-muted-foreground" />
              </button>

              <span className="text-sm">{code.maxUses}</span>
              <span className="text-sm">{code.usedCount}</span>
              <span className="text-sm">
                {code.maxUses - code.usedCount}
              </span>

              <div>
                <Badge
                  variant={code.isActive ? "default" : "secondary"}
                >
                  {code.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <span className="text-sm text-muted-foreground">
                {formatDate(code.createdAt)}
              </span>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    toggleMutation.mutate({
                      id: code.id,
                      isActive: !code.isActive,
                    })
                  }
                  disabled={toggleMutation.isPending}
                >
                  {code.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invite Code</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGenerate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min={1}
                  max={1000}
                  value={maxUses}
                  onChange={(e) => setMaxUses(parseInt(e.target.value, 10) || 1)}
                />
                <p className="text-xs text-muted-foreground">
                  How many times this code can be used to register
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowGenerateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
