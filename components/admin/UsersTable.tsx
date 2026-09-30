"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/auth";

type UserRow = { id: string; display_name: string; role: Role; status: string };

const ROLES: Role[] = ["reader", "contributor", "author", "editor", "admin"];

export default function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  async function handleRoleChange(userId: string, role: Role) {
    setError(null);
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  async function handleStatusToggle(userId: string, currentStatus: string) {
    const next = currentStatus === "active" ? "suspended" : "active";
    const { error } = await supabase
      .from("profiles")
      .update({ status: next })
      .eq("id", userId);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error && <p className="text-brand text-sm font-medium mb-4">{error}</p>}
      <ul className="divide-y divide-line border-t border-line">
        {users.map((u) => {
          const isSelf = u.id === currentUserId;
          return (
            <li
              key={u.id}
              className="py-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold">
                  {u.display_name}{" "}
                  {isSelf && <span className="text-xs text-muted">(you)</span>}
                </p>
                <p className="text-xs text-muted capitalize mt-1">{u.status}</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={u.role}
                  disabled={isSelf}
                  onChange={(e) =>
                    handleRoleChange(u.id, e.target.value as Role)
                  }
                  className="border-2 border-line px-2 py-1 text-xs font-bold uppercase tracking-wide bg-white disabled:opacity-40"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleStatusToggle(u.id, u.status)}
                  disabled={isSelf}
                  className="text-xs font-bold uppercase tracking-wide text-brand hover:underline disabled:opacity-40"
                >
                  {u.status === "active" ? "Suspend" : "Reactivate"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted mt-4">
        You can't change your own role or status here — ask another admin if
        that's ever needed.
      </p>
    </div>
  );
}
