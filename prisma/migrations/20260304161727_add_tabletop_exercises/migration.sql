-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "serviceDescription" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastAssessmentDate" TEXT NOT NULL,
    "inherentRiskScore" INTEGER NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VendorRisk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "riskTier" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "dataAccess" TEXT NOT NULL,
    "complianceCertifications" TEXT NOT NULL,
    "contractExpiry" TEXT NOT NULL,
    "lastAssessment" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VendorAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorRiskId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "findings" TEXT NOT NULL,
    "assessor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VendorAssessment_vendorRiskId_fkey" FOREIGN KEY ("vendorRiskId") REFERENCES "VendorRisk" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" DATETIME,
    "uploadedBy" TEXT NOT NULL,
    "uploadedByName" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "tags" TEXT,
    "frameworks" TEXT,
    "companyId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EvidenceLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evidenceId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "linkName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvidenceLink_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Objective" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "owner" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "keyResults" TEXT NOT NULL,
    "linkedRisks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "budgetAllocated" INTEGER NOT NULL,
    "budgetSpent" INTEGER NOT NULL,
    "linkedObjectives" TEXT NOT NULL,
    "linkedRisks" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "targetEndDate" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "phases" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" INTEGER NOT NULL,
    "actionUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" REAL NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Playbook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "phases" TEXT NOT NULL,
    "startTime" INTEGER,
    "endTime" INTEGER,
    "evidenceLog" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userName" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO'
);

-- CreateTable
CREATE TABLE "KnowledgeEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionText" TEXT NOT NULL,
    "questionNormalized" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "answerType" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "evidence" TEXT,
    "frameworks" TEXT,
    "source" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "confidence" REAL NOT NULL DEFAULT 1.0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" DATETIME,
    "jurisdiction" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "legalEntity" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "certifications" TEXT NOT NULL,
    "primaryCloud" TEXT NOT NULL,
    "additionalContext" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "dataTypes" TEXT NOT NULL,
    "hostingRegions" TEXT NOT NULL,
    "complianceScope" TEXT NOT NULL,
    "techStack" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "knowledgeEntryId" TEXT,
    "scope" TEXT NOT NULL,
    "companyId" TEXT,
    "productId" TEXT,
    "questionText" TEXT NOT NULL,
    "answerType" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "evidence" TEXT,
    "frameworks" TEXT,
    "notes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeOverride_knowledgeEntryId_fkey" FOREIGN KEY ("knowledgeEntryId") REFERENCES "KnowledgeEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "KnowledgeOverride_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "integrationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "config" TEXT NOT NULL DEFAULT '',
    "lastTestedAt" DATETIME,
    "lastTestResult" TEXT,
    "connectedBy" TEXT,
    "connectedAt" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TeamInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitedBy" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AttackSurfaceScan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAssets" INTEGER NOT NULL,
    "totalVulns" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "results" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TabletopScenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "severity" TEXT NOT NULL,
    "briefing" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "stakes" TEXT,
    "steps" TEXT NOT NULL,
    "modes" TEXT NOT NULL DEFAULT '["decision","discussion"]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TabletopSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "facilitatorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "totalDollars" INTEGER NOT NULL DEFAULT 0,
    "finalRepInternal" INTEGER NOT NULL DEFAULT 100,
    "finalRepExternal" INTEGER NOT NULL DEFAULT 100,
    "grade" TEXT,
    "participants" TEXT,
    "notes" TEXT,
    CONSTRAINT "TabletopSession_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "TabletopScenario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TabletopDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "stepId" INTEGER NOT NULL,
    "stepTime" TEXT NOT NULL,
    "stepTitle" TEXT NOT NULL,
    "choiceId" TEXT NOT NULL,
    "choiceLabel" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "dollarImpact" INTEGER NOT NULL,
    "repInternalDelta" INTEGER NOT NULL,
    "repExternalDelta" INTEGER NOT NULL,
    "consequence" TEXT NOT NULL,
    "cascadeFlag" TEXT,
    "decidedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TabletopDecision_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TabletopSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TabletopResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "stepId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "respondedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TabletopResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TabletopSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TabletopCommsDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "stepId" INTEGER NOT NULL,
    "audience" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "draft" TEXT NOT NULL,
    "draftedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TabletopCommsDraft_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TabletopSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "type" TEXT,
    "owner" TEXT,
    "authorId" TEXT,
    "frameworks" TEXT NOT NULL DEFAULT '[]',
    "controls" TEXT NOT NULL DEFAULT '[]',
    "sections" TEXT,
    "mappings" TEXT,
    "dependencies" TEXT,
    "acknowledgment" TEXT,
    "changelog" TEXT,
    "lastUpdated" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Policy_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Policy" ("authorId", "content", "controls", "frameworks", "id", "status", "title", "updatedAt", "version") SELECT "authorId", "content", "controls", "frameworks", "id", "status", "title", "updatedAt", "version" FROM "Policy";
DROP TABLE "Policy";
ALTER TABLE "new_Policy" RENAME TO "Policy";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "ssoProvider" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "name", "password", "role", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", "password", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_category_idx" ON "AuditLog"("category");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_integrationId_key" ON "Integration"("integrationId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvite_token_key" ON "TeamInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TabletopScenario_slug_key" ON "TabletopScenario"("slug");

-- CreateIndex
CREATE INDEX "TabletopSession_scenarioId_idx" ON "TabletopSession"("scenarioId");

-- CreateIndex
CREATE INDEX "TabletopDecision_sessionId_idx" ON "TabletopDecision"("sessionId");

-- CreateIndex
CREATE INDEX "TabletopResponse_sessionId_idx" ON "TabletopResponse"("sessionId");

-- CreateIndex
CREATE INDEX "TabletopCommsDraft_sessionId_idx" ON "TabletopCommsDraft"("sessionId");
