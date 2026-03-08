/**
 * Quick test: verify export fills the original target file (Tier 1 only, no AI wait)
 */


async function test() {
    const { default: fs } = await import('fs');
    const { default: ExcelJS } = await import('exceljs');
    const { FormData, File, fetch } = await import('undici');

    const sourceFile = fs.readFileSync('test-data/source_answered.xlsx');
    const targetFile = fs.readFileSync('test-data/target_empty.xlsx');

    // Step 1: Process (Tier 1 only - fast, no AI needed for identical IDs)
    const form = new FormData();
    form.append('source', new File([sourceFile], 'source_answered.xlsx'));
    form.append('target', new File([targetFile], 'target_empty.xlsx'));
    form.append('action', 'process');

    console.log('1. Processing (expecting 15 Tier 1 matches)...');
    const res = await fetch('http://localhost:3000/api/vendors/caiq/transfer', {
        method: 'POST', body: form
    });
    const data = await res.json();

    if (!res.ok) { console.error('FAIL: Process error:', data.error); process.exit(1); }
    console.log('   Stats:', JSON.stringify(data.stats));
    console.log('   targetBase64 present:', !!data.targetBase64, '(' + (data.targetBase64?.length || 0) + ' chars)');

    // Step 2: Export using the targetBase64
    const exportForm = new FormData();
    exportForm.append('action', 'export');
    exportForm.append('answers', JSON.stringify(data.answers));
    exportForm.append('targetBase64', data.targetBase64);

    console.log('\n2. Exporting filled target file...');
    const exportRes = await fetch('http://localhost:3000/api/vendors/caiq/transfer', {
        method: 'POST', body: exportForm
    });
    const exportData = await exportRes.json();

    if (!exportRes.ok) { console.error('FAIL: Export error:', exportData.error); process.exit(1); }

    const buf = Buffer.from(exportData.exportBase64, 'base64');
    fs.writeFileSync('test-data/target_FILLED.xlsx', buf);
    console.log('   Saved: test-data/target_FILLED.xlsx (' + (buf.length / 1024).toFixed(1) + ' KB)');

    // Step 3: Verify the filled file
    console.log('\n3. Verifying filled file...');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile('test-data/target_FILLED.xlsx');

    // Check main sheet
    const ws = wb.worksheets[0];
    console.log('   Sheet: "' + ws.name + '" — ' + ws.rowCount + ' rows, ' + ws.columnCount + ' cols');

    // Print all headers
    const headers = [];
    ws.getRow(1).eachCell((cell, col) => headers.push(col + ':' + cell.value));
    console.log('   Headers: ' + headers.join(' | '));

    // Count filled vs empty answer cells
    let filled = 0, empty = 0;
    for (let r = 2; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        // Check column 4 first (original Response column), then try all columns
        let hasAnswer = false;
        row.eachCell((cell, col) => {
            const val = String(cell.value || '');
            if (val.length > 30 && col >= 3) hasAnswer = true;
        });
        if (hasAnswer) filled++; else empty++;
    }
    console.log('\n   RESULT: ' + filled + '/' + (filled + empty) + ' rows have answers filled');

    // Print 3 sample rows
    console.log('\n   Sample filled rows:');
    let printed = 0;
    for (let r = 2; r <= ws.rowCount && printed < 3; r++) {
        const row = ws.getRow(r);
        const id = row.getCell(1).value;
        const yn = row.getCell(3).value;
        const ans = String(row.getCell(4).value || '');
        if (ans.length > 10) {
            console.log('   [' + id + '] YN=' + yn + ' | ' + ans.slice(0, 80) + '...');
            printed++;
        }
    }

    // Check Transfer Summary sheet
    const summary = wb.getWorksheet('Transfer Summary');
    if (summary) {
        console.log('\n   Transfer Summary sheet: YES');
        for (let r = 1; r <= Math.min(9, summary.rowCount); r++) {
            const row = summary.getRow(r);
            console.log('     ' + (row.getCell(1).value || '') + ': ' + (row.getCell(2).value || ''));
        }
    } else {
        console.log('\n   Transfer Summary sheet: NO');
    }

    console.log('\nDONE');
}

test().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
