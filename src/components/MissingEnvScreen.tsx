import { missingSupabaseEnvKeys } from "@/lib/env";

export const MissingEnvScreen = () => {
  const missingKeys = missingSupabaseEnvKeys();

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card shadow-lg p-6">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-lg font-semibold">
            !
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Missing Supabase Configuration</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Hindi naka-set ang required Supabase environment variables sa deployment.
              I-set ito sa Vercel project settings, then mag-redeploy.
            </p>
          </div>
        </div>

        {missingKeys.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-medium">Missing keys:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {missingKeys.map((key) => (
                <code
                  key={key}
                  className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-foreground"
                >
                  {key}
                </code>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 space-y-2 text-sm text-muted-foreground">
          <p>Steps:</p>
          <p>1. Vercel Dashboard / Project / Settings / Environment Variables</p>
          <p>2. Add the missing keys above</p>
          <p>3. Redeploy the project (Vite reads env at build time)</p>
        </div>
      </div>
    </div>
  );
};
