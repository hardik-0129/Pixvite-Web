"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { withBackendPrefix } from "@/lib/backend-url";

type ProfileUser = {
  firstName: string;
  lastName: string;
  email: string;
  memberSince: string;
};

function formatDate(v: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function ProfileDetailsClient() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(withBackendPrefix("/api/profile"), { cache: "no-store" });
        const data = (await res.json()) as {
          ok?: boolean;
          message?: string;
          user?: ProfileUser;
        };
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok || !data.ok || !data.user) {
          setError(data.message ?? "Could not load profile.");
          return;
        }
        if (!active) return;
        setUser(data.user);
        setFirstName(data.user.firstName);
        setLastName(data.user.lastName);
        setEmail(data.user.email);
      } catch {
        if (active) setError("Network error while loading profile.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [router]);

  const fullName = useMemo(() => {
    const a = user?.firstName?.trim() ?? "";
    const b = user?.lastName?.trim() ?? "";
    return `${a} ${b}`.trim();
  }, [user]);

  function openEdit() {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setError(null);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setError(null);
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
    }
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(withBackendPrefix("/api/profile"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; user?: ProfileUser };
      if (!res.ok || !data.ok || !data.user) {
        setError(data.message ?? "Could not save profile.");
        return;
      }
      setUser(data.user);
      setEditOpen(false);
    } catch {
      setError("Network error while saving profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-[1400px] px-4 py-12 text-sm text-[var(--text-secondary)]">Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-12 text-sm text-red-600">
        {error ?? "Could not load profile."}
      </div>
    );
  }

  return (
    <div
      className="max-w-full grow overflow-x-hidden px-4 py-10"
      style={{ background: "linear-gradient(rgba(255, 153, 102, 0.15), rgba(255, 94, 98, 0.15), white)" }}
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <h1 className="mb-8 text-3xl font-bold text-[var(--foreground)] md:text-5xl" style={{ fontFamily: "var(--font-header)" }}>
          My Account
        </h1>

        <div>
          <div className="mb-6 flex gap-4 border-b pb-2" style={{ borderColor: "var(--border)" }}>
            <button
              className="rounded-t-md px-4 py-2 font-medium transition-all duration-200"
              style={{
                borderBottom: "2px solid var(--brand-end)",
                color: "var(--brand-end)",
                fontFamily: "var(--font-header)",
              }}
              type="button"
            >
              Profile Details
            </button>
          </div>

          <div className="rounded-xl p-6 shadow-md md:p-8" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <section style={{ background: "var(--card)", borderColor: "var(--border)", padding: 0 }}>
              <div className="flex flex-col items-start justify-between gap-6 px-6 py-6 sm:flex-row sm:items-center">
                <div className="flex-1 space-y-6">
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="text-base font-semibold" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-header)" }}>
                      Name:
                    </span>
                    <span className="min-w-0 break-words text-lg text-[var(--foreground)]" style={{ fontFamily: "var(--font-header)" }}>
                      {fullName}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="text-base font-semibold" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-header)" }}>
                      Email:
                    </span>
                    <span className="min-w-0 break-all text-lg text-[var(--foreground)]" style={{ fontFamily: "var(--font-header)" }}>
                      {user.email}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="text-base font-semibold" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-header)" }}>
                      Member Since:
                    </span>
                    <span className="text-md text-[var(--foreground)]" style={{ fontFamily: "var(--font-header)" }}>
                      {formatDate(user.memberSince)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow transition duration-150 hover:scale-105"
                  style={{
                    background: "linear-gradient(90deg, var(--brand-start), var(--brand-end))",
                    color: "#fff",
                    fontFamily: "var(--font-header)",
                  }}
                  onClick={openEdit}
                >
                  Edit Profile
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {editOpen ? (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/50 px-3 py-4" role="presentation" onClick={closeEdit}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-4xl rounded-xl border p-6 shadow-2xl md:p-8"
            style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
            <form className="space-y-6" onSubmit={onSave}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="profile-firstName" className="mb-1 block text-sm font-medium" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-header)" }}>
                    First Name
                  </label>
                  <input
                    id="profile-firstName"
                    className="w-full rounded-lg border px-3 py-2 outline-none transition focus:ring-2 focus:ring-[var(--brand-end)]"
                    style={{ borderColor: "var(--border)", fontFamily: "var(--font-body)" }}
                    placeholder="Enter your first name"
                    required
                    autoComplete="given-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="profile-lastName" className="mb-1 block text-sm font-medium" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-header)" }}>
                    Last Name
                  </label>
                  <input
                    id="profile-lastName"
                    className="w-full rounded-lg border px-3 py-2 outline-none transition focus:ring-2 focus:ring-[var(--brand-end)]"
                    style={{ borderColor: "var(--border)", fontFamily: "var(--font-body)" }}
                    placeholder="Enter your last name"
                    required
                    autoComplete="family-name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="profile-email" className="mb-1 block text-sm font-medium" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-header)" }}>
                  Email Address
                </label>
                <input
                  id="profile-email"
                  className="w-full rounded-lg border px-3 py-2 outline-none transition focus:ring-2 focus:ring-[var(--brand-end)]"
                  style={{ borderColor: "var(--border)", fontFamily: "var(--font-body)" }}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-row gap-4 pt-2 sm:gap-10">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[2] rounded-full px-5 py-2.5 font-semibold text-white shadow transition duration-150 transform-gpu hover:scale-105 disabled:opacity-60"
                  style={{
                    background: "linear-gradient(90deg, var(--brand-start), var(--brand-end))",
                    fontFamily: "var(--font-header)",
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-full border bg-[var(--muted)] px-5 py-2.5 font-semibold text-[var(--foreground)] transition hover:bg-[#ececec]"
                  style={{ borderColor: "var(--border)", fontFamily: "var(--font-header)" }}
                  onClick={closeEdit}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
