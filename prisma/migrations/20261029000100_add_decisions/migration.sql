-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT '',
    "recommendationAction" TEXT NOT NULL,
    "recommendationSummary" TEXT NOT NULL,
    "recommendationRationale" TEXT NOT NULL DEFAULT '',
    "confidenceValue" INTEGER NOT NULL DEFAULT 0,
    "confidenceLabel" TEXT NOT NULL DEFAULT 'LOW',
    "source" TEXT NOT NULL DEFAULT 'SKILL',
    "skillRunId" TEXT,
    "sourceResourceType" TEXT,
    "sourceResourceId" TEXT,
    "evidenceIds" TEXT NOT NULL DEFAULT '[]',
    "executionType" TEXT,
    "executionPayload" TEXT,
    "decidedById" TEXT,
    "decidedByName" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNotes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Decision_status_urgency_idx" ON "Decision"("status", "urgency");
CREATE INDEX "Decision_pillar_idx" ON "Decision"("pillar");
CREATE INDEX "Decision_sourceResourceType_sourceResourceId_idx" ON "Decision"("sourceResourceType", "sourceResourceId");
CREATE INDEX "Decision_skillRunId_idx" ON "Decision"("skillRunId");
