import FeedbackForm from "@/components/FeedbackForm";
import { createClient } from "@/lib/supabase/server";
import BetaNotice from "@/components/site/BetaNotice";
export const metadata = { title: "Send feedback", robots: { index: false, follow: false } };
export const revalidate = 0;
export default async function FeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 [overflow-wrap:anywhere]"><h1 className="font-display text-3xl font-bold">Report a problem or send feedback</h1><p className="mb-6 mt-4 leading-relaxed text-muted">Help us improve The Daily Byte for OOU student testing. Report a bug, suggest an improvement, or flag a content issue.</p><div className="mb-8"><BetaNotice /></div><FeedbackForm signedIn={!!user} /></div>;
}
