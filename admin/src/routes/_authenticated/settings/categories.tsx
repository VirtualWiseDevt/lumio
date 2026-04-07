import { useState, useRef, useEffect } from "react";
import { createRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { authenticatedRoute } from "@/routes/_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/api/categories";
import type { Category } from "@/api/categories";
import axios from "axios";

export const categoriesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/categories",
  component: CategoriesPage,
});

function CategoriesPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
      setNewCategoryName("");
      setShowAddForm(false);
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error("Category already exists");
      } else {
        toast.error("Failed to create category");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateCategory(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated");
      setEditingId(null);
      setEditingName("");
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error("Category already exists");
      } else {
        toast.error("Failed to update category");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Failed to delete category");
    },
  });

  useEffect(() => {
    if (showAddForm && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [showAddForm]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed);
  }

  function handleEditStart(category: Category) {
    setEditingId(category.id);
    setEditingName(category.name);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const trimmed = editingName.trim();
    if (!trimmed) return;
    updateMutation.mutate({ id: editingId, name: trimmed });
  }

  function handleEditCancel() {
    setEditingId(null);
    setEditingName("");
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      handleEditCancel();
    }
  }

  function handleAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setShowAddForm(false);
      setNewCategoryName("");
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function slugify(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  return (
    <PageContainer title="Categories">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Manage content categories and genres
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        <div className="rounded-md border border-border">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_140px_80px] gap-4 border-b border-border bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
            <span>Name</span>
            <span>Slug</span>
            <span>Created</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Add form row */}
          {showAddForm && (
            <form
              onSubmit={handleAddSubmit}
              className="grid grid-cols-[1fr_1fr_140px_80px] items-center gap-4 border-b border-border bg-muted/30 px-4 py-2"
            >
              <Input
                ref={addInputRef}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="h-8"
                onKeyDown={handleAddKeyDown}
                disabled={createMutation.isPending}
              />
              <span className="text-sm text-muted-foreground">
                {newCategoryName.trim()
                  ? slugify(newCategoryName)
                  : "--"}
              </span>
              <span />
              <div className="flex justify-end gap-1">
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={
                    !newCategoryName.trim() || createMutation.isPending
                  }
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCategoryName("");
                  }}
                  disabled={createMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-0">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_1fr_140px_80px] gap-4 border-b border-border px-4 py-3"
                >
                  <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-16 animate-pulse rounded bg-muted ml-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && categories && categories.length === 0 && !showAddForm && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No categories yet. Create your first category to organize content.
            </div>
          )}

          {/* Category rows */}
          {categories?.map((category) => (
            <div
              key={category.id}
              className="grid grid-cols-[1fr_1fr_140px_80px] items-center gap-4 border-b border-border px-4 py-2 last:border-b-0"
            >
              {editingId === category.id ? (
                <form
                  onSubmit={handleEditSubmit}
                  className="flex items-center gap-1"
                >
                  <Input
                    ref={editInputRef}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-8"
                    onKeyDown={handleEditKeyDown}
                    disabled={updateMutation.isPending}
                  />
                </form>
              ) : (
                <span className="text-sm font-medium">{category.name}</span>
              )}

              <span className="text-sm text-muted-foreground">
                {editingId === category.id && editingName.trim()
                  ? slugify(editingName)
                  : category.slug}
              </span>

              <span className="text-sm text-muted-foreground">
                {formatDate(category.createdAt)}
              </span>

              <div className="flex justify-end gap-1">
                {editingId === category.id ? (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleEditSubmit}
                      disabled={
                        !editingName.trim() || updateMutation.isPending
                      }
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleEditCancel}
                      disabled={updateMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleEditStart(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete category &ldquo;{deleteTarget?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This won&apos;t remove the category from existing content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.id);
                }
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
