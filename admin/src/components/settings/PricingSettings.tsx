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

const PRICING_KEYS = [
  "pricing.weeklyPrice",
  "pricing.monthlyPrice",
  "pricing.quarterlyPrice",
] as const;

interface PricingFormValues {
  weeklyPrice: string;
  monthlyPrice: string;
  quarterlyPrice: string;
}

export function PricingSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "pricing"],
    queryFn: () => getSettings([...PRICING_KEYS]),
  });

  const { register, handleSubmit, reset } = useForm<PricingFormValues>({
    defaultValues: {
      weeklyPrice: "",
      monthlyPrice: "",
      quarterlyPrice: "",
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        weeklyPrice: String(settings["pricing.weeklyPrice"] ?? ""),
        monthlyPrice: String(settings["pricing.monthlyPrice"] ?? ""),
        quarterlyPrice: String(settings["pricing.quarterlyPrice"] ?? ""),
      });
    }
  }, [settings, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: PricingFormValues) =>
      updateSettings({
        "pricing.weeklyPrice": values.weeklyPrice,
        "pricing.monthlyPrice": values.monthlyPrice,
        "pricing.quarterlyPrice": values.quarterlyPrice,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "pricing"] });
      toast.success("Pricing settings saved");
    },
    onError: () => {
      toast.error("Failed to save pricing settings");
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
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
        <CardTitle>Pricing</CardTitle>
        <CardDescription>
          Configure subscription pricing tiers (in KES)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="weeklyPrice">Weekly Price (KES)</Label>
              <Input
                id="weeklyPrice"
                type="number"
                min="0"
                step="1"
                {...register("weeklyPrice")}
                placeholder="e.g. 100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyPrice">Monthly Price (KES)</Label>
              <Input
                id="monthlyPrice"
                type="number"
                min="0"
                step="1"
                {...register("monthlyPrice")}
                placeholder="e.g. 300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quarterlyPrice">Quarterly Price (KES)</Label>
              <Input
                id="quarterlyPrice"
                type="number"
                min="0"
                step="1"
                {...register("quarterlyPrice")}
                placeholder="e.g. 750"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            These values are for reference. Plan prices are managed in the
            database seed.
          </p>

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
