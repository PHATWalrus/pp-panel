'use server';

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, getSessionCookieConfig } from "@/lib/auth";

export async function loginAction(formData) {
  const email = formData.get("email")?.toString()?.trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Email and password required" };
  }

  const operator = await prisma.operators.findUnique({
    where: { email },
  });

  if (!operator) {
    return { error: "Invalid email or password" };
  }

  const valid = await verifyPassword(password, operator.password_hash);
  if (!valid) {
    return { error: "Invalid email or password" };
  }

  const token = await createSession(operator.id, operator.email);
  const config = getSessionCookieConfig();

  const cookieStore = await cookies();
  cookieStore.set(config.name, token, {
    maxAge: config.maxAge,
    httpOnly: config.httpOnly,
    secure: config.secure,
    sameSite: config.sameSite,
    path: config.path,
  });

  redirect("/home");
}
