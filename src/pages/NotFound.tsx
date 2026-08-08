import { useLocation } from "@/lib/router-compat";
import { useEffect } from "react";
import Seo from "@/components/Seo";
import { currentLocale, localePath } from "@/lib/locale";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted">
      <Seo
        title="Page not found — Fjord & Waves Travel"
        description="The page you're looking for doesn't exist. Return to Fjord & Waves Travel."
        path={location.pathname}
        noindex
      />
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href={localePath("/", currentLocale())} className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </main>
  );
};

export default NotFound;
