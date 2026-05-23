// Route Maker — cleared. Ready to be rebuilt from scratch.
const CatalogManager = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-1">Route Maker</h1>
        <p className="text-[0.85rem] text-voyage-muted">
          The previous itinerary creator has been cleared. Ready to build a new one from scratch.
        </p>
      </div>

      <div className="border border-dashed border-parchment-3 rounded-lg p-16 text-center bg-parchment/40">
        <div className="text-4xl mb-4">🗺</div>
        <h2 className="font-serif text-xl mb-2">Empty canvas</h2>
        <p className="text-sm text-voyage-muted max-w-md mx-auto">
          Tell me how you'd like the new Route Maker to work — fields, flow, AI behavior, output — and I'll build it here.
        </p>
      </div>
    </div>
  );
};

export default CatalogManager;
