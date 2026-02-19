#!/bin/bash

DB_FILE="dev.db"

# 1. Create User (CISO)
sqlite3 $DB_FILE "INSERT INTO User (id, email, name, password, role, createdAt, updatedAt) VALUES ('cm6f12345678', 'ciso@astra.ai', 'Sarah Connor', '\$2b\$10\$3/W6493c0V4EVK9Wf9cPkemeI1RVECDqaOA/GcqUUy9ILhu9dGoZK', 'CISO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(email) DO UPDATE SET password=excluded.password;"

# 2. Get User ID
USER_ID=$(sqlite3 $DB_FILE "SELECT id FROM User WHERE email='ciso@astra.ai';")

# 3. Create Risk Scenarios (5 FAIR-based)
sqlite3 $DB_FILE "INSERT INTO RiskScenario (id, title, description, ownerId, status, threatActor, threatEventFreq, vulnerability, primaryLoss, secondaryLoss, controlsEffective, ale, riskScore, createdAt, updatedAt) VALUES
('RS-001', 'Production Infrastructure', 'Ransomware scenario — enhancing EDR coverage.', '$USER_ID', 'MITIGATING', 'CYBER_CRIMINAL', 2.5, 0.3, 2000000, 1500000, 0.5, 310000, 65, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('RS-002', 'Vendor Data Pipeline', 'Third-party breach risk. Vendor assessment in progress.', '$USER_ID', 'OPEN', 'CYBER_CRIMINAL', 3.0, 0.5, 800000, 700000, 0.3, 470000, 77, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('RS-003', 'Confidential Employee Data', 'Insider threat. DLP deployed and monitoring.', '$USER_ID', 'MITIGATING', 'INSIDER', 1.0, 0.25, 500000, 1500000, 0.6, 70000, 35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('RS-004', 'Cloud Infrastructure (AWS)', 'Misconfiguration exposure. CSPM tool deployment in progress.', '$USER_ID', 'OPEN', 'SCRIPT_KIDDIE', 10.0, 0.15, 200000, 300000, 0.4, 160000, 67, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('RS-005', 'Customer PII Database', 'GDPR regulatory risk. DPIA completed. Article 30 ROPA maintained.', '$USER_ID', 'ACCEPTED', 'NATION_STATE', 0.5, 0.2, 1000000, 3000000, 0.7, 65000, 22, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET
  title=excluded.title, description=excluded.description, status=excluded.status,
  threatActor=excluded.threatActor, threatEventFreq=excluded.threatEventFreq,
  vulnerability=excluded.vulnerability, primaryLoss=excluded.primaryLoss,
  secondaryLoss=excluded.secondaryLoss, controlsEffective=excluded.controlsEffective,
  ale=excluded.ale, riskScore=excluded.riskScore;"

# 4. Create Risk History
sqlite3 $DB_FILE "INSERT INTO RiskHistory (id, riskScenarioId, date, score, ale) VALUES
('rh-001a', 'RS-001', '2025-11-01', 78, 420000),
('rh-001b', 'RS-001', '2025-12-01', 72, 380000),
('rh-001c', 'RS-001', '2026-01-01', 68, 340000),
('rh-001d', 'RS-001', '2026-02-01', 65, 310000),
('rh-002a', 'RS-002', '2025-11-01', 82, 510000),
('rh-002b', 'RS-002', '2025-12-01', 85, 530000),
('rh-002c', 'RS-002', '2026-01-01', 80, 490000),
('rh-002d', 'RS-002', '2026-02-01', 77, 470000),
('rh-003a', 'RS-003', '2025-11-01', 45, 110000),
('rh-003b', 'RS-003', '2025-12-01', 42, 95000),
('rh-003c', 'RS-003', '2026-01-01', 38, 80000),
('rh-003d', 'RS-003', '2026-02-01', 35, 70000),
('rh-004a', 'RS-004', '2026-01-01', 70, 175000),
('rh-004b', 'RS-004', '2026-02-01', 67, 160000),
('rh-005a', 'RS-005', '2025-11-01', 30, 90000),
('rh-005b', 'RS-005', '2025-12-01', 28, 80000),
('rh-005c', 'RS-005', '2026-01-01', 25, 72000),
('rh-005d', 'RS-005', '2026-02-01', 22, 65000)
ON CONFLICT(id) DO NOTHING;"

# 5. Create Policy
sqlite3 $DB_FILE "INSERT INTO Policy (id, title, content, version, status, authorId, frameworks, controls, updatedAt) VALUES ('pol_001', 'Global Password Standard', '# Password Policy\n\n1. Minimum 14 characters.\n2. MFA required.', '1.0.0', 'APPROVED', '$USER_ID', '[\"NIST_CSF_2_0\", \"ISO_27001\"]', '[\"PR.AC-1\", \"A.9.2\"]', CURRENT_TIMESTAMP) ON CONFLICT(id) DO NOTHING;"

echo "✅ Seed complete via Shell!"
