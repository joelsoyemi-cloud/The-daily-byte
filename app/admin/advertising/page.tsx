import { requireAdmin } from "@/lib/auth";

export default async function AdvertisingPage() {
  await requireAdmin();

  const configured = !!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="font-display font-900 text-2xl mb-6">Advertising</h1>

      <div className="border-2 border-line bg-white px-6 py-6">
        <p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">
          Google AdSense Status
        </p>
        <p
          className={`font-semibold ${configured ? "text-accent" : "text-brand"}`}
        >
          {configured ? "Configured" : "Not configured"}
        </p>
        <p className="text-sm text-muted mt-2">
          {configured
            ? "An AdSense client ID is set. Ad slots on the public site will render."
            : "No AdSense client ID is set (NEXT_PUBLIC_ADSENSE_CLIENT_ID). Ad slots exist in the code but render nothing until this is added."}
        </p>
      </div>

      <p className="text-xs text-muted mt-4">
        No revenue or impression data is shown here that requires wiring up
        AdSense's own reporting API separately, which hasn't been built. This
        page only reflects real configuration state.
      </p>
    </div>
  );
}
