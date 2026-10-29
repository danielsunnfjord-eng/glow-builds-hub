import { useState } from "react";
import { Link, useLocation } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { Menu, X, ChevronDown } from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import logo from "@/assets/logo-horizontal.webp";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { currentLocale, localizedRoutePath } from "@/lib/locale";
import { travelNavigation, navigationCopy, PRIVATE_INTAKE_URL, isPrivateTravelPath } from "@/lib/travelNavigation";

const Navbar = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const locale = currentLocale();
  const copy = navigationCopy[locale];
  const privatePage = isPrivateTravelPath(pathname);
  const privateLinks = [
    { path: "/catalogue", label: t("nav.shop") },
    { path: "/pricing", label: t("nav.pricing") },
    { path: "/start-your-journey", label: copy.startJourney },
  ];
  const linkClass = "text-[0.72rem] font-medium uppercase text-voyage-muted hover:text-ink transition-colors no-underline";
  const actions = <>
    {privatePage && <Button asChild variant="outline" className="rounded-xs border-ink/25 bg-transparent text-ink text-[0.72rem] uppercase"><a href={PRIVATE_INTAKE_URL} target="_blank" rel="noopener noreferrer">{t("nav.planMyTrip")}</a></Button>}
    <Button asChild className="rounded-xs bg-gold text-ink hover:bg-gold-2 text-[0.72rem] uppercase"><Link to={localizedRoutePath("/start", locale)} onClick={() => setOpen(false)}>{copy.start}</Link></Button>
  </>;

  return (
    <nav aria-label="Main navigation" className="fixed top-0 left-0 right-0 z-50 bg-parchment/90 backdrop-blur-lg border-b border-gold/15">
      <div className="flex justify-between items-center gap-6 px-6 py-4 md:px-10 md:py-5 xl:px-16">
        <Link to="/" className="shrink-0 no-underline" onClick={() => setOpen(false)}>
          <img src={logo} alt="Fjord & Waves Travel" width={800} height={537} className="h-12 md:h-28 w-auto [filter:contrast(1.4)_saturate(1.2)]" />
        </Link>
        <div className="hidden xl:flex flex-col items-end gap-5">
          <div className="flex items-center gap-5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" className={`${linkClass} h-auto p-0 hover:bg-transparent`}>{copy.privateTravel}<ChevronDown /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-parchment border-gold/20 text-ink">
                {privateLinks.map((item) => <DropdownMenuItem asChild key={item.path}><Link to={item.path}>{item.label}</Link></DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
            <details className="text-ink">
          <summary className={`${linkClass} cursor-pointer`}>{copy.privateTravel}</summary>
          <div className="mt-4 border-l border-gold/30 pl-4 flex flex-col gap-4">
            {privateLinks.map((item) => <Link key={item.path} to={item.path} className={linkClass} onClick={() => setOpen(false)}>{item.label}</Link>)}
          </div>
        </details>
        {travelNavigation.map((item) => <Link key={item.key} to={localizedRoutePath(item.path, locale)} className={linkClass}>{copy[item.key]}</Link>)}

          </div>
          <div className="flex items-center gap-4"><LanguageSelector variant="light" />{actions}</div>
        </div>
        <div className="xl:hidden flex items-center gap-2">
          <LanguageSelector variant="light" />
          <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-navigation" className="text-ink">
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && <div id="mobile-navigation" className="xl:hidden max-h-[calc(100dvh-160px)] overflow-y-auto border-t border-gold/15 bg-parchment px-6 py-5 flex flex-col gap-4">
        {travelNavigation.map((item) => <Link key={item.key} to={localizedRoutePath(item.path, locale)} className={linkClass} onClick={() => setOpen(false)}>{copy[item.key]}</Link>)}

        <div className="flex flex-wrap gap-3 pt-2">{actions}</div>
      </div>}
    </nav>
  );
};

export default Navbar;
