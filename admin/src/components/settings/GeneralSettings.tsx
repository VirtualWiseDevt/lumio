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

const GENERAL_KEYS = ["general.siteName", "general.supportEmail"] as const;

interface GeneralFormValues {
  siteName: string;
  supportEmail: string;
}

export function GeneralSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "general"],
    queryFn: () => getSettings([...GENERAL_KEYS]),
  });

  const { register, handleSubmit, reset } = useForm<GeneralFormValues>({
    defaultValues: {
      siteName: "",
      supportEmail: "",
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        siteName: (settings["general.siteName"] as string) || "",
        supportEmail: (settings["general.supportEmail"] as string) || "",
      });
    }
  }, [settings, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: GeneralFormValues) =>
      updateSettings({
        "general.siteName": values.siteName,
        "general.supportEmail": values.supportEmail,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "general"] });
      toast.success("General settings saved");
    },
    onError: () => {
      toast.error("Failed to save general settings");
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
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
        <CardTitle>General</CardTitle>
        <CardDescription>
          Basic platform settings and contact information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                {...register("siteName")}
                placeholder="Lumio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                {...register("supportEmail")}
                placeholder="support@lumio.app"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={saveMutation.isPending}>
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
