import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSettings, updateSettings } from "@/api/settings";

const LIMIT_KEYS = [
  "limits.maxDevices",
  "limits.maxInviteCodes",
] as const;

interface LimitFormValues {
  maxDevices: string;
  maxInviteCodes: string;
}

export function LimitSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "limits"],
    queryFn: () => getSettings([...LIMIT_KEYS]),
  });

  const { register, handleSubmit, reset } = useForm<LimitFormValues>({
    defaultValues: {
      maxDevices: "",
      maxInviteCodes: "",
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        maxDevices: String(settings["limits.maxDevices"] ?? ""),
        maxInviteCodes: String(settings["limits.maxInviteCodes"] ?? ""),
      });
    }
  }, [settings, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: LimitFormValues) =>
      updateSettings({
        "limits.maxDevices": values.maxDevices,
        "limits.maxInviteCodes": values.maxInviteCodes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "limits"] });
      toast.success("Limit settings saved");
    },
    onError: () => {
      toast.error("Failed to save limit settings");
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Limits</CardTitle>
        <CardDescription>
          Configure device and invite code limits per user
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxDevices">Max Devices per User</Label>
              <Input
                id="maxDevices"
                type="number"
                min="1"
                step="1"
                {...register("maxDevices")}
                placeholder="e.g. 3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxInviteCodes">Max Invite Codes</Label>
              <Input
                id="maxInviteCodes"
                type="number"
                min="0"
                step="1"
                {...register("maxInviteCodes")}
                placeholder="e.g. 5"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={saveMutation.isPending} className="bg-amber-600 text-white hover:bg-amber-700">
              {saveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
