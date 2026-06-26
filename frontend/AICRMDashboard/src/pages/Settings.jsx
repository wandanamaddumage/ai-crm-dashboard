import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  User,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Shield,
  Mail,
  KeyRound,
} from "lucide-react";

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Field,
  Badge,
  Avatar,
  Spinner,
} from "../components/ui";
import { PageHeader } from "../components/common/PageHeader";
import { useAuth } from "../context/AuthContext";
import { authApi, aiApi } from "../lib/services";
import { shortDate } from "../lib/format";
import { cn } from "../lib/utils";

/* ── Small icon accent rendered beside each card title ─────────── */
function SectionIcon({ icon: Icon, className }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50",
        className
      )}
    >
      <Icon className="h-4 w-4 text-brand-700" />
    </div>
  );
}

/* ── 1. Profile form ────────────────────────────────────────────── */
function ProfileCard({ user, updateUser }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Sync form whenever user object changes (initial load or external update).
  useEffect(() => {
    if (!user) return;
    reset({
      name: user.name || "",
      company: user.company || "",
      avatar: user.avatar || "",
    });
  }, [user, reset]);

  const onSubmit = async (form) => {
    try {
      const res = await authApi.updateProfile(form);
      updateUser(res.user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message || "Could not update profile");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <SectionIcon icon={User} />
          <div>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {/* Avatar preview row */}
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-line bg-surface-muted px-4 py-3">
          <Avatar name={user?.name} src={user?.avatar} size="lg" />
          <div>
            <p className="text-sm font-semibold text-ink">{user?.name}</p>
            <p className="text-xs text-ink-soft">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              error={errors.name?.message}
              className="sm:col-span-2"
            >
              <Input
                placeholder="Your full name"
                {...register("name", { required: "Name is required" })}
              />
            </Field>

            <Field label="Company">
              <Input placeholder="Your company" {...register("company")} />
            </Field>

            {/* Email is read-only — changing it requires re-verification */}
            <Field label="Email address">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/50" />
                <Input
                  value={user?.email || ""}
                  disabled
                  className="pl-9"
                  readOnly
                />
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                Email can't be changed — contact support if needed.
              </p>
            </Field>

            <Field
              label="Avatar URL"
              error={errors.avatar?.message}
              className="sm:col-span-2"
            >
              <Input
                placeholder="https://example.com/photo.jpg"
                {...register("avatar")}
              />
            </Field>
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" loading={isSubmitting}>
              Save changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ── 2. Security / change-password form ────────────────────────── */
function SecurityCard() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const newPassword = watch("password");

  const onSubmit = async ({ password }) => {
    try {
      await authApi.updateProfile({ password });
      toast.success("Password updated");
      reset();
    } catch (err) {
      toast.error(err.message || "Could not update password");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <SectionIcon icon={Lock} />
          <div>
            <CardTitle>Security</CardTitle>
            <CardDescription>Change your password.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="New password" error={errors.password?.message}>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/50" />
                <Input
                  type="password"
                  placeholder="Min. 6 characters"
                  className="pl-9"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Must be at least 6 characters",
                    },
                  })}
                />
              </div>
            </Field>

            <Field
              label="Confirm new password"
              error={errors.confirmPassword?.message}
            >
              <Input
                type="password"
                placeholder="Re-enter password"
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (v) =>
                    v === newPassword || "Passwords do not match",
                })}
              />
            </Field>
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" loading={isSubmitting}>
              Update password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ── 3. AI Integration status card ─────────────────────────────── */
function AiIntegrationCard() {
  const [status, setStatus] = useState(null); // null = loading

  useEffect(() => {
    aiApi
      .status()
      .then((res) => setStatus(res))
      .catch(() => setStatus({ success: false, configured: false, model: null }));
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {/* Sparkles gets a subtly different accent to signal AI distinctiveness */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50">
            <Sparkles className="h-4 w-4 text-brand-600" />
          </div>
          <div>
            <CardTitle>AI Integration</CardTitle>
            <CardDescription>
              Google Gemini powers summaries, email drafts and insights.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {status === null ? (
          /* Loading state — contained so it doesn't stretch the card */
          <div className="flex items-center gap-3 py-2">
            <Spinner className="p-0" />
            <span className="text-sm text-ink-soft">Checking status…</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status + model row */}
            <div className="flex flex-wrap items-center gap-3">
              {status.configured ? (
                <Badge className="bg-brand-50 text-brand-700 border border-brand-200/60">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Connected
                </Badge>
              ) : (
                <Badge className="bg-amber-50 text-amber-700 border border-amber-200/60">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Not configured
                </Badge>
              )}

              {status.model && (
                <span className="rounded-lg border border-line bg-surface-muted px-2.5 py-1 font-mono text-xs text-ink-soft">
                  {status.model}
                </span>
              )}
            </div>

            {/* Helpful setup note when the key is missing */}
            {!status.configured && (
              <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 px-4 py-3.5 text-sm text-amber-800">
                <p className="font-medium mb-1">Connect your Gemini key</p>
                <p className="text-amber-700/80 leading-relaxed">
                  Add{" "}
                  <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs text-amber-900">
                    GEMINI_API_KEY=your_key_here
                  </code>{" "}
                  to the backend <code className="font-mono text-xs">.env</code>{" "}
                  file and restart the server to enable AI features.
                </p>
              </div>
            )}

            {/* Confirmation when connected */}
            {status.configured && (
              <p className="text-sm text-ink-soft">
                AI features are active. Summaries, email drafts, and pipeline
                insights are all powered by{" "}
                <span className="font-medium text-ink">{status.model}</span>.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── 4. Account info + logout ───────────────────────────────────── */
function AccountCard({ user, logout }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <SectionIcon icon={Shield} />
          <div>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your account details and session.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Role */}
          <div className="rounded-2xl border border-line bg-surface-muted px-4 py-3">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-soft">
              Role
            </p>
            <Badge className="bg-brand-50 text-brand-700 border border-brand-200/60 capitalize">
              {user?.role || "Member"}
            </Badge>
          </div>

          {/* Member since */}
          <div className="rounded-2xl border border-line bg-surface-muted px-4 py-3">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-soft">
              Member since
            </p>
            <p className="text-sm font-semibold text-ink">
              {shortDate(user?.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="danger" onClick={logout}>
            Log out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Page root ──────────────────────────────────────────────────── */
export default function Settings() {
  const { user, updateUser, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and integrations."
      />

      <ProfileCard user={user} updateUser={updateUser} />
      <SecurityCard />
      <AiIntegrationCard />
      <AccountCard user={user} logout={logout} />
    </div>
  );
}
