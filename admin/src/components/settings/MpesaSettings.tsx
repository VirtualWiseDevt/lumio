import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Wifi } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSettings,
  updateSettings,
  testMpesaConnection,
} from "@/api/settings";

const MPESA_KEYS = [
  "mpesa.consumerKey",
  "mpesa.consumerSecret",
  "mpesa.shortcode",
  "mpesa.passkey",
  "mpesa.callbackUrl",
  "mpesa.environment",
] as const;

interface MpesaFormValues {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
  environment: string;
}

export function MpesaSettings() {
  const queryClient = useQueryClient();
  const [isTesting, setIsTesting] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "mpesa"],
    queryFn: () => getSettings([...MPESA_KEYS]),
  });

  const { register, handleSubmit, setValue, watch, reset } =
    useForm<MpesaFormValues>({
      defaultValues: {
        consumerKey: "",
        consumerSecret: "",
        shortcode: "",
        passkey: "",
        callbackUrl: "",
        environment: "mock",
      },
    });

  const environment = watch("environment");

  useEffect(() => {
    if (settings) {
      reset({
        consumerKey: (settings["mpesa.consumerKey"] as string) || "",
        consumerSecret: (settings["mpesa.consumerSecret"] as string) || "",
        shortcode: (settings["mpesa.shortcode"] as string) || "",
        passkey: (settings["mpesa.passkey"] as string) || "",
        callbackUrl: (settings["mpesa.callbackUrl"] as string) || "",
        environment: (settings["mpesa.environment"] as string) || "mock",
      });
    }
  }, [settings, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: MpesaFormValues) => {
      const payload: Record<string, unknown> = {};
      // Only send values that are not masked (i.e., user changed them)
      if (!values.consumerKey.startsWith("****")) {
        payload["mpesa.consumerKey"] = values.consumerKey;
      }
      if (!values.consumerSecret.startsWith("****")) {
        payload["mpesa.consumerSecret"] = values.consumerSecret;
      }
      payload["mpesa.shortcode"] = values.shortcode;
      if (!values.passkey.startsWith("****")) {
        payload["mpesa.passkey"] = values.passkey;
      }
      payload["mpesa.callbackUrl"] = values.callbackUrl;
      payload["mpesa.environment"] = values.environment;
      return updateSettings(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "mpesa"] });
      toast.success("M-Pesa settings saved");
    },
    onError: () => {
      toast.error("Failed to save M-Pesa settings");
    },
  });

  async function handleTestConnection() {
    setIsTesting(true);
    try {
      const result = await testMpesaConnection();
      if (result.success) {
        toast.success(result.message || "Connection successful");
      } else {
        toast.error(result.message || "Connection failed");
      }
    } catch {
      toast.error("Failed to test connection");
    } finally {
      setIsTesting(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>M-Pesa Daraja API</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
        <CardTitle>M-Pesa Daraja API</CardTitle>
        <CardDescription>
          Configure your M-Pesa integration credentials for payment processing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="consumerKey">Consumer Key</Label>
              <Input
                id="consumerKey"
                {...register("consumerKey")}
                placeholder="Enter consumer key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumerSecret">Consumer Secret</Label>
              <Input
                id="consumerSecret"
                {...register("consumerSecret")}
                placeholder="Enter consumer secret"
                type="password"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shortcode">Shortcode</Label>
              <Input
                id="shortcode"
                {...register("shortcode")}
                placeholder="e.g. 174379"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passkey">Passkey</Label>
              <Input
                id="passkey"
                {...register("passkey")}
                placeholder="Enter passkey"
                type="password"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="callbackUrl">Callback URL</Label>
            <Input
              id="callbackUrl"
              {...register("callbackUrl")}
              placeholder="https://your-domain.com/api/mpesa/callback"
            />
          </div>

          <div className="space-y-2">
            <Label>Environment</Label>
            <Select
              value={environment}
              onValueChange={(value) => setValue("environment", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mock">Mock (Testing)</SelectItem>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saveMutation.isPending} className="bg-amber-600 text-white hover:bg-amber-700">
              {saveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Settings
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wifi className="mr-2 h-4 w-4" />
              )}
              Test Connection
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
