import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Mail, Lock } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Button, Field, Input } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: { email: "", password: "" } });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const user = await login(data);
      toast.success(`Welcome back, ${user.name.split(" ")[0]} 👋`);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Convenience: pre-fill the seeded demo credentials.
  const useDemo = () => {
    setValue("email", "alex@timetoprogram.com");
    setValue("password", "Test@1234");
  };

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Sign in to your TTP CRM workspace.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Field label="Email" error={errors.email?.message}>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <Input
              type="email"
              placeholder="you@company.com"
              className="pl-9"
              {...register("email", { required: "Email is required" })}
            />
          </div>
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <Input
              type="password"
              placeholder="••••••••"
              className="pl-9"
              {...register("password", { required: "Password is required" })}
            />
          </div>
        </Field>

        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          Sign in
        </Button>
      </form>

      <button
        onClick={useDemo}
        className="mt-3 w-full rounded-full border border-dashed border-brand-300 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-50"
      >
        Try the demo account
      </button>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold text-brand-700 hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
