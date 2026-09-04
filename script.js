'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // =============================================
  // UTILITIES
  // =============================================
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const animatedPages = new Set();
  let tokenInterval = null;
  let engineInterval = null;

  // =============================================
  // 1. NAVIGATION
  // =============================================
  const navItems = $$('.nav-item');
  const pages = $$('.page');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = document.getElementById(item.dataset.target);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Active nav on scroll
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navItems.forEach(n => n.classList.remove('active'));
        const active = document.querySelector(`.nav-item[data-target="${id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.3 });

  pages.forEach(p => navObserver.observe(p));

  // =============================================
  // 2. SCROLL ANIMATIONS
  // =============================================
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  $$('.animate-on-scroll').forEach(el => scrollObserver.observe(el));

  // =============================================
  // 3. PAGE-SPECIFIC ANIMATION TRIGGERS
  // =============================================
  const pageAnimObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animatedPages.has(entry.target.id)) {
        animatedPages.add(entry.target.id);
        triggerPageAnimation(entry.target.id);
      }
    });
  }, { threshold: 0.25 });

  pages.forEach(p => pageAnimObserver.observe(p));

  function triggerPageAnimation(pageId) {
    switch (pageId) {
      case 'page-2': animateTraditionalFlow(); break;
      case 'page-3': animateFrameworkFlow(); break;
      case 'page-5': startTokenRotation(); break;
      case 'page-7': startEngine(); break;
      case 'page-8': animateCase1(); break;
      case 'page-9': animateCase2(); break;
      case 'page-10': animateCase3(); break;
      case 'page-11': animateEvidenceMatrix(); break;
      case 'page-13': animateDecisionTree(); break;
      case 'page-15': animateMetrics(); break;
    }
  }

  // =============================================
  // 4. PAYMENT DEMO (Page 1)
  // =============================================
  const payBtn = $('#pay-btn');
  if (payBtn) {
    payBtn.addEventListener('click', async () => {
      payBtn.disabled = true;
      payBtn.textContent = '⏳ Processing...';

      // Show flow
      const flowDiv = $('#payment-flow');
      if (flowDiv) flowDiv.classList.remove('hidden');

      const flowNodes = flowDiv.querySelectorAll('.flow-node');
      const flowArrows = flowDiv.querySelectorAll('.flow-arrow');

      // Sequentially animate nodes
      for (let i = 0; i < flowNodes.length; i++) {
        await sleep(600);
        flowNodes[i].classList.add('active');
        if (i < flowArrows.length) {
          flowArrows[i].classList.add('active');
        }
      }

      // Fail at bank
      await sleep(800);
      flowNodes[flowNodes.length - 1].classList.remove('active');
      flowNodes[flowNodes.length - 1].classList.add('danger');

      // Show status
      await sleep(500);
      const statusDiv = $('#payment-status');
      if (statusDiv) {
        statusDiv.classList.remove('hidden');
        statusDiv.style.animation = 'fadeInUp 0.5s ease';
      }

      payBtn.textContent = '❌ Payment Failed';
      payBtn.style.background = 'var(--danger)';
      payBtn.style.color = '#fff';
    });
  }

  // =============================================
  // 5. TRADITIONAL FLOW ANIMATION (Page 2)
  // =============================================
  async function animateTraditionalFlow() {
    const nodes = document.querySelectorAll('#traditional-flow .flow-node');
    const arrows = document.querySelectorAll('#traditional-flow .flow-arrow');
    for (let i = 0; i < nodes.length; i++) {
      await sleep(400);
      nodes[i].classList.add('active');
      if (i < arrows.length) arrows[i].classList.add('active');
    }
  }

  // =============================================
  // 6. FRAMEWORK FLOW ANIMATION (Page 3)
  // =============================================
  async function animateFrameworkFlow() {
    const nodes = document.querySelectorAll('#framework-flow .flow-node');
    const arrows = document.querySelectorAll('#framework-flow .flow-arrow');
    for (let i = 0; i < nodes.length; i++) {
      await sleep(300);
      nodes[i].classList.add('active');
      if (i < arrows.length) arrows[i].classList.add('active');
    }
    // Finish with success on last node
    await sleep(300);
    nodes[nodes.length - 1].classList.add('success');
  }

  // =============================================
  // 7. TOKEN ROTATION (Page 5)
  // =============================================
  const tokens = ['A7F3-19BC', 'E2C8-71FA', '9D44-B6AC', 'C1F8-03DE', 'F7A2-8E1D', 'B3C9-54FA', '6E1D-A9C7', 'D8F2-3B7E'];
  let tokenIndex = 0;
  let countdown = 4;

  function startTokenRotation() {
    if (tokenInterval) return;

    const tokenEl = $('#token-value');
    const countdownEl = $('#token-countdown');
    const historyList = $('#token-history-list');

    if (!tokenEl) return;

    // Clear placeholder
    if (historyList) historyList.innerHTML = '';

    // Countdown ticker
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) countdown = 4;
      if (countdownEl) countdownEl.textContent = countdown;
    }, 1000);

    tokenInterval = setInterval(() => {
      const oldToken = tokens[tokenIndex];
      tokenIndex = (tokenIndex + 1) % tokens.length;
      const newToken = tokens[tokenIndex];

      // Glitch animation
      tokenEl.classList.add('token-rotating');

      setTimeout(() => {
        tokenEl.textContent = newToken;
        tokenEl.classList.remove('token-rotating');
      }, 300);

      // Add old token to history
      if (historyList) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
        const item = document.createElement('div');
        item.className = 'token-history-item';
        item.innerHTML = `<span class="mono">${oldToken}</span><span class="th-time">${timeStr}</span>`;
        historyList.insertBefore(item, historyList.firstChild);

        // Keep max 6
        while (historyList.children.length > 6) {
          historyList.removeChild(historyList.lastChild);
        }
      }

      countdown = 4;
    }, 4000);
  }

  // =============================================
  // 8. TAMPER DETECTION DEMO (Page 6)
  // =============================================
  const tamperBtn = $('#tamper-btn');
  if (tamperBtn) {
    tamperBtn.addEventListener('click', () => {
      const result = $('#tamper-result');
      if (result) {
        result.classList.remove('hidden');
        result.style.animation = 'fadeInUp 0.4s ease';
      }
      tamperBtn.disabled = true;
      tamperBtn.textContent = '⚠️ Tampering Detected';
    });
  }

  // =============================================
  // 9. CONTINUOUS ENGINE (Page 7)
  // =============================================
  const engineChecks = [
    { time: '10:00:00', msg: '🔍 Checking bank debit status...', status: 'pending' },
    { time: '10:05:00', msg: '🔍 No confirmation yet — re-checking...', status: 'warning' },
    { time: '10:10:00', msg: '🔍 Querying payment gateway for evidence...', status: 'warning' },
    { time: '10:15:00', msg: '🔍 Cross-referencing transaction identifiers...', status: 'pending' },
    { time: '10:20:00', msg: '🔍 Verifying cryptographic evidence chain...', status: 'pending' },
    { time: '10:25:00', msg: '📡 Polling bank settlement network...', status: 'pending' },
    { time: '10:30:00', msg: '🔄 Engine cycle complete — awaiting new evidence', status: 'info' },
  ];
  let engineStep = 0;

  function startEngine() {
    if (engineInterval) return;
    const logEl = $('#engine-log');
    if (!logEl) return;

    engineInterval = setInterval(() => {
      if (engineStep >= engineChecks.length) {
        clearInterval(engineInterval);
        addEngineLog(logEl, '--:--:--', '✅ Monitoring continues until terminal state...', 'success');
        return;
      }
      const check = engineChecks[engineStep];
      addEngineLog(logEl, check.time, check.msg, check.status);
      engineStep++;
    }, 1500);
  }

  function addEngineLog(container, time, msg, status) {
    const entry = document.createElement('div');
    entry.className = 'engine-log-entry';
    const statusColor = {
      pending: 'var(--accent-cyan)',
      warning: 'var(--warning)',
      success: 'var(--success)',
      info: 'var(--accent-purple)',
    }[status] || 'var(--text-secondary)';
    entry.innerHTML = `<span class="log-time">[${time}]</span><span class="log-msg" style="color:${statusColor}">${msg}</span>`;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
  }

  // =============================================
  // 10. CASE 1: SUCCESS (Page 8)
  // =============================================
  async function animateCase1() {
    // Timeline
    const items = $$('#case1-timeline .timeline-item');
    for (let i = 0; i < items.length; i++) {
      await sleep(500);
      items[i].classList.add('active', 'success');
    }

    // Checklist
    await sleep(400);
    const checks = $$('#case1-checklist .check-item');
    for (let i = 0; i < checks.length; i++) {
      await sleep(350);
      checks[i].classList.add('pass');
      checks[i].querySelector('.check-icon').textContent = '✅';
    }

    // Result
    await sleep(500);
    const result = $('#case1-result');
    if (result) {
      result.style.transition = 'opacity 0.6s ease';
      result.style.opacity = '1';
    }
  }

  // =============================================
  // 11. CASE 2: DELAYED (Page 9)
  // =============================================
  async function animateCase2() {
    const items = $$('#case2-timeline .timeline-item');
    const typeMap = { danger: 'danger', warning: 'warning', success: 'success' };

    for (let i = 0; i < items.length; i++) {
      const type = items[i].dataset.type || 'active';
      const delay = type === 'warning' ? 1200 : 700;
      await sleep(delay);
      items[i].classList.add('active', type);
    }

    // Show correlation
    await sleep(600);
    const corr = $('#case2-correlation');
    if (corr) {
      corr.style.transition = 'opacity 0.6s ease';
      corr.style.opacity = '1';
    }

    // Show result
    await sleep(800);
    const result = $('#case2-result');
    if (result) {
      result.style.transition = 'opacity 0.6s ease';
      result.style.opacity = '1';
    }
  }

  // =============================================
  // 12. CASE 3: MISSING (Page 10)
  // =============================================
  async function animateCase3() {
    const items = $$('#case3-timeline .timeline-item');
    for (let i = 0; i < items.length; i++) {
      const type = items[i].dataset.type || 'warning';
      await sleep(1000);
      items[i].classList.add('active', type);
    }
  }

  // =============================================
  // 13. EVIDENCE MATRIX (Page 11)
  // =============================================
  async function animateEvidenceMatrix() {
    const statuses = $$('#evidence-matrix .evidence-status');
    const labels = ['✓ MATCH', '✓ MATCH', '✓ MATCH', '✓ VALID', '✓ RECEIVED', '✓ RECEIVED', '✓ MATCH', '✓ VERIFIED', '✓ PASSED'];

    for (let i = 0; i < statuses.length; i++) {
      await sleep(350);
      statuses[i].textContent = labels[i] || '✓';
      statuses[i].classList.add('match');
      // Highlight row
      const row = statuses[i].closest('tr');
      if (row) {
        row.style.transition = 'background 0.3s ease';
        row.style.background = 'rgba(0, 255, 136, 0.04)';
      }
    }

    // Show decision
    await sleep(600);
    const decision = $('#evidence-decision');
    if (decision) {
      decision.style.transition = 'opacity 0.6s ease';
      decision.style.opacity = '1';
    }
  }

  // =============================================
  // 14. CHAIN TAMPER DEMO (Page 12)
  // =============================================
  const chainTamperBtn = $('#chain-tamper-btn');
  if (chainTamperBtn) {
    chainTamperBtn.addEventListener('click', () => {
      // Modify event 3
      const amountEl = $('#chain-amount-3');
      if (amountEl) {
        amountEl.innerHTML = '<span class="tampered-text">Amount: ₹1,499</span> → <span class="tampered-new">₹2,499</span>';
      }

      // Add tampered class
      const block3 = $('#chain-event-3');
      if (block3) block3.classList.add('tampered');

      // Break links
      const link3 = $('#chain-link-3');
      const link4 = $('#chain-link-4');
      if (link3) link3.classList.add('broken');
      if (link4) link4.classList.add('broken');

      // Show result
      const result = $('#chain-tamper-result');
      if (result) {
        result.classList.remove('hidden');
        result.style.animation = 'fadeInUp 0.4s ease';
      }

      chainTamperBtn.disabled = true;
      chainTamperBtn.textContent = '⚠️ Tampering Applied';
    });
  }

  // =============================================
  // 15. DECISION TREE (Page 13)
  // =============================================
  async function animateDecisionTree() {
    const nodes = $$('#decision-tree .decision-node');
    for (let i = 0; i < nodes.length; i++) {
      await sleep(600);
      nodes[i].classList.add('highlight');
      // After brief highlight, add yes/no
      await sleep(200);
      if (i < nodes.length - 1) {
        nodes[i].classList.add('yes');
      }
    }
  }

  // =============================================
  // 16. METRICS ANIMATION (Page 15)
  // =============================================
  async function animateMetrics() {
    await sleep(300);

    // Animate bars
    const fills = $$('#metrics-dashboard .metric-bar-fill');
    fills.forEach(fill => {
      const target = fill.dataset.fill || 0;
      fill.style.width = target + '%';
    });

    // Animate counters
    const values = $$('#metrics-dashboard .metric-value');
    values.forEach(val => {
      const target = parseInt(val.dataset.target) || 0;
      animateCounter(val, 0, target, 1200);
    });
  }

  function animateCounter(el, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + range * eased);

      // Format with appropriate suffix/prefix
      const label = el.closest('.metric-card')?.querySelector('.text-muted')?.textContent || '';
      if (label.includes('seconds')) {
        el.textContent = '<' + current + 's';
      } else if (label.includes('percent')) {
        el.textContent = '~' + current + '%';
      } else {
        el.textContent = current;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // =============================================
  // 17. LIVE SIMULATION (Page 16)
  // =============================================
  const simBtn = $('#run-simulation-btn');
  if (simBtn) {
    simBtn.addEventListener('click', async () => {
      simBtn.disabled = true;
      simBtn.textContent = '⏳ SIMULATION RUNNING...';
      simBtn.style.background = 'var(--warning)';

      // Clear outputs
      ['sim-output-1', 'sim-output-2', 'sim-output-3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
      });

      // Run all 3 scenarios in parallel
      await Promise.all([
        runScenario1(),
        runScenario2(),
        runScenario3(),
      ]);

      // Complete
      await sleep(500);
      simBtn.textContent = '✅ SIMULATION COMPLETE';
      simBtn.style.background = 'linear-gradient(135deg, var(--success), #00cc66)';
      simBtn.style.color = '#0a0e27';
    });
  }

  async function addSimLog(containerId, timestamp, text, type = 'normal') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const entry = document.createElement('div');
    entry.className = 'sim-log-entry';

    let color = 'var(--text-primary)';
    if (type === 'success') color = 'var(--success)';
    else if (type === 'danger') color = 'var(--danger)';
    else if (type === 'warning') color = 'var(--warning)';
    else if (type === 'info') color = 'var(--accent-cyan)';
    else if (type === 'result') color = 'var(--success)';

    entry.innerHTML = `<span class="sim-timestamp">[${timestamp}]</span><span class="sim-event" style="color:${color}">${text}</span>`;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
  }

  async function runScenario1() {
    const id = 'sim-output-1';
    const events = [
      { t: '10:00:00', msg: '⚡ Payment initiated — TXN784529103', type: 'info' },
      { t: '10:00:01', msg: '⏳ Payment processing...', type: 'normal' },
      { t: '10:00:02', msg: '🔴 PAYMENT FAILED — Gateway Timeout', type: 'danger' },
      { t: '10:00:02', msg: '🔐 Evidence captured & secured', type: 'info' },
      { t: '10:00:03', msg: '🏦 Checking debit status...', type: 'normal' },
      { t: '10:00:03', msg: '✅ Bank debit confirmation received', type: 'success' },
      { t: '10:00:04', msg: '✅ Gateway evidence received', type: 'success' },
      { t: '10:00:05', msg: '✅ Transaction IDs matched', type: 'success' },
      { t: '10:00:06', msg: '✅ Amount verified: ₹1,499', type: 'success' },
      { t: '10:00:07', msg: '✅ Cryptographic evidence verified', type: 'success' },
      { t: '10:00:08', msg: '✅ Order confirmed NOT completed', type: 'success' },
      { t: '10:00:08', msg: '🟢 REFUND ELIGIBLE — All checks passed', type: 'result' },
      { t: '10:00:09', msg: '💰 Refund request initiated', type: 'info' },
      { t: '10:00:10', msg: '✅ REFUND COMPLETED — ₹1,499 returned', type: 'result' },
    ];

    for (const event of events) {
      await sleep(400);
      await addSimLog(id, event.t, event.msg, event.type);
    }
  }

  async function runScenario2() {
    const id = 'sim-output-2';
    const events = [
      { t: '10:00:00', msg: '⚡ Payment initiated — TXN891237456', type: 'info' },
      { t: '10:00:02', msg: '🔴 PAYMENT FAILED — Network Error', type: 'danger' },
      { t: '10:00:02', msg: '🔐 Evidence captured & secured', type: 'info' },
      { t: '10:00:03', msg: '🏦 Checking debit status...', type: 'normal' },
      { t: '10:03:00', msg: '⏳ No confirmation yet...', type: 'warning' },
      { t: '10:05:00', msg: '⏳ Still waiting... Engine monitoring', type: 'warning' },
      { t: '10:10:00', msg: '⏳ Engine monitoring... Evidence preserved', type: 'warning' },
      { t: '10:15:00', msg: '🎉 Bank confirmation arrived!', type: 'success' },
      { t: '10:15:01', msg: '✅ Evidence correlated successfully', type: 'success' },
      { t: '10:15:02', msg: '✅ All verification checks passed', type: 'success' },
      { t: '10:15:03', msg: '🟢 REFUND ELIGIBLE', type: 'result' },
      { t: '10:15:04', msg: '💰 Refund initiated', type: 'info' },
      { t: '10:15:30', msg: '✅ REFUND COMPLETED — ₹1,499 returned', type: 'result' },
    ];

    for (const event of events) {
      const delay = event.type === 'warning' ? 800 : 400;
      await sleep(delay);
      await addSimLog(id, event.t, event.msg, event.type);
    }
  }

  async function runScenario3() {
    const id = 'sim-output-3';
    const events = [
      { t: '10:00:00', msg: '⚡ Payment initiated — TXN563421890', type: 'info' },
      { t: '10:00:02', msg: '🔴 PAYMENT FAILED — Connection Reset', type: 'danger' },
      { t: '10:00:02', msg: '🔐 Evidence captured & secured', type: 'info' },
      { t: '10:00:03', msg: '🏦 Checking debit status...', type: 'normal' },
      { t: '10:05:00', msg: '⚠️ No debit evidence received', type: 'warning' },
      { t: '10:10:00', msg: '⚠️ No debit evidence received', type: 'warning' },
      { t: '10:15:00', msg: '⚠️ No debit evidence received', type: 'warning' },
      { t: '10:20:00', msg: '⚠️ No debit evidence — threshold reached', type: 'warning' },
      { t: '10:20:01', msg: '🟡 DEBIT UNCONFIRMED', type: 'warning' },
      { t: '10:20:02', msg: '🔴 AUTO-REFUND BLOCKED', type: 'danger' },
      { t: '10:20:03', msg: '⚠️ → RECONCILIATION QUEUE', type: 'warning' },
      { t: '10:20:04', msg: '🔄 Engine continues monitoring...', type: 'info' },
    ];

    for (const event of events) {
      const delay = event.type === 'warning' ? 700 : 400;
      await sleep(delay);
      await addSimLog(id, event.t, event.msg, event.type);
    }
  }

  // =============================================
  // 18. ENGINE UPTIME COUNTER
  // =============================================
  let uptimeSeconds = 0;
  const uptimeEl = $('#engine-uptime');
  setInterval(() => {
    if (animatedPages.has('page-7') && uptimeEl) {
      uptimeSeconds++;
      const h = String(Math.floor(uptimeSeconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((uptimeSeconds % 3600) / 60)).padStart(2, '0');
      const s = String(uptimeSeconds % 60).padStart(2, '0');
      uptimeEl.textContent = `${h}:${m}:${s}`;
    }
  }, 1000);

});
