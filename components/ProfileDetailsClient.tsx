"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CircleQuestionMark,
  History,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import { withBackendPrefix } from "@/lib/backend-url";

type Tab = "personal" | "history";

type ProfileUser = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  memberSince: string;
  photoUrl?: string | null;
};

type ProfileOrder = {
  razorpayOrderId: string;
  templateId: string;
  templateTitle: string;
  totalInr: number;
  paidAt?: string;
  renderStatus?: string | null;
};

const navActiveClass =
  "w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-300 bg-gradient-to-r from-[#FF8FA3] to-[#FF5B5B] text-white shadow-lg shadow-rose-300/40 ring-1 ring-black/10";
const navInactiveClass =
  "w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-300 text-slate-600 hover:bg-rose-50/90";

const cardShell = "rounded-[32px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100";
const mainPanel =
  "rounded-[32px] bg-gradient-to-br from-rose-50/95 to-rose-100/35 p-4 shadow-sm border border-rose-100/90 sm:p-8 lg:p-10";

function InitialsAvatar({
  name,
  className,
  imageUrl,
}: {
  name: string;
  className?: string;
  imageUrl?: string | null;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        className={`rounded-full border border-gray-200 object-cover shadow-sm ${className ?? ""}`}
      />
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] text-lg font-bold uppercase text-white shadow-sm ${className ?? ""}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}

export function ProfileDetailsClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [orders, setOrders] = useState<ProfileOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("personal");
  const [historyPage, setHistoryPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

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
          orders?: ProfileOrder[];
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
        const u = data.user;
        setUser({
          ...u,
          phone: u.phone ?? "",
          photoUrl: u.photoUrl ?? null,
        });
        setOrders(data.orders || []);
        setFirstName(u.firstName);
        setLastName(u.lastName);
        setEmail(u.email);
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

  const ITEMS_PER_PAGE = 3;
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const paginatedOrders = orders.slice(
    (historyPage - 1) * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE
  );

  function openEdit() {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setEditPhone(user.phone ?? "");
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
      setEditPhone(user.phone ?? "");
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
          phone: editPhone.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; user?: ProfileUser };
      if (!res.ok || !data.ok || !data.user) {
        setError(data.message ?? "Could not save profile.");
        return;
      }
      if (data.user) {
        setUser((prev) => ({
          firstName: data.user!.firstName ?? prev?.firstName ?? "",
          lastName: data.user!.lastName ?? prev?.lastName ?? "",
          email: data.user!.email ?? prev?.email ?? "",
          phone: data.user!.phone ?? "",
          memberSince: data.user!.memberSince ?? prev?.memberSince ?? "",
          photoUrl: prev?.photoUrl ?? null,
        }));
      }
      setEditOpen(false);
    } catch {
      setError("Network error while saving profile.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    try {
      await fetch(withBackendPrefix("/api/auth/logout"), { method: "POST" });
    } finally {
      localStorage.removeItem("pixvite_token");
      router.push("/login");
    }
  }

  async function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpe?g)$/i.test(f.type)) {
      setError("Only PNG or JPG images are supported.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    const blobUrl = URL.createObjectURL(f);
    setPhotoPreview(blobUrl);
    setError(null);
    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("image", f);
      const uploadRes = await fetch(withBackendPrefix("/api/upload/image"), {
        method: "POST",
        body: formData,
      });
      const uploadData = (await uploadRes.json()) as { url?: string; message?: string };
      if (!uploadRes.ok || !uploadData.url) {
        setError(uploadData.message ?? "Photo upload failed.");
        setPhotoPreview(null);
        URL.revokeObjectURL(blobUrl);
        return;
      }

      const patchRes = await fetch(withBackendPrefix("/api/profile"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: uploadData.url }),
      });
      if (!patchRes.ok) {
        setError("Could not save photo.");
        setPhotoPreview(null);
        URL.revokeObjectURL(blobUrl);
        return;
      }

      setUser((prev) => prev ? { ...prev, photoUrl: uploadData.url } : prev);
      setPhotoPreview(null);
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError("Network error while uploading photo.");
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removePhoto() {
    setPhotoPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!user?.photoUrl) return;

    try {
      await fetch(withBackendPrefix("/api/profile"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: null }),
      });
      setUser((prev) => prev ? { ...prev, photoUrl: null } : prev);
    } catch {
      // silently fail
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await fetch(withBackendPrefix("/api/auth/logout"), { method: "POST" });
      const res = await fetch(withBackendPrefix("/api/profile"), { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        setError(data.message ?? "Could not delete account.");
        setDeleteConfirmOpen(false);
        return;
      }
      localStorage.removeItem("pixvite_token");
      router.push("/");
    } catch {
      setError("Network error while deleting account.");
      setDeleteConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-rose-50 via-white to-rose-100/40 px-4 py-16 text-center text-sm text-slate-500">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-rose-50 via-white to-rose-100/40 px-4 py-16 text-center text-sm text-red-600">
        {error ?? "Could not load profile."}
      </div>
    );
  }

  const phoneDisplay = user.phone?.trim() ? user.phone : "Add your contact number";
  const avatarUrl = photoPreview ?? user?.photoUrl ?? null;

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-br from-rose-50 via-white to-rose-100/40 font-body">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 hidden lg:block">
          <h1 className="mb-2 font-heading text-4xl font-black tracking-tight text-[#1A1A1A] sm:text-[48px]">My Account</h1>
          <p className="text-base text-slate-500 sm:text-[16px]">
            Welcome back, {fullName}! Manage your account settings.
          </p>
        </div>

        <div className="mb-6 lg:hidden">
          <h1 className="mb-2 font-heading text-[32px] font-black text-[#1A1A1A]">My Account</h1>
          <p className="mb-4 text-sm text-slate-500">Welcome back, {fullName}! Manage your account settings.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("personal")}
              className={`flex-1 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${tab === "personal"
                ? "bg-gradient-to-r from-[#FF8FA3] to-[#FF5B5B] text-white shadow-md ring-1 ring-black/10"
                : "border border-rose-100 bg-white text-slate-600"
                }`}
            >
              Personal Info
            </button>
            <button
              type="button"
              onClick={() => { setTab("history"); setHistoryPage(1); }}
              className={`flex-1 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${tab === "history"
                ? "bg-gradient-to-r from-[#FF8FA3] to-[#FF5B5B] text-white shadow-md ring-1 ring-black/10"
                : "border border-rose-100 bg-white text-slate-600"
                }`}
            >
              Purchase History
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          <aside className="hidden w-full shrink-0 lg:block lg:w-80">
            <div className={`mb-4 flex items-center gap-4 p-5 ${cardShell}`}>
              <InitialsAvatar name={fullName} imageUrl={avatarUrl} className="h-14 w-14 shrink-0 sm:h-16 sm:w-16 text-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold text-slate-900">{fullName}</p>
                <p className="truncate text-sm text-slate-400">{user.email}</p>
              </div>
            </div>

            <div className={`${cardShell} mb-4 flex flex-col gap-1 p-3`}>
              <button
                type="button"
                onClick={() => setTab("personal")}
                className={`group ${tab === "personal" ? navActiveClass : navInactiveClass}`}
                aria-current={tab === "personal" ? "page" : undefined}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex items-center justify-center rounded-xl p-2 ${tab === "personal" ? "bg-white/20" : "bg-rose-50 text-[#FF5B5B] group-hover:bg-white group-hover:shadow-sm"}`}>
                    <User className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-[15px] font-semibold">Personal Info</span>
                </div>
                <ArrowRight className={`h-[18px] w-[18px] shrink-0 ${tab === "personal" ? "text-white" : "text-slate-300"}`} />
              </button>
              <button
                type="button"
                onClick={() => { setTab("history"); setHistoryPage(1); }}
                className={`group ${tab === "history" ? navActiveClass : navInactiveClass}`}
                aria-current={tab === "history" ? "page" : undefined}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex items-center justify-center rounded-xl p-2 ${tab === "history" ? "bg-white/20" : "bg-rose-50 text-[#FF5B5B] group-hover:bg-white group-hover:shadow-sm"}`}>
                    <History className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-[15px] font-semibold">Purchase History</span>
                </div>
                <ArrowRight className={`h-[18px] w-[18px] shrink-0 ${tab === "history" ? "text-white" : "text-slate-300"}`} />
              </button>
            </div>

            <div className={`relative ${cardShell} mb-8 overflow-hidden p-6`}>
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50">
                    <CircleQuestionMark className="h-5 w-5 text-rose-600" aria-hidden />
                  </div>
                  <p className="text-lg font-bold text-slate-800">Need Help?</p>
                </div>
                <p className="text-sm leading-relaxed text-slate-500">
                  Our support team is available 24/7 to help you with any issues.
                </p>
                <Link
                  href="/contact"
                  className="w-full rounded-2xl border border-rose-200 py-3 text-center font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  Contact Support
                </Link>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void signOut()}
              className="group flex items-center gap-3 px-2 text-slate-400 transition hover:text-rose-700"
            >
              <LogOut className="h-5 w-5 transition group-hover:rotate-6" aria-hidden />
              <span className="text-[15px] font-semibold">Sign Out</span>
            </button>
          </aside>

          <div className="min-w-0 flex-1">
            {tab === "personal" ? (
              <div className={mainPanel}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => void onPhotoChange(e)}
                />

                <h2 className="mb-6 font-heading text-2xl font-bold text-slate-800 sm:text-3xl">Personal Info</h2>

                {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

                <div
                  className={`mb-5 mt-2 flex flex-col gap-5 rounded-3xl border border-rose-100/80 bg-white p-5 shadow-sm sm:mt-0 sm:flex-row sm:items-center sm:justify-between`}
                >
                  <div className="flex items-center gap-4">
                    <InitialsAvatar name={fullName} imageUrl={avatarUrl} className="h-14 w-14 shrink-0 text-lg" />
                    <div>
                      <p className="text-base font-semibold text-gray-800 sm:text-lg">Profile Photo</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="bg_linear w-full rounded-xl px-5 py-2 text-center text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60 sm:w-auto"
                    >
                      {uploadingPhoto ? "Uploading…" : "Update"}
                    </button>
                    {(avatarUrl) && (
                      <button
                        type="button"
                        onClick={() => void removePhoto()}
                        className="text-sm text-gray-500 transition hover:text-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div
                    className={`group flex min-h-[88px] flex-col justify-center rounded-3xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md`}
                  >
                    <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-rose-400">
                      <User className="h-[18px] w-[18px] shrink-0 text-rose-400" aria-hidden />
                      Full Name
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-semibold text-gray-800">{fullName}</p>
                      <button
                        type="button"
                        onClick={openEdit}
                        aria-label="Edit name"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 opacity-0 transition hover:bg-rose-100 hover:text-rose-700 group-hover:opacity-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div
                    className={`group flex min-h-[88px] flex-col justify-center rounded-3xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md`}
                  >
                    <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-rose-400">
                      <Phone className="h-4 w-4 shrink-0 text-rose-400" aria-hidden />
                      Phone Number
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-semibold text-gray-800">
                        {phoneDisplay}
                      </p>
                      <button
                        type="button"
                        onClick={openEdit}
                        aria-label="Edit profile"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 opacity-0 transition hover:bg-rose-100 hover:text-rose-700 group-hover:opacity-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-6 mt-4 rounded-3xl border border-rose-100 bg-white p-4 shadow-sm">
                  <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-rose-400">
                    <Mail className="h-4 w-4 text-rose-400" aria-hidden />
                    Email Address
                  </p>
                  <p className="break-words text-sm sm:text-base md:text-lg font-semibold text-slate-800">
                    {user.email}
                  </p>
                </div>

                <div className="flex flex-col gap-4 rounded-3xl border border-red-200 bg-red-50 p-5 transition hover:bg-red-100/80 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-1 items-start gap-4 sm:items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                      <Trash2 className="h-[18px] w-[18px] text-red-500" aria-hidden />
                    </div>
                    <div>
                      <p className="font-semibold text-red-600">Delete Account</p>
                      <p className="mt-1 text-sm text-gray-600 sm:text-base">
                        Permanently remove your account and all associated data.
                      </p>
                    </div>
                  </div>
                  <div className="sm:shrink-0">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="w-full rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 sm:w-auto"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={mainPanel}>
                <h2 className="mb-8 font-heading text-xl font-bold text-slate-800 sm:text-2xl">Template purchase history</h2>
                {orders.length === 0 ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
                    <p className="mb-6 text-slate-600">You haven&apos;t purchased any templates yet!</p>
                    <Link
                      href="/"
                      className="bg_linear inline-flex rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
                    >
                      Explore more templates
                    </Link>
                  </div>
                ) : (
                  <>
                  <div className="flex flex-col gap-4">
                    {paginatedOrders.map((order) => (
                      <div
                        key={order.razorpayOrderId}
                        className="flex flex-col gap-4 rounded-3xl border border-rose-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-lg font-bold text-slate-800">{order.templateTitle}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            Order ID: <span className="font-medium text-slate-700">{order.razorpayOrderId}</span>
                          </p>
                          {order.paidAt && (
                            <p className="mt-0.5 text-sm text-slate-500">
                              Purchased: <span className="font-medium text-slate-700">{new Date(order.paidAt).toLocaleDateString()}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-2">
                          <p className="text-lg font-bold text-emerald-600">
                            ₹{order.totalInr}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            {order.renderStatus === "done" ? (
                              <a
                                href={`/api/orders/${encodeURIComponent(order.razorpayOrderId)}/video`}
                                download
                                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                              >
                                Download Video
                              </a>
                            ) : order.renderStatus === "error" ? (
                              <span className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600">
                                Render Failed
                              </span>
                            ) : order.renderStatus === "processing" || order.renderStatus === "pending" ? (
                              <span className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                                Preparing…
                              </span>
                            ) : null}
                            <Link
                              href={`/templates/${order.templateId}`}
                              className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                            >
                              Use Template
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        disabled={historyPage === 1}
                        className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ← Previous
                      </button>
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setHistoryPage(page)}
                            className={`h-9 w-9 rounded-xl text-sm font-semibold transition ${
                              page === historyPage
                                ? "bg-gradient-to-r from-[#FF8FA3] to-[#FF5B5B] text-white shadow-sm"
                                : "border border-rose-100 text-slate-600 hover:bg-rose-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                        disabled={historyPage === totalPages}
                        className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                  </>
                )}

                <div className={`mt-6 lg:hidden ${cardShell} p-4`}>
                  <button type="button" onClick={() => void signOut()} className="flex w-full items-center justify-center gap-2 text-slate-500 hover:text-rose-700">
                    <LogOut className="h-5 w-5" />
                    <span className="font-semibold">Sign Out</span>
                  </button>
                  <Link href="/contact" className="mt-3 block text-center text-sm font-medium text-rose-600 underline-offset-4 hover:underline">
                    Contact Support
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {editOpen ? (
        <div
          className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/45 px-3 py-6 backdrop-blur-[2px]"
          role="presentation"
          onClick={closeEdit}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 font-heading text-xl font-bold text-slate-900">Edit profile</h3>
            {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
            <form className="space-y-5" onSubmit={onSave}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-firstName" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-rose-400">
                    First name
                  </label>
                  <input
                    id="profile-firstName"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[15px] outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-200"
                    required
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="profile-lastName" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-rose-400">
                    Last name
                  </label>
                  <input
                    id="profile-lastName"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[15px] outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-200"
                    required
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="profile-phone" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-rose-400">
                  Phone Number
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[15px] outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-200"
                  autoComplete="tel"
                  placeholder="Enter your phone number"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="order-2 rounded-xl border border-gray-200 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-gray-50 sm:order-1"
                  onClick={closeEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg_linear order-1 rounded-xl px-5 py-2.5 font-semibold text-white disabled:opacity-60 sm:order-2"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteConfirmOpen ? (
        <div
          className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/45 px-3 py-6 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => !deleting && setDeleteConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" aria-hidden />
            </div>
            <h3 className="mb-2 font-heading text-xl font-bold text-slate-900">Delete Account</h3>
            <p className="mb-1 text-sm text-slate-600">
              This will permanently delete your account and all associated data:
            </p>
            <ul className="mb-6 mt-2 list-disc pl-5 text-sm text-slate-600 space-y-1">
              <li>Your profile and personal information</li>
              <li>All purchase history and orders</li>
              <li>All saved drafts</li>
            </ul>
            <p className="mb-6 text-sm font-semibold text-red-600">This action cannot be undone.</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deleting}
                className="order-2 rounded-xl border border-gray-200 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-gray-50 disabled:opacity-50 sm:order-1"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                className="order-1 rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60 sm:order-2"
                onClick={() => void handleDeleteAccount()}
              >
                {deleting ? "Deleting..." : "Yes, Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
