import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { isModuleLoadError, reloadFailedModule } from "@/lib/retryDynamicImport";
import { reportLovableError } from "@/lib/lovable-error-reporting";

/** Eagerly bundled: the recovery screen must not need another failed download. */
export default function RouteLoadError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const moduleFailed = isModuleLoadError(error);

  useEffect(() => {
    if (isModuleLoadError(error) && reloadFailedModule("router")) return;
    reportLovableError(error, { boundary: "route_load_error" });
  }, [error]);

  return (
    <div role="alert" className="min-h-[50vh] flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-serif-display">This page didn't load</h1>
        <p className="text-muted-foreground text-sm">
          Something went wrong on our end. You can try again or head back home.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => {
            // Re-fetch the document: resetting a boundary alone rethrows a cached import failure.
            if (moduleFailed) {
              window.location.reload();
              return;
            }
            void router.invalidate();
            reset();
          }}>Try again</Button>
          <Button variant="outline" asChild><a href="/">Go home</a></Button>
        </div>
      </div>
    </div>
  );
}