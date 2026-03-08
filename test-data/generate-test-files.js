/**
 * Generate test Excel files for CAIQ Knowledge Transfer testing
 * 
 * Creates:
 *   1. source_answered.xlsx — 30 Q&As from a completed CAIQ
 *   2. target_empty.xlsx — 25 questions (mix of identical, similar, and novel)
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generate() {
    const { default: ExcelJS } = await import('exceljs');
    const outDir = resolve(__dirname);

    // ═══════════════════════════════════════════
    // SOURCE FILE — Answered questionnaire
    // ═══════════════════════════════════════════
    const sourceWb = new ExcelJS.Workbook();
    const sourceWs = sourceWb.addWorksheet('CAIQ Responses');

    sourceWs.columns = [
        { header: 'Question ID', key: 'id', width: 14 },
        { header: 'Question', key: 'question', width: 70 },
        { header: 'Yes/No', key: 'yesNo', width: 8 },
        { header: 'Answer', key: 'answer', width: 90 },
    ];

    const sourceData = [
        { id: 'A&A-01', question: 'Are independent audit and assurance assessments conducted according to relevant industry standards?', yesNo: 'Yes', answer: 'Yes. Independent SOC 2 Type II audits are conducted annually by a qualified third-party audit firm. ISO 27001 certification is maintained with annual surveillance audits. Penetration testing is performed semi-annually by independent CREST-certified assessors.' },
        { id: 'A&A-02', question: 'Are audit findings documented, communicated to stakeholders, and remediation tracked?', yesNo: 'Yes', answer: 'Yes. All audit findings are documented in our GRC platform with severity classification. Findings are communicated to stakeholders within 5 business days. Remediation plans are tracked monthly by the security steering committee.' },
        { id: 'A&A-03', question: 'Is an information security management system (ISMS) established and reviewed?', yesNo: 'Yes', answer: 'Yes. An ISO 27001-aligned ISMS is established and maintained. The ISMS scope and Statement of Applicability are reviewed annually with continuous improvement processes.' },
        { id: 'AIS-01', question: 'Are application security requirements defined for APIs and interfaces?', yesNo: 'Yes', answer: 'Yes. All APIs are authenticated via OAuth 2.0/JWT and rate-limited. API gateway enforces schema validation, input sanitization, and TLS 1.2+ for all communications.' },
        { id: 'AIS-02', question: 'Is a secure software development lifecycle (SDLC) methodology adopted?', yesNo: 'Yes', answer: 'Yes. Secure SDLC incorporates threat modeling in design, SAST/DAST in development, dependency scanning in build, and security review before deployment. All developers complete annual secure coding training.' },
        { id: 'AIS-03', question: 'Are vulnerability assessments performed for applications?', yesNo: 'Yes', answer: 'Yes. Automated SAST scans run on every commit. DAST scans weekly against staging. Third-party pen testing semi-annually. Critical vulnerabilities remediated within 7 days per SLA.' },
        { id: 'BCR-01', question: 'Is a business continuity plan established and documented?', yesNo: 'Yes', answer: 'Yes. A comprehensive BCP is maintained covering all critical business functions with RTO of 4 hours and RPO of 1 hour for Tier 1 services. Plans reviewed annually.' },
        { id: 'BCR-02', question: 'Are business continuity and disaster recovery plans tested regularly?', yesNo: 'Yes', answer: 'Yes. BCP/DR tests include quarterly tabletop exercises, semi-annual partial failover tests, and annual full DR rehearsals. Results documented with lessons learned.' },
        { id: 'CEK-01', question: 'Is a cryptographic key management policy established?', yesNo: 'Yes', answer: 'Yes. Key management policy defines generation, distribution, storage, rotation, and destruction procedures. Keys managed via cloud KMS with HSM-backed storage. Rotation automated annually.' },
        { id: 'CEK-02', question: 'Is data encrypted at rest?', yesNo: 'Yes', answer: 'Yes. All data at rest encrypted using AES-256 including database storage (TDE), object storage (SSE-KMS), and volume encryption. Customer-managed key support available.' },
        { id: 'CEK-03', question: 'Is data encrypted in transit?', yesNo: 'Yes', answer: 'Yes. All data in transit encrypted using TLS 1.2+. HSTS enforced on all web endpoints. Internal service-to-service uses mutual TLS (mTLS). Legacy protocols disabled.' },
        { id: 'DSP-01', question: 'Is a data classification policy defined and implemented?', yesNo: 'Yes', answer: 'Yes. Four-tier classification (Public, Internal, Confidential, Restricted) with handling requirements and labeling standards. Automated DLP enforcement for Confidential and above.' },
        { id: 'DSP-02', question: 'Are data retention and disposal procedures established?', yesNo: 'Yes', answer: 'Yes. Retention schedules defined per data type aligned with legal/regulatory requirements. Automated deletion mechanisms. Physical media disposal follows NIST SP 800-88.' },
        { id: 'DSP-03', question: 'Is a privacy impact assessment performed for personal data processing?', yesNo: 'Yes', answer: 'Yes. DPIAs conducted prior to high-risk processing activities. Privacy by Design embedded in development lifecycle. A Data Protection Officer oversees compliance.' },
        { id: 'GRC-01', question: 'Is an information security governance framework established?', yesNo: 'Yes', answer: 'Yes. Governance framework with clear roles and authority. Security Steering Committee meets monthly, chaired by CISO. CISO reports to Board quarterly.' },
        { id: 'GRC-02', question: 'Is an enterprise risk management program established?', yesNo: 'Yes', answer: 'Yes. ERM program aligned with ISO 31000. Risk appetite defined by Board. Risk register maintained with quarterly reviews. Treatment plans tracked to closure.' },
        { id: 'HRS-01', question: 'Are background checks performed prior to employment?', yesNo: 'Yes', answer: 'Yes. Background verification for all employees and contractors including identity, criminal, education, and reference checks. Proportionate to role and data access level.' },
        { id: 'HRS-02', question: 'Is security awareness training provided to all employees?', yesNo: 'Yes', answer: 'Yes. Mandatory upon joining and annually. Covers phishing, social engineering, data handling, password security. 95% completion target. Monthly phishing simulations.' },
        { id: 'IAM-01', question: 'Is an identity and access management policy established?', yesNo: 'Yes', answer: 'Yes. IAM policy defines least privilege, need-to-know, and RBAC principles. Covers provisioning, deprovisioning, periodic reviews, and privileged access management.' },
        { id: 'IAM-02', question: 'Is multi-factor authentication implemented for privileged access?', yesNo: 'Yes', answer: 'Yes. MFA enforced for all privileged access, remote access, cloud console, and sensitive apps. Supported: FIDO2 hardware tokens, TOTP apps, push notifications. SMS deprecated.' },
        { id: 'IAM-03', question: 'Is the principle of least privilege applied?', yesNo: 'Yes', answer: 'Yes. Least privilege enforced via RBAC. Default-deny policies. Privilege escalation requires approval with time-limited grants. JIT access for production systems.' },
        { id: 'IAM-04', question: 'Are user access reviews performed periodically?', yesNo: 'Yes', answer: 'Yes. Quarterly reviews for privileged accounts, semi-annual for standard. Reviews by data/system owners with sign-off. Unjustified access revoked. 100% completion target.' },
        { id: 'IVS-01', question: 'Is network security managed through segmentation and firewalls?', yesNo: 'Yes', answer: 'Yes. Defense-in-depth with VPCs, security groups, NACLs, and micro-segmentation. Next-gen firewalls with IPS at perimeter. Internal traffic requires explicit allow rules.' },
        { id: 'IVS-02', question: 'Are hardened images used for server deployments?', yesNo: 'Yes', answer: 'Yes. CIS Benchmark-based golden images for all deployments. Rebuilt monthly with patches. Compliance continuously monitored with auto-remediation on drift.' },
        { id: 'IVS-03', question: 'Is a vulnerability management program established for infrastructure?', yesNo: 'Yes', answer: 'Yes. Weekly authenticated scans. Critical vulns remediated within 7 days, highs within 30. Patch management follows change control with automation where possible.' },
        { id: 'SEF-01', question: 'Is a security incident management process established?', yesNo: 'Yes', answer: 'Yes. Formal IRP with severity levels (P1-P4), escalation procedures, communication plans, and response playbooks. Dedicated CSIRT available 24/7. Post-incident reviews mandatory.' },
        { id: 'SEF-02', question: 'Is a SIEM or security monitoring solution deployed?', yesNo: 'Yes', answer: 'Yes. SIEM aggregates logs from all critical systems. Correlation rules aligned to MITRE ATT&CK. 24/7 SOC with defined response SLAs.' },
        { id: 'SEF-03', question: 'Are security logs retained for an adequate period?', yesNo: 'Yes', answer: 'Yes. 12 months online, 7 years archived. Tamper-protected write-once storage. Encrypted. Integrity verified via checksums. Meets regulatory requirements.' },
        { id: 'SEF-04', question: 'Are forensic investigation procedures defined?', yesNo: 'Yes', answer: 'Yes. Procedures cover evidence preservation, chain of custody, analysis, and reporting. Forensic tools and isolated environments maintained. Personnel trained in legal requirements.' },
        { id: 'SEF-05', question: 'Is breach notification performed in compliance with regulations?', yesNo: 'Yes', answer: 'Yes. Notification procedure compliant with GDPR (72-hour), state breach laws, and contracts. Pre-approved templates. Designated breach response team.' },
    ];

    sourceData.forEach(row => sourceWs.addRow(row));

    // Style header
    sourceWs.getRow(1).font = { bold: true };

    await sourceWb.xlsx.writeFile(join(outDir, 'source_answered.xlsx'));
    console.log('✅ Created source_answered.xlsx (30 Q&As)');

    // ═══════════════════════════════════════════
    // TARGET FILE — Empty questionnaire
    // Mix: ~15 identical IDs, ~5 rephrased, ~5 novel
    // ═══════════════════════════════════════════
    const targetWb = new ExcelJS.Workbook();
    const targetWs = targetWb.addWorksheet('Security Questionnaire');

    targetWs.columns = [
        { header: 'Control ID', key: 'id', width: 14 },
        { header: 'Security Question', key: 'question', width: 70 },
        { header: 'Yes/No', key: 'yesNo', width: 8 },
        { header: 'Response', key: 'answer', width: 90 },
    ];

    const targetData = [
        // ── Tier 1 candidates: Identical IDs ──
        { id: 'A&A-01', question: 'Are independent audit and assurance assessments conducted according to relevant industry standards?' },
        { id: 'A&A-02', question: 'Are audit findings documented, communicated to stakeholders, and remediation tracked?' },
        { id: 'AIS-01', question: 'Are application security requirements defined for APIs and interfaces?' },
        { id: 'AIS-02', question: 'Is a secure software development lifecycle (SDLC) methodology adopted?' },
        { id: 'BCR-01', question: 'Is a business continuity plan established and documented?' },
        { id: 'CEK-01', question: 'Is a cryptographic key management policy established?' },
        { id: 'CEK-02', question: 'Is data encrypted at rest?' },
        { id: 'CEK-03', question: 'Is data encrypted in transit?' },
        { id: 'DSP-01', question: 'Is a data classification policy defined and implemented?' },
        { id: 'IAM-01', question: 'Is an identity and access management policy established?' },
        { id: 'IAM-02', question: 'Is multi-factor authentication implemented for privileged access?' },
        { id: 'IAM-03', question: 'Is the principle of least privilege applied?' },
        { id: 'IVS-01', question: 'Is network security managed through segmentation and firewalls?' },
        { id: 'SEF-01', question: 'Is a security incident management process established?' },
        { id: 'SEF-02', question: 'Is a SIEM or security monitoring solution deployed?' },

        // ── Tier 2 candidates: Rephrased questions (should match semantically) ──
        { id: 'SIG-Q1', question: 'Does your organization conduct regular penetration testing and vulnerability assessments on applications?' },
        { id: 'SIG-Q2', question: 'How does your organization manage encryption keys and what KMS solution is used?' },
        { id: 'SIG-Q3', question: 'Describe your employee offboarding process and how access is revoked upon termination.' },
        { id: 'SIG-Q4', question: 'What data loss prevention (DLP) controls are in place to prevent unauthorized data exfiltration?' },
        { id: 'SIG-Q5', question: 'How are privileged access accounts monitored and what PAM solution is deployed?' },

        // ── Tier 3 candidates: Novel questions (no direct source match) ──
        { id: 'CUSTOM-01', question: 'Does your organization have a responsible AI policy governing the use of machine learning models in production?' },
        { id: 'CUSTOM-02', question: 'Is a software bill of materials (SBOM) generated and maintained for all production applications?' },
        { id: 'CUSTOM-03', question: 'Does the organization participate in any threat intelligence sharing programs such as ISACs?' },
        { id: 'CUSTOM-04', question: 'Are containerized workloads scanned for vulnerabilities before deployment to production clusters?' },
        { id: 'CUSTOM-05', question: 'Is there a formal process for evaluating and approving open-source software dependencies?' },
    ];

    targetData.forEach(row => targetWs.addRow({ id: row.id, question: row.question, yesNo: '', answer: '' }));

    targetWs.getRow(1).font = { bold: true };

    await targetWb.xlsx.writeFile(join(outDir, 'target_empty.xlsx'));
    console.log('✅ Created target_empty.xlsx (25 questions: 15 identical, 5 rephrased, 5 novel)');
    console.log('\nReady to test! Upload both files to Knowledge Transfer tab.');
}

generate().catch(console.error);
