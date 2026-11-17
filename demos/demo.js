'use strict';
/* Original, browser-only interactive examples. All sample records are fictional.
   No network requests, file uploads, PDF parsing, or production ERP integration. */
(function () {
  const el = id => document.getElementById(id);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  function metrics(pairs) {
    return '<div class="lab-metrics">' + pairs.map(pair =>
      '<div class="lab-metric"><b>' + escapeHtml(pair[1]) + '</b><small>' + escapeHtml(pair[0]) + '</small></div>'
    ).join('') + '</div>';
  }
  function table(headers, rows) {
    return '<div class="lab-tablewrap"><table class="lab-table"><thead><tr>' +
      headers.map(s => '<th scope="col">' + escapeHtml(s) + '</th>').join('') +
      '</tr></thead><tbody>' + rows.map(row => '<tr>' + row.map(v =>
        '<td>' + escapeHtml(v) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>';
  }
  function status(label, type) {
    return '<div role="status" class="lab-status' + (type ? ' ' + type : '') + '">' + escapeHtml(label) + '</div>';
  }
  function setOutput(id, value) { el(id).innerHTML = value; }
  function issueRows(items) {
    return items.length ? table(['Item', 'Why it needs review'], items.map(item => [item.id, item.reason])) : '';
  }

  const verifiedItems = new Set(['PLATE-101', 'BAR-205', 'ANGLE-310', 'TUBE-444', 'BOLT-008', 'PANEL-502']);
  const bomBase = [
    { id: 'PLATE-101', qty: 2, wc: 'CUT-01' },
    { id: 'BAR-205', qty: 4, wc: 'CUT-01' },
    { id: 'ANGLE-310', qty: 3, wc: 'FAB-02' },
    { id: 'TUBE-444', qty: 1, wc: 'FAB-02' },
    { id: 'BOLT-008', qty: 24, wc: 'FIN-03' },
    { id: 'PANEL-502', qty: 1, wc: 'FIN-03' }
  ];
  function renderBom() {
    const scenario = el('bom-scenario').value;
    const records = bomBase.map(x => Object.assign({}, x));
    if (scenario === 'missing-wc') records[2].wc = '';
    if (scenario === 'unknown') records[4].id = 'ITEM-999';
    if (scenario === 'invalid-qty') records[1].qty = 0;
    const grouped = new Map(), exceptions = [], summary = [];
    records.forEach((row, i) => {
      const problems = [];
      if (!verifiedItems.has(row.id)) problems.push('Item is not in the fictional inventory master');
      if (!Number.isFinite(row.qty) || row.qty <= 0) problems.push('Quantity must be greater than zero');
      if (!row.wc) problems.push('Work center is missing');
      if (problems.length) {
        exceptions.push({ id: row.id, reason: problems.join('; ') });
        summary.push([String(i + 1), row.id, String(row.qty), row.wc || '(missing)', 'HOLD']);
      } else {
        if (!grouped.has(row.wc)) grouped.set(row.wc, []);
        grouped.get(row.wc).push(row);
        summary.push([String(i + 1), row.id, String(row.qty), row.wc, 'VALIDATED']);
      }
    });
    const nValid = records.length - exceptions.length;
    let out = status(exceptions.length ?
      'Review required: ' + exceptions.length + ' line(s) withheld from import previews.' :
      'Validation passed: all six fictional lines are ready for the import-review handoff.',
      exceptions.length ? 'warn' : '');
    out += metrics([['Drawing lines', records.length], ['Validated', nValid], ['Held for review', exceptions.length], ['Work-center batches', grouped.size]]);
    out += '<h3>Drawing-line validation</h3>' + table(['Line', 'Inventory ID', 'Quantity', 'Work center', 'Status'], summary);
    out += '<h3>Prepared work-center batches</h3>';
    if (grouped.size) {
      out += '<div class="lab-batches">' + [...grouped].map(pair =>
        '<div class="lab-batch"><b>' + escapeHtml(pair[0]) + ' · ' + pair[1].length + ' line(s)</b><p>' +
        pair[1].map(r => escapeHtml(r.id) + ' — Qty ' + escapeHtml(r.qty)).join('<br>') + '</p></div>'
      ).join('') + '</div>';
    } else out += '<div class="lab-empty">No validated lines to preview.</div>';
    if (exceptions.length) out += '<h3>Exception review queue</h3>' + issueRows(exceptions);
    out += '<h3>ERP review handoff</h3><p>1. Confirm held lines and work-center assignments. 2. Import approved batches into the ERP. 3. Review imported components and quantities inside the ERP before final approval.</p>';
    setOutput('bom-results', out);
  }

  function parseLength(value) {
    const v = value.trim();
    let m = /^(\d+)\s+(\d+)\/(\d+)$/.exec(v);
    if (m) { const den = Number(m[3]); return den > 0 && Number(m[2]) < den ? Number(m[1]) + Number(m[2]) / den : NaN; }
    m = /^(\d+)\/(\d+)$/.exec(v);
    if (m) { const den = Number(m[2]); return den > 0 ? Number(m[1]) / den : NaN; }
    if (/^\d+(?:\.\d+)?$/.test(v)) return Number(v);
    return NaN;
  }
  const normOriginal = el('norm-input').value;
  function renderNormalizer() {
    const lines = el('norm-input').value.split(/\r?\n/).map(x => x.trim()).filter(Boolean).slice(0,50);
    let passed = 0, flagged = 0, rows = [];
    lines.forEach((line, i) => {
      const parts = line.split(',').map(x => x.trim());
      const qty = Number(parts[1]), len = parseLength(parts[2] || '');
      const valid = parts.length === 3 && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(parts[0]) &&
        parts[1] !== '' && Number.isFinite(qty) && qty > 0 &&
        Number.isFinite(len) && len > 0;
      if (valid) passed++; else flagged++;
      rows.push([
        String(i + 1), parts[0] || '(missing)', parts[1] || '(missing)',
        parts[2] || '(missing)', valid ? len.toFixed(3) : '—',
        valid ? (qty * len).toFixed(3) : '—', valid ? 'VALIDATED' : 'REVIEW'
      ]);
    });
    let out = status(flagged ? flagged + ' line(s) need review. No invalid extensions are generated.' :
      'All sample lines validated and extended.', flagged ? 'warn' : '');
    out += metrics([['Rows supplied', lines.length], ['Validated', passed], ['Needs review', flagged], ['Limit', '50 rows']]);
    out += '<h3>Normalized output preview</h3>' + (rows.length ? table(['Row','Inventory ID','Qty','Original length','Length (decimal)','Extended length','Status'], rows) : '<div class="lab-empty">Enter sample parts to begin.</div>');
    out += '<p>Lengths are unitless for this demonstration. Real drawings require defined measurement units and additional engineering controls.</p>';
    setOutput('norm-results', out);
  }

  const invoices = [
    { customer: 'Willow Manufacturing', number: 'INV-1002', due: '2026-11-30', amount: 1520 },
    { customer: 'Cedar Industries', number: 'INV-1003', due: '2026-11-01', amount: 2840 },
    { customer: 'Harbor Tools', number: 'INV-1004', due: '2026-10-10', amount: 910 },
    { customer: 'Maple Engineering', number: 'INV-1005', due: '2026-09-08', amount: 1980 },
    { customer: 'Aspen Equipment', number: 'INV-1006', due: '2026-07-01', amount: 630 }
  ];
  function utcDay(s) {
    const bits = s.split('-').map(Number);
    return Date.UTC(bits[0], bits[1] - 1, bits[2]);
  }
  function renderAr() {
    const day = el('ar-date').value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      setOutput('ar-results', status('Choose an as-of date.', 'danger'));
      return;
    }
    const buckets = { Current: 0, '1–30': 0, '31–60': 0, '61–90': 0, '90+': 0 };
    const data = invoices.map(inv => {
      const overdue = Math.floor((utcDay(day) - utcDay(inv.due)) / 86400000);
      const bucket = overdue <= 0 ? 'Current' : overdue <= 30 ? '1–30' : overdue <= 60 ? '31–60' : overdue <= 90 ? '61–90' : '90+';
      buckets[bucket] += inv.amount;
      return [inv.customer, inv.number, inv.due, money(inv.amount), overdue <= 0 ? 'Current' : String(overdue) + ' days', bucket];
    });
    const total = invoices.reduce((sum, v) => sum + v.amount, 0);
    let out = status('AR aging recalculated as of ' + day + '.', '');
    out += metrics([['Open balance', money(total)], ['Current', money(buckets.Current)], ['1–30 days', money(buckets['1–30'])], ['31–60 days', money(buckets['31–60'])], ['61–90 days', money(buckets['61–90'])], ['90+ days', money(buckets['90+'])]]);
    out += '<h3>Fictional customer invoices</h3>' + table(['Customer','Invoice','Due date','Balance','Overdue','Aging bucket'], data);
    out += '<p>All overdue buckets are calculated from the <strong>due date</strong>, not invoice date.</p>';
    setOutput('ar-results', out);
  }

  const apBatches = {
    mixed: [
      { source:'received_001.pdf', vendor:'Northwood Metals', number:'NM-1402', po:'PO-3021', checksum:'A' },
      { source:'image_scan_02.pdf', vendor:'Harbor Supplies', number:'HS-882', po:'PO-3042', checksum:'B', scanned:true },
      { source:'forwarded_copy.pdf', vendor:'Northwood Metals', number:'NM-1402', po:'PO-3021', checksum:'A' },
      { source:'unknown_partner.pdf', vendor:'New Vendor Ltd', number:'NV-991', po:'PO-3077', checksum:'C', unlisted:true },
      { source:'invoice_missing_id.pdf', vendor:'Cedar Systems', number:'', po:'PO-3110', checksum:'D' }
    ],
    clean: [
      { source:'email_01.pdf', vendor:'Northwood Metals', number:'NM-1403', po:'PO-3022', checksum:'E' },
      { source:'email_02.pdf', vendor:'Cedar Systems', number:'CS-502', po:'PO-3109', checksum:'F' },
      { source:'email_03.pdf', vendor:'Harbor Supplies', number:'HS-883', po:'PO-3043', checksum:'G' }
    ],
    exceptions: [
      { source:'original.pdf', vendor:'Northwood Metals', number:'NM-1402', po:'PO-3021', checksum:'A' },
      { source:'reissued.pdf', vendor:'Northwood Metals', number:'NM-1402', po:'PO-3021', checksum:'DIFFERENT' },
      { source:'new_vendor.pdf', vendor:'New Vendor Ltd', number:'NV-992', po:'', checksum:'H', unlisted:true },
      { source:'no_invoice.pdf', vendor:'Cedar Systems', number:'', po:'PO-3109', checksum:'I' }
    ]
  };
  function renderAp() {
    const documents = apBatches[el('ap-scenario').value] || apBatches.mixed;
    const seen = new Map();
    let filed = 0, check = 0, dup = 0, review = 0;
    const results = documents.map(doc => {
      const key = doc.vendor + '|' + doc.number;
      let state = '', result = '';
      if (!doc.number) {
        review++; state = 'NEEDS REVIEW'; result = 'Invoice number missing; no automatic filing';
      } else if (doc.unlisted) {
        review++; state = 'NEEDS REVIEW'; result = 'Vendor is not in the fictional approved list';
      } else if (seen.has(key) && seen.get(key) === doc.checksum) {
        dup++; state = 'EXACT COPY'; result = 'Duplicate set aside; no second filing';
      } else if (seen.has(key) && seen.get(key) !== doc.checksum) {
        review++; state = 'POSSIBLE REVISION'; result = 'Same invoice ID, different document content; verify';
      } else {
        seen.set(key, doc.checksum);
        const filename = doc.vendor + ' - Invoice ' + doc.number + (doc.po ? ' - PO ' + doc.po : '') + '.pdf';
        if (doc.scanned) {
          check++; state = 'FILED · CHECK'; result = filename + ' (verify extracted fields)';
        } else {
          filed++; state = 'FILED'; result = filename;
        }
      }
      return [doc.source, state, result];
    });
    let out = status(review ? 'Exception queue populated: review uncertain documents before entry.' :
      'Processing complete: filed records are named consistently.', review ? 'warn' : '');
    out += metrics([['Documents', documents.length], ['Filed', filed], ['Filed · check', check], ['Exact copies', dup], ['Review required', review]]);
    out += '<h3>Fictional AP document routing</h3>' + table(['Received file','Decision','New name / reason'], results);
    out += '<p>Invoices sent to the review queue are not automatically filed as approved bills. A human resolves uncertain matches and possible revisions.</p>';
    setOutput('ap-results', out);
  }

  el('run-bom').addEventListener('click', renderBom);
  el('bom-scenario').addEventListener('change', renderBom);
  el('run-norm').addEventListener('click', renderNormalizer);
  el('reset-norm').addEventListener('click', () => { el('norm-input').value = normOriginal; renderNormalizer(); });
  el('run-ar').addEventListener('click', renderAr);
  el('ar-date').addEventListener('change', renderAr);
  el('run-ap').addEventListener('click', renderAp);
  el('ap-scenario').addEventListener('change', renderAp);
  renderBom();
  renderNormalizer();
  renderAr();
  renderAp();
})();