import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FEEDBACK_STATUSES } from "@/lib/feedback";
import { newsroomPage } from "@/lib/newsroom";
import { PageHeading, ListPagination } from "@/components/dashboard/WorkspaceUI";
import FeedbackStatusForm from "@/components/admin/FeedbackStatusForm";
export const revalidate = 0;
type Report = { id: string; type: string; title: string; message: string; page_url: string | null; email: string | null; reporter_id: string | null; status: string; created_at: string };
export default async function AdminFeedbackPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  await requireAdmin();
  const params = await searchParams, page = newsroomPage(params.page), status = FEEDBACK_STATUSES.some(value => value === params.status) ? params.status : "all";
  const supabase = await createClient();
  let query = supabase.from("feedback_submissions").select("id, type, title, message, page_url, email, reporter_id, status, created_at", { count: "exact" });
  if (status !== "all") query = query.eq("status", status);
  const { data, count, error } = await query.order("created_at", { ascending: false }).order("id").range((page - 1) * 20, page * 20 - 1).returns<Report[]>();
  return <div className="[overflow-wrap:anywhere]"><PageHeading eyebrow="Early tester feedback" title="Feedback & reports" description="Private reports from students and contributors. Review content issues before deciding what to do." create={false} /><nav aria-label="Filter feedback" className="nr-filters">{["all", ...FEEDBACK_STATUSES].map(value => <Link key={value} href={"/admin/feedback?status=" + value} aria-current={value === status ? "page" : undefined}>{value}</Link>)}</nav>{error ? <p role="alert" className="nr-callout">Feedback is temporarily unavailable. Confirm the Phase 11 migration has been applied, then try again.</p> : data?.length ? <ul className="space-y-5">{data.map(report => <li key={report.id} className="nr-panel p-5 sm:p-6"><p className="text-xs font-semibold text-muted">{report.type.replaceAll("_", " ")} · {new Date(report.created_at).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })}</p><h2 className="mt-3 font-display text-xl font-bold">{report.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{report.message}</p>{report.page_url && <p className="mt-3 text-sm">Page: <a href={report.page_url} target="_blank" rel="noopener noreferrer" className="underline">{report.page_url}</a></p>}{report.email && <p className="mt-3 text-sm">Optional contact: {report.email}</p>}{report.reporter_id && <p className="mt-3 text-xs text-muted">Signed-in reporter ID: {report.reporter_id}</p>}<FeedbackStatusForm id={report.id} status={report.status} /></li>)}</ul> : <p className="nr-callout">No feedback to show for this filter.</p>}{!error && <ListPagination base="/admin/feedback" page={page} total={count ?? 0} status={status} />}</div>;
}
