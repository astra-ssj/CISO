-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "ssoProvider" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Authenticator" (
    "credentialID" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT,

    CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("userId","credentialID")
);

-- CreateTable
CREATE TABLE "RiskScenario" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "threatActor" TEXT NOT NULL,
    "threatEventFreq" DOUBLE PRECISION NOT NULL,
    "vulnerability" DOUBLE PRECISION NOT NULL,
    "primaryLoss" DOUBLE PRECISION NOT NULL,
    "secondaryLoss" DOUBLE PRECISION NOT NULL,
    "controlsEffective" DOUBLE PRECISION NOT NULL,
    "ale" DOUBLE PRECISION NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScenarioHistory" (
    "id" TEXT NOT NULL,
    "riskScenarioId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "ale" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RiskScenarioHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "likelihood" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "inherentScore" INTEGER NOT NULL,
    "residualScore" INTEGER,
    "owner" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "treatmentPlan" TEXT,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskHistory" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commanderId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentEvent" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "website" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "dataAccess" TEXT NOT NULL,
    "riskTier" TEXT NOT NULL,
    "riskScore" INTEGER,
    "status" TEXT NOT NULL,
    "complianceCertifications" TEXT NOT NULL,
    "lastAssessedAt" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorAssessment" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallScore" INTEGER NOT NULL,
    "domainScores" TEXT NOT NULL,
    "criticalGaps" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "assessedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "uploadedBy" TEXT NOT NULL,
    "uploadedByName" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "tags" TEXT,
    "frameworks" TEXT,
    "companyId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceLink" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "linkName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objective" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "owner" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "keyResults" TEXT NOT NULL,
    "linkedRisks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" BIGINT NOT NULL,
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playbook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "phases" TEXT NOT NULL,
    "startTime" INTEGER,
    "endTime" INTEGER,
    "evidenceLog" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "severity" TEXT NOT NULL DEFAULT 'INFO',

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeEntry" (
    "id" TEXT NOT NULL,
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
    "approvedAt" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3),
    "jurisdiction" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalEntity" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "certifications" TEXT NOT NULL,
    "primaryCloud" TEXT NOT NULL,
    "additionalContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "dataTypes" TEXT NOT NULL,
    "hostingRegions" TEXT NOT NULL,
    "complianceScope" TEXT NOT NULL,
    "techStack" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeOverride" (
    "id" TEXT NOT NULL,
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
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "config" TEXT NOT NULL DEFAULT '',
    "lastTestedAt" TIMESTAMP(3),
    "lastTestResult" TEXT,
    "connectedBy" TEXT,
    "connectedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttackSurfaceScan" (
    "id" TEXT NOT NULL,
    "scanDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAssets" INTEGER NOT NULL,
    "totalVulns" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "results" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "AttackSurfaceScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabletopScenario" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TabletopScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabletopSession" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "facilitatorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "totalDollars" INTEGER NOT NULL DEFAULT 0,
    "finalRepInternal" INTEGER NOT NULL DEFAULT 100,
    "finalRepExternal" INTEGER NOT NULL DEFAULT 100,
    "grade" TEXT,
    "participants" TEXT,
    "notes" TEXT,

    CONSTRAINT "TabletopSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabletopDecision" (
    "id" TEXT NOT NULL,
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
    "confidence" TEXT,
    "cascadeFlag" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TabletopDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabletopResponse" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "stepId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TabletopResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabletopCommsDraft" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "stepId" INTEGER NOT NULL,
    "audience" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "draft" TEXT NOT NULL,
    "draftedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TabletopCommsDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "errorCode" TEXT,
    "payloadSha256" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillRun" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "skillVersion" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "outputJson" TEXT NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,
    "observationIds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillRun_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "skillRunId" TEXT NOT NULL,
    "observationIds" TEXT NOT NULL DEFAULT '[]',
    "decision" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "plugin" TEXT,
    "payload" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Authenticator_credentialID_key" ON "Authenticator"("credentialID");

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

-- CreateIndex
CREATE INDEX "Observation_integrationId_operation_requestKey_fetchedAt_idx" ON "Observation"("integrationId", "operation", "requestKey", "fetchedAt");

-- CreateIndex
CREATE INDEX "SkillRun_skillId_inputHash_idx" ON "SkillRun"("skillId", "inputHash");

-- CreateIndex
CREATE INDEX "SkillRun_createdAt_idx" ON "SkillRun"("createdAt");

-- CreateIndex
CREATE INDEX "Decision_status_urgency_idx" ON "Decision"("status", "urgency");

-- CreateIndex
CREATE INDEX "Decision_pillar_idx" ON "Decision"("pillar");

-- CreateIndex
CREATE INDEX "Decision_sourceResourceType_sourceResourceId_idx" ON "Decision"("sourceResourceType", "sourceResourceId");

-- CreateIndex
CREATE INDEX "Decision_skillRunId_idx" ON "Decision"("skillRunId");

-- CreateIndex
CREATE INDEX "Approval_skillRunId_idx" ON "Approval"("skillRunId");

-- CreateIndex
CREATE INDEX "Approval_createdAt_idx" ON "Approval"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScenario" ADD CONSTRAINT "RiskScenario_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScenarioHistory" ADD CONSTRAINT "RiskScenarioHistory_riskScenarioId_fkey" FOREIGN KEY ("riskScenarioId") REFERENCES "RiskScenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskHistory" ADD CONSTRAINT "RiskHistory_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_commanderId_fkey" FOREIGN KEY ("commanderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentEvent" ADD CONSTRAINT "IncidentEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAssessment" ADD CONSTRAINT "VendorAssessment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceLink" ADD CONSTRAINT "EvidenceLink_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeOverride" ADD CONSTRAINT "KnowledgeOverride_knowledgeEntryId_fkey" FOREIGN KEY ("knowledgeEntryId") REFERENCES "KnowledgeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeOverride" ADD CONSTRAINT "KnowledgeOverride_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabletopSession" ADD CONSTRAINT "TabletopSession_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "TabletopScenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabletopDecision" ADD CONSTRAINT "TabletopDecision_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TabletopSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabletopResponse" ADD CONSTRAINT "TabletopResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TabletopSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabletopCommsDraft" ADD CONSTRAINT "TabletopCommsDraft_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TabletopSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
