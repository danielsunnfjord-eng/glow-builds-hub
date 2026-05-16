import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import Seo from "@/components/Seo";

const ItineraryShopSuccess = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get("token");
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"loading" | "paid" | "failed">("loading");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    document.title = `${t("shop.successTitle")} · Fjord & Waves Travel`;
  }, [t]);

  useEffect(() => {
    if (!token || !sessionId) {
      setStatus("failed");
      return;
    }
    let attempts = 0;
    const verify = async () => {
      attempts++;
      try {
        const { data } = await supabase.functions.invoke(
          "verify-catalog-purchase",
          { body: { token, session_id: sessionId } },
        );
        if (data?.status === "paid") {
          setStatus("paid");
          return;
        }
        if (attempts < 8) {
          setTimeout(verify, 1500);
        } else {
          setStatus("failed");
        }
      } catch {
        if (attempts < 8) setTimeout(verify, 1500);
        else setStatus("failed");
      }
    };
    verify();
  }, [token, sessionId]);

  const download = async () => {
    if (!token) return;
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "download-catalog-pdf",
        { body: { token } },
      );
      if (error || !data?.url) throw error || new Error("No URL");
      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      alert(String(e));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Seo title="Purchase confirmed — Fjord & Waves Travel" description="Your itinerary purchase is being prepared for download." path="/itineraries-shop/success" noindex />
      <Navbar />
      <main>
      <main className="flex-1 pt-32 pb-20 px-6 flex items-center justify-center max-md:pt-24">
        <div className="bg-voyage-white border border-ink/[0.06] rounded-lg shadow-sm p-10 max-w-lg w-full text-center">
          {status === "loading" && (
            <>
              <div className="text-4xl mb-4">⏳</div>
              <h1 className="font-serif text-[1.6rem] font-bold text-ink mb-2">
                {t("shop.preparing")}
              </h1>
            </>
          )}

          {status === "paid" && (
            <>
              <div className="text-5xl mb-4">✓</div>
              <h1 className="font-serif text-[1.8rem] font-bold text-ink mb-2">
                {t("shop.successTitle")}
              </h1>
              <p className="text-voyage-muted mb-8">{t("shop.successSubtitle")}</p>
              <button
                onClick={download}
                disabled={downloading}
                className="w-full px-6 py-4 rounded-sm bg-ink text-voyage-white text-[0.85rem] font-medium tracking-[0.12em] uppercase hover:bg-gold hover:text-ink transition-colors disabled:opacity-50"
              >
                📄 {downloading ? t("shop.processing") : t("shop.downloadPdf")}
              </button>
              <p className="text-[0.72rem] text-voyage-muted mt-4">
                {t("shop.downloadHint")}
              </p>
              <Link
                to="/itineraries-shop"
                className="block mt-6 text-[0.78rem] text-gold hover:underline"
              >
                {t("shop.backToShop")}
              </Link>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-voyage-muted mb-4">{t("shop.paymentFailed")}</p>
              <Link
                to="/itineraries-shop"
                className="text-gold hover:underline"
              >
                {t("shop.backToShop")}
              </Link>
            </>
          )}
        </div>
      </main>
      </main>
      <Footer />
    </div>
  );
};

export default ItineraryShopSuccess;
