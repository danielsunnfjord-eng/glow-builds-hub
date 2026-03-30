import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState("overview");

  const tabClass = (id: string) =>
    `px-4 py-2 rounded-sm font-sans text-[0.72rem] font-medium tracking-[0.08em] uppercase cursor-pointer transition-all ${
      activePanel === id
        ? "text-gold bg-gold/10"
        : "text-voyage-white/45 hover:text-voyage-white hover:bg-voyage-white/[0.06]"
    }`;

  return (
    <div className="min-h-screen bg-parchment">
      {/* Admin Nav */}
      <nav className="bg-ink px-10 py-4 flex justify-between items-center border-b border-voyage-white/[0.08] max-md:px-6 max-md:flex-wrap max-md:gap-3">
        <div>
          <span className="font-serif text-lg font-bold text-voyage-white">
            Voyage<span className="text-gold italic">&</span>Co.
          </span>
          <small className="block text-[0.62rem] tracking-[0.1em] uppercase text-voyage-white/35 mt-0.5">Agency Dashboard</small>
        </div>
        <div className="flex gap-2 items-center max-md:flex-wrap">
          {["overview", "enquiries", "bookings", "tools", "commissions"].map((tab) => (
            <button key={tab} className={tabClass(tab)} onClick={() => setActivePanel(tab)}>
              {tab === "tools" ? "Fora Tools" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-sm border border-voyage-white/10 text-voyage-white/45 text-[0.72rem] font-medium tracking-[0.08em] uppercase hover:border-voyage-white/30 hover:text-voyage-white transition-all ml-2"
          >
            ← Back to site
          </button>
        </div>
      </nav>

      <div className="p-10 max-w-[1300px] mx-auto max-md:p-6">
        <div className="mb-10">
          <h1 className="font-serif text-3xl font-bold mb-1">Good morning ✦</h1>
          <p className="text-[0.85rem] text-voyage-muted">Here's your agency snapshot for today, Monday 30 March 2026.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 max-md:grid-cols-1 gap-4 mb-10">
          {[
            { label: "Open Enquiries", val: "7", accent: "new", change: "↑ 3 since yesterday" },
            { label: "Active Bookings", val: "24", change: "4 departing this week" },
            { label: "Commission Pending", val: "£3,840", change: "Via Fora + affiliates" },
            { label: "YTD Revenue", val: "£18,290", change: "↑ 22% vs last year" },
          ].map((s) => (
            <div key={s.label} className="bg-voyage-white border border-parchment-3 rounded-lg p-6">
              <div className="text-[0.7rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-1">{s.label}</div>
              <div className="font-serif text-3xl font-bold text-ink leading-none mb-1.5">
                {s.val} {s.accent && <span className="text-base font-normal text-gold">{s.accent}</span>}
              </div>
              <div className="text-[0.72rem] text-sage">{s.change}</div>
            </div>
          ))}
        </div>

        {/* Panels */}
        {activePanel === "overview" && <OverviewPanel />}
        {activePanel === "enquiries" && <EnquiriesPanel />}
        {activePanel === "bookings" && <BookingsPanel />}
        {activePanel === "tools" && <ToolsPanel />}
        {activePanel === "commissions" && <CommissionsPanel />}
      </div>
    </div>
  );
};

const Badge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    New: "bg-gold/10 text-gold border-gold/30",
    "In Progress": "bg-sage/10 text-sage border-sage/30",
    Booked: "bg-ink/[0.06] text-voyage-muted border-parchment-3",
    Confirmed: "bg-ink/[0.06] text-voyage-muted border-parchment-3",
    "Departing Soon": "bg-sage/10 text-sage border-sage/30",
    Quoting: "bg-gold/10 text-gold border-gold/30",
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-[0.62rem] font-semibold tracking-[0.08em] uppercase border ${styles[status] || ""}`}>
      {status}
    </span>
  );
};

const TableWrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-voyage-white border border-parchment-3 rounded-lg overflow-x-auto">
    <table className="w-full border-collapse">{children}</table>
  </div>
);

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-5 py-3.5 text-left text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted bg-parchment border-b border-parchment-3">{children}</th>
);

const Td = ({ children }: { children: React.ReactNode }) => (
  <td className="px-5 py-4 text-[0.82rem] text-ink-2 border-b border-parchment-3">{children}</td>
);

const ActionBtn = ({ children }: { children: React.ReactNode }) => (
  <button className="px-3 py-1.5 rounded-sm border border-parchment-3 text-[0.68rem] font-medium text-voyage-muted hover:border-gold hover:text-gold transition-all">
    {children}
  </button>
);

const PanelTitle = ({ title, badge }: { title: string; badge: string }) => (
  <h3 className="font-serif text-xl font-bold mb-6 flex items-center gap-3">
    {title}
    <span className="font-sans text-[0.65rem] font-semibold tracking-[0.1em] uppercase px-2.5 py-1 bg-gold/10 text-gold rounded-sm">{badge}</span>
  </h3>
);

const OverviewPanel = () => (
  <div>
    <PanelTitle title="Recent Activity" badge="Live" />
    <TableWrap>
      <thead><tr><Th>Client</Th><Th>Type</Th><Th>Destination</Th><Th>Value</Th><Th>Status</Th><Th>Action</Th></tr></thead>
      <tbody>
        {[
          { client: "Emma & Dan Foster", type: "Curated", dest: "Maldives, 10 nights", val: "£8,400", status: "New", action: "Open in Fora →" },
          { client: "Marcus T.", type: "Curated", dest: "Japan, 3 weeks", val: "£6,200", status: "In Progress", action: "View Quote" },
          { client: "Sarah L.", type: "Self-book", dest: "Barcelona flights", val: "£340", status: "Booked", action: "Details" },
          { client: "The Patel Family", type: "Curated", dest: "Florida, 2 weeks", val: "£11,800", status: "In Progress", action: "View Quote" },
          { client: "Charlotte W.", type: "Curated", dest: "Tuscany villa, 7 nights", val: "£4,500", status: "Confirmed", action: "Details" },
        ].map((r) => (
          <tr key={r.client} className="hover:bg-parchment"><Td>{r.client}</Td><Td>{r.type}</Td><Td>{r.dest}</Td><Td>{r.val}</Td><Td><Badge status={r.status} /></Td><Td><ActionBtn>{r.action}</ActionBtn></Td></tr>
        ))}
      </tbody>
    </TableWrap>
  </div>
);

const EnquiriesPanel = () => (
  <div>
    <PanelTitle title="Client Enquiries" badge="7 New" />
    <TableWrap>
      <thead><tr><Th>Name</Th><Th>Email</Th><Th>Destination</Th><Th>Budget</Th><Th>Travel Style</Th><Th>Received</Th><Th>Status</Th></tr></thead>
      <tbody>
        {[
          { name: "Emma Foster", email: "emma@email.com", dest: "Maldives", budget: "£8,000+", style: "Luxury, Honeymoon", received: "Today 9:14am", status: "New" },
          { name: "James Kitto", email: "james.k@email.com", dest: "Patagonia", budget: "£5,000–£10,000", style: "Adventure", received: "Today 8:02am", status: "New" },
          { name: "Priya Singh", email: "priya@email.com", dest: "Sri Lanka", budget: "£4,000–£6,000", style: "Cultural, Foodie", received: "Yesterday", status: "In Progress" },
          { name: "Robert Dale", email: "rob.d@email.com", dest: "New Zealand", budget: "£10,000+", style: "Adventure, Family", received: "Yesterday", status: "New" },
          { name: "Anna Müller", email: "anna.m@email.com", dest: "Morocco", budget: "£2,000–£4,000", style: "Cultural, Off-beaten-path", received: "28 Mar", status: "In Progress" },
        ].map((r) => (
          <tr key={r.name} className="hover:bg-parchment"><Td>{r.name}</Td><Td>{r.email}</Td><Td>{r.dest}</Td><Td>{r.budget}</Td><Td>{r.style}</Td><Td>{r.received}</Td><Td><Badge status={r.status} /></Td></tr>
        ))}
      </tbody>
    </TableWrap>
  </div>
);

const BookingsPanel = () => (
  <div>
    <PanelTitle title="Active Bookings" badge="24 Total" />
    <TableWrap>
      <thead><tr><Th>Client</Th><Th>Destination</Th><Th>Departure</Th><Th>Return</Th><Th>Platform</Th><Th>Commission</Th><Th>Status</Th></tr></thead>
      <tbody>
        {[
          { client: "Charlotte W.", dest: "Tuscany, Italy", dep: "12 Apr 2026", ret: "19 Apr 2026", platform: "Fora", comm: "£540", status: "Departing Soon" },
          { client: "Marcus T.", dest: "Tokyo & Kyoto", dep: "2 May 2026", ret: "23 May 2026", platform: "Fora", comm: "£820", status: "In Progress" },
          { client: "Sarah L.", dest: "Barcelona", dep: "18 Apr 2026", ret: "22 Apr 2026", platform: "Travelpayouts", comm: "£18", status: "Confirmed" },
          { client: "Patel Family", dest: "Florida, USA", dep: "20 Jul 2026", ret: "3 Aug 2026", platform: "Fora", comm: "£1,200", status: "Quoting" },
          { client: "Helen & Mike R.", dest: "Cape Town", dep: "5 Jun 2026", ret: "16 Jun 2026", platform: "Fora", comm: "£960", status: "Confirmed" },
        ].map((r) => (
          <tr key={r.client} className="hover:bg-parchment"><Td>{r.client}</Td><Td>{r.dest}</Td><Td>{r.dep}</Td><Td>{r.ret}</Td><Td>{r.platform}</Td><Td>{r.comm}</Td><Td><Badge status={r.status} /></Td></tr>
        ))}
      </tbody>
    </TableWrap>
  </div>
);

const ToolsPanel = () => (
  <div>
    <PanelTitle title="Fora Tools" badge="Accredited Advisor" />
    <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4">
      {[
        { icon: "🌐", title: "Fora Portal", desc: "Your main hub. Search 175,000+ hotels, view commissionable rates, perks and amenities. Book directly.", link: "Open Portal →" },
        { icon: "📋", title: "Bookable Quote", desc: "Build a personalised hotel shortlist. Send the client a branded link. Rates update live. Commission captured automatically.", link: "Create Quote →" },
        { icon: "🤖", title: "Sidekick AI", desc: "Fora's AI research assistant. Trained on destination guides, supplier data and hotel knowledge to help you plan faster.", link: "Open Sidekick →" },
        { icon: "🔒", title: "Vault — Secure Payments", desc: "Send clients a link to store payment details securely. No card data handled by you — fully PCI compliant.", link: "Send Payment Link →" },
        { icon: "📉", title: "Price Drop Monitor", desc: "Fora watches refundable hotel rates daily. When a price drops, it alerts you to rebook and save your client money.", link: "View Monitored Bookings →" },
        { icon: "💰", title: "Commission Tracker", desc: "Fora tracks and collects commissions from all suppliers. View your pipeline, confirmed earnings and payment schedule.", link: "View Commissions →" },
      ].map((t) => (
        <div key={t.title} className="bg-voyage-white border border-parchment-3 rounded-lg p-7 hover:border-gold hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)] transition-all cursor-pointer">
          <span className="text-[1.8rem] mb-4 block">{t.icon}</span>
          <h4 className="text-[0.9rem] font-semibold mb-1.5 text-ink">{t.title}</h4>
          <p className="text-[0.78rem] text-voyage-muted leading-relaxed mb-3">{t.desc}</p>
          <div className="text-[0.62rem] font-semibold tracking-[0.1em] uppercase text-gold">{t.link}</div>
        </div>
      ))}
    </div>
  </div>
);

const CommissionsPanel = () => (
  <div>
    <PanelTitle title="Commission Tracker" badge="March 2026" />
    <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4">
      <div className="bg-voyage-white border border-parchment-3 rounded-lg p-6">
        <h4 className="text-[0.72rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-3">Fora — Confirmed</h4>
        {[
          { name: "Charlotte W. · Tuscany", val: "£540" },
          { name: "Helen & Mike · Cape Town", val: "£960" },
          { name: "Anna M. · Morocco", val: "£320" },
          { name: "Ben T. · Lisbon", val: "£210" },
        ].map((c) => (
          <div key={c.name} className="flex justify-between items-center py-2 border-b border-parchment-3 last:border-b-0 text-[0.82rem]">
            <span className="text-ink-2">{c.name}</span>
            <span className="font-semibold text-sage">{c.val}</span>
          </div>
        ))}
      </div>
      <div className="bg-voyage-white border border-parchment-3 rounded-lg p-6">
        <h4 className="text-[0.72rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-3">Fora — Pending</h4>
        {[
          { name: "Marcus T. · Japan", val: "£820" },
          { name: "Patel Family · Florida", val: "£1,200" },
          { name: "Emma Foster · Maldives", val: "£980" },
        ].map((c) => (
          <div key={c.name} className="flex justify-between items-center py-2 border-b border-parchment-3 last:border-b-0 text-[0.82rem]">
            <span className="text-ink-2">{c.name}</span>
            <span className="font-semibold text-gold">{c.val}</span>
          </div>
        ))}
      </div>
      <div className="bg-voyage-white border border-parchment-3 rounded-lg p-6">
        <h4 className="text-[0.72rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-3">Affiliate — Self-book</h4>
        {[
          { name: "Travelpayouts (flights)", val: "£84" },
          { name: "Booking.com (hotels)", val: "£196" },
          { name: "Viator (activities)", val: "£112" },
          { name: "Rentalcars", val: "£44" },
        ].map((c) => (
          <div key={c.name} className="flex justify-between items-center py-2 border-b border-parchment-3 last:border-b-0 text-[0.82rem]">
            <span className="text-ink-2">{c.name}</span>
            <span className="font-semibold text-sage">{c.val}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AdminDashboard;
