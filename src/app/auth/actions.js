"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function authMessage(path, type, message) {
  return `${path}?${type}=${encodeURIComponent(message)}`;
}

export async function login(formData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(authMessage("/login", "error", "Email dan kata sandi wajib diisi."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(authMessage("/login", "error", "Email atau kata sandi tidak sesuai."));
  }

  redirect("/dashboard");
}

export async function register(formData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8) {
    redirect(authMessage("/register", "error", "Isi nama, email, dan kata sandi minimal 8 karakter."));
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, role: "player" },
      ...(origin ? { emailRedirectTo: `${origin}/auth/callback` } : {}),
    },
  });

  if (error) {
    redirect(authMessage("/register", "error", error.message));
  }

  if (!data.session) {
    redirect(authMessage("/register", "message", "Akun dibuat. Periksa email Anda untuk melakukan verifikasi."));
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
