import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUser, updateUser } from "@/api/users";
import type { AdminUser } from "@/api/users";

const userFormSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    phone: z
      .string()
      .min(1, "Phone is required")
      .regex(
        /^(?:\+254|0)[17]\d{8}$/,
        "Must be a valid Kenyan phone number (e.g. +254712345678 or 0712345678)",
      ),
    password: z.string().optional(),
    role: z.enum(["USER", "ADMIN"]),
    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.password && !(data as { _isEdit?: boolean })._isEdit) {
      // Password requirement is enforced at submission level for create mode
    }
    return data;
  });

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserForm({ user, open, onClose, onSuccess }: UserFormProps) {
  const isEdit = user !== null;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      password: "",
      role: user?.role ?? "USER",
      isActive: user?.isActive ?? true,
    },
  });

  const role = watch("role");
  const isActive = watch("isActive");

  const createMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      createUser({
        name: values.name,
        email: values.email,
        password: values.password!,
        phone: values.phone,
        role: values.role,
      }),
    onSuccess: () => {
      toast.success("User created successfully");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      reset();
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to create user");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      updateUser(user!.id, {
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: values.role,
        isActive: values.isActive,
      }),
    onSuccess: () => {
      toast.success("User updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      reset();
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to update user");
    },
  });

  const onSubmit = (values: UserFormValues) => {
    if (!isEdit && !values.password) {
      toast.error("Password is required for new users");
      return;
    }
    if (isEdit) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Add User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="+254712345678"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password{isEdit ? " (leave blank to keep current)" : ""}
            </Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setValue("role", v as "USER" | "ADMIN")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isEdit && (
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(v) => setValue("isActive", v)}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
