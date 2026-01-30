import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import { Policy } from "./policy-store";

export const exportToDocx = async (policy: Policy) => {
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        text: "ASTRA | Governance Engine",
                        heading: HeadingLevel.HEADING_4,
                    }),
                    new Paragraph({ text: "" }), // Filler
                    new Paragraph({
                        text: policy.title,
                        heading: HeadingLevel.HEADING_1,
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Policy Type: ", bold: true }),
                            new TextRun(policy.type),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Version: ", bold: true }),
                            new TextRun(policy.version),
                            new TextRun({ text: " | Status: ", bold: true }),
                            new TextRun(policy.status),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Owner: ", bold: true }),
                            new TextRun(policy.owner),
                        ],
                    }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),

                    // Sections
                    ...policy.sections.flatMap(section => [
                        new Paragraph({
                            text: section.title,
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 400, after: 200 }
                        }),
                        new Paragraph({
                            children: [new TextRun(section.content)],
                            spacing: { after: 200 }
                        }),
                    ]),

                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "--- End of Document ---", alignment: "center" }),
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${policy.title.replace(/\s+/g, '_')}_v${policy.version}.docx`);
};

export const exportToPdf = (policy: Policy) => {
    const doc = new jsPDF();

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("ASTRA | Governance Engine", 14, 10);

    doc.setFontSize(22);
    doc.setTextColor(0);
    doc.text(policy.title, 14, 20);

    doc.setFontSize(11);
    doc.text(`Type: ${policy.type}`, 14, 30);
    doc.text(`Version: ${policy.version} (${policy.status})`, 14, 36);
    doc.text(`Owner: ${policy.owner}`, 14, 42);

    let yPos = 55;

    policy.sections.forEach(section => {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(section.title, 14, yPos);
        yPos += 7;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");

        const splitText = doc.splitTextToSize(section.content, 180);
        doc.text(splitText, 14, yPos);

        yPos += (splitText.length * 5) + 10;

        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
    });

    doc.save(`${policy.title.replace(/\s+/g, '_')}_v${policy.version}.pdf`);
};

export interface ExecutiveReportData {
    date: string;
    complianceScore: number;
    activeRisks: number;
    openIncidents: number;
    vendorRiskScore: number;
    topRisks: { title: string; severity: string }[];
}

export const generateExecutiveReport = (data: ExecutiveReportData) => {
    const doc = new jsPDF();

    // Header / Branding
    doc.setFillColor(15, 23, 42); // Slate-900 like
    doc.rect(0, 0, 220, 40, "F");

    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text("Executive Cybersecurity Report", 14, 25);
    doc.setFontSize(10);
    doc.text(`Generated: ${data.date}`, 14, 35);
    doc.text("CONFIDENTIAL - BOARD EYES ONLY", 150, 35);

    // Executive Summary Section
    let yPos = 55;
    doc.setTextColor(0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary", 14, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
        "This report provides a high-level overview of the organization's cybersecurity posture, highlighting key performance indicators (KPIs), active risks, and compliance status.",
        14, yPos, { maxWidth: 180 }
    );
    yPos += 20;

    // KPI Grid Simulation
    const drawKpi = (label: string, value: string, color: [number, number, number], x: number, y: number) => {
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(x, y, 55, 30, 2, 2, "F");
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(label, x + 5, y + 10);
        doc.setFontSize(16);
        doc.setTextColor(...color);
        doc.setFont("helvetica", "bold");
        doc.text(value, x + 5, y + 22);
    };

    drawKpi("Compliance Score", `${data.complianceScore}%`, [16, 185, 129], 14, yPos); // Emerald
    drawKpi("Active Critical Risks", `${data.activeRisks}`, [239, 68, 68], 74, yPos);   // Red
    drawKpi("Open Incidents", `${data.openIncidents}`, [245, 158, 11], 134, yPos);      // Amber

    yPos += 40;

    // Top Risks Table-ish
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Top Enterprise Risks", 14, yPos);
    yPos += 10;

    data.topRisks.forEach((risk, i) => {
        doc.setFillColor(250, 250, 250);
        doc.rect(14, yPos, 180, 10, "F");

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(risk.title, 16, yPos + 7);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(risk.severity === 'Critical' ? 220 : 0, 0, 0);
        doc.text(risk.severity, 170, yPos + 7);

        yPos += 12;
        doc.setTextColor(0);
    });

    yPos += 10;

    // Vendor Risk Summary
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Vendor Risk Overview", 14, yPos);
    yPos += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Current average vendor risk score is ${data.vendorRiskScore}/100. Supply chain monitoring is active.`, 14, yPos);

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Generated by Astra AI | CISO Command Platform", 14, 280);

    doc.save(`Astra_Executive_Report_${data.date.replace(/[\/:\s]/g, '-')}.pdf`);
};
