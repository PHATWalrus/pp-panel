-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "targets" (
    "id" TEXT NOT NULL,
    "status" TEXT,
    "intake_page_name" TEXT,
    "useragent" TEXT,
    "owner_group_id" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intake_states" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "gameplan_step" INTEGER NOT NULL DEFAULT 0,
    "force_load" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intake_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gameplans" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "pages" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gameplans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intake_events" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "input_title" TEXT,
    "input_value" TEXT,
    "interaction_title" TEXT,
    "checkpoint_status" TEXT,
    "checkpoint_resolution" TEXT,
    "checkpoint_type" TEXT,
    "checkpoint_dual_outcome" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intake_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intake_pages" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intake_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "intake_states_target_id_key" ON "intake_states"("target_id");

-- CreateIndex
CREATE UNIQUE INDEX "gameplans_target_id_key" ON "gameplans"("target_id");

-- CreateIndex
CREATE INDEX "intake_events_target_id_created_at_idx" ON "intake_events"("target_id", "created_at");

-- AddForeignKey
ALTER TABLE "intake_states" ADD CONSTRAINT "intake_states_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameplans" ADD CONSTRAINT "gameplans_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_events" ADD CONSTRAINT "intake_events_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

