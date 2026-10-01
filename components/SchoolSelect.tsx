import type { SchoolOption } from "@/lib/schools";
export default function SchoolSelect({ id, value, onChange, schools }: { id: string; value: string; onChange: (value: string) => void; schools: SchoolOption[] }) {
  return <div className="min-w-0"><label htmlFor={id} className="mb-2 block text-sm font-semibold">School / University <span className="font-normal text-muted">(optional)</span></label>
    <select id={id} value={value} onChange={e => onChange(e.target.value)} aria-describedby={id + "-note"} className="min-h-11 w-full min-w-0 max-w-full rounded-xl border border-line bg-white px-3 py-2 text-sm">
      <option value="">None / General stories</option>
      {value && !schools.some(s => s.id === value) && <option value={value}>Previously selected school (unavailable)</option>}
      {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
    </select><p id={id + "-note"} className="mt-2 text-xs leading-relaxed text-muted">Choose an existing school, or leave this empty. An association does not imply school endorsement.</p>
  </div>;
}
