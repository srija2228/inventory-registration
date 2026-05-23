"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldErrors = Record<string, string[] | undefined>;

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErrors(data.errors ?? { _form: ["Signup failed"] });
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      router.push("/auth/login");
      return;
    }

    router.push("/");
    router.refresh();
  }

  function fieldError(key: string) {
    const msg = errors[key]?.[0];
    return msg ? <p className="text-xs text-red-600">{msg}</p> : null;
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[40%] flex-col justify-between bg-[#1a1d23] p-10 text-white lg:flex">
        <div>
          <p className="text-2xl font-bold tracking-tight">Allo Inventory</p>
          <p className="mt-2 text-sm text-white/60">Create your operator account</p>
        </div>
        <ul className="space-y-4 text-sm text-white/85">
          {[
            "Secure credential-based access",
            "Role-based operations view",
            "Full reservation workflow",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                <Check className="size-3.5" />
              </span>
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs text-white/40">Demo app — no email verification</p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join the inventory operations team</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                suppressHydrationWarning
                className="rounded-xl"
              />
              {fieldError("name")}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                suppressHydrationWarning
                className="rounded-xl"
              />
              {fieldError("email")}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  suppressHydrationWarning
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {fieldError("password")}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                suppressHydrationWarning
                className="rounded-xl"
              />
              {fieldError("confirmPassword")}
            </div>

            {errors._form && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errors._form[0]}
              </p>
            )}

            <Button
              type="submit"
              className="w-full rounded-xl bg-[#1a1d23] hover:bg-[#252830]"
              disabled={loading}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
