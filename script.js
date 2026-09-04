'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // =============================================
  // UTILITIES & STATE
  // =============================================
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const getLiveTime = (offsetSeconds = 0) => {
    const d = new Date(Date.now() + offsetSeconds * 1000);
    return d.toLocaleTimeString('en-US', { hour12: false });
  };

  // 5 Real-World Transaction Data Set
  const transactionDatabase = [
    {
      id: 1,
      txnId: 'TXN784529101',
      orderId: 'ORD-20260904-7842',
      amount: 1499,
      method: 'UPI (GooglePay / Axis Bank)',
      caseType: 1, // Instant Debit confirmed & refund
      status: 'READY',
      token: 'A7F3-19BC-42D8',
      rrn: 'RRN4829104821',
      gwStatus: 'TIMEOUT_RETRY_FAILED',
      bankStatus: 'DEBIT_CONFIRMED',
      terminalState: 'REFUNDED'
    },
    {
      id: 2,
      txnId: 'TXN784529102',
      orderId: 'ORD-20260904-7843',
      amount: 2850,
      method: 'UPI (PhonePe / HDFC Bank)',
      caseType: 2, // Delayed Debit confirmation
      status: 'READY',
      token: 'E2C8-71FA-98D1',
      rrn: 'RRN4829104822',
      gwStatus: 'DROPPED_ACK',
      bankStatus: 'DELAYED_CONFIRMATION',
      terminalState: 'REFUNDED'
    },
    {
      id: 3,
      txnId: 'TXN784529103',
      orderId: 'ORD-20260904-7844',
      amount: 899,
      method: 'UPI (Paytm / SBI Bank)',
      caseType: 3, // Missing debit / Uncertain
      status: 'READY',
      token: '9D44-B6AC-33E4',
      rrn: 'RRN4829104823',
      gwStatus: 'DECLINED_AT_SWITCH',
      bankStatus: 'NO_DEBIT_RECORDED',
      terminalState: 'RECONCILIATION'
    },
    {
      id: 4,
      txnId: 'TXN784529104',
      orderId: 'ORD-20260904-7845',
      amount: 4500,
      method: 'UPI (Cred / ICICI Bank)',
      caseType: 1, // Instant debit recovery
      status: 'READY',
      token: 'C1F8-03DE-77B2',
      rrn: 'RRN4829104824',
      gwStatus: 'CONNECTION_RESET',
      bankStatus: 'DEBIT_CONFIRMED',
      terminalState: 'REFUNDED'
    },
    {
      id: 5,
      txnId: 'TXN784529105',
      orderId: 'ORD-20260904-7846',
      amount: 620,
      method: 'UPI (BHIM / PNB Bank)',
      caseType: 3, // Uncertain debit
      status: 'READY',
      token: 'F7A2-8E1D-11C9',
      rrn: 'RRN4829104825',
      gwStatus: 'SWITCH_TIMEOUT',
      bankStatus: 'UNRESOLVED_BATCH',
      terminalState: 'RECONCILIATION'
    }
  ];

  let currentTxnId = 1;
  let isEngineRunning = true;
  let isTokenRotationActive = true;
  let tokenInterval = null;
  let engineInterval = null;
  let countdownTimer = null;
  let countdownVal = 4;
  let uptimeSeconds = 14;

  const animatedPages = new Set();
  const tokenList = ['A7F3-19BC', 'E2C8-71FA', '9D44-B6AC', 'C1F8-03DE', 'F7A2-8E1D', 'B3C9-54FA', '6E1D-A9C7'];
  let tokenIndex = 0;

  // =============================================
  // 1. TRANSACTION SWITCHER & UI SYNC
  // =============================================
  function switchActiveTransaction(txnNum) {
    currentTxnId = txnNum;
    const txn = transactionDatabase.find(t => t.id === txnNum) || transactionDatabase[0];

    // Update Top Tabs
    $$('.txn-tab-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.txnid) === txnNum);
    });

    // Update Page 1 Order UI
    if ($('#display-txnid')) $('#display-txnid').textContent = txn.txnId;
    if ($('#display-orderid')) $('#display-orderid').textContent = txn.orderId;
    if ($('#display-amount')) $('#display-amount').textContent = '₹' + txn.amount.toLocaleString();
    if ($('#pay-btn-amount')) $('#pay-btn-amount').textContent = '₹' + txn.amount.toLocaleString();
    if ($('#display-init-time')) $('#display-init-time').textContent = getLiveTime();

    // Update Evidence Ledger
    if ($('#ledger-txnid')) $('#ledger-txnid').textContent = txn.txnId;
    if ($('#ledger-orderid')) $('#ledger-orderid').textContent = txn.orderId;
    if ($('#ledger-amount')) $('#ledger-amount').textContent = '₹' + txn.amount.toLocaleString();
    if ($('#ledger-token')) $('#ledger-token').textContent = txn.token;
    if ($('#ledger-time')) $('#ledger-time').textContent = getLiveTime() + '.104';

    // Update Crypto Token Display
    if ($('#crypto-token-display')) $('#crypto-token-display').textContent = txn.token;
    if ($('#token-value')) $('#token-value').textContent = txn.token.split('-').slice(0, 2).join('-');

    // Update Packet UI
    if ($('#packet-txnid')) $('#packet-txnid').textContent = txn.txnId;
    if ($('#packet-token')) $('#packet-token').textContent = txn.token;
    if ($('#packet-time')) $('#packet-time').textContent = getLiveTime() + '.000';

    // Update Engine Monitor
    if ($('#engine-current-txnid')) $('#engine-current-txnid').textContent = txn.txnId;

    // Reset Page 1 flow if ready
    if (txn.status === 'READY') {
      if ($('#payment-flow')) $('#payment-flow').classList.add('hidden');
      if ($('#payment-status')) $('#payment-status').classList.add('hidden');
      if ($('#pay-btn')) {
        $('#pay-btn').disabled = false;
        $('#pay-btn').textContent = `🔐 PAY ₹${txn.amount.toLocaleString()}`;
        $('#pay-btn').classList.remove('btn-danger', 'btn-success');
        $('#pay-btn').classList.add('btn-primary');
      }
      if ($('#display-status-badge')) {
        $('#display-status-badge').className = 'status-badge status-pending';
        $('#display-status-badge').textContent = '⏳ Ready';
      }
    }

    addEngineLog($('#engine-log'), getLiveTime(), `Switched context to ${txn.txnId} (Order ${txn.orderId})`, 'info');
  }

  // Bind tab clicks
  $$('.txn-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchActiveTransaction(parseInt(btn.dataset.txnid));
    });
  });

  // =============================================
  // 2. STOP ENGINE / PAYMENT RECEIVED LOGIC
  // =============================================
  function stopEngineAndRotation(terminalState = 'REFUNDED') {
    isEngineRunning = false;
    isTokenRotationActive = false;

    // Clear background timers
    if (tokenInterval) clearInterval(tokenInterval);
    if (engineInterval) clearInterval(engineInterval);
    if (countdownTimer) clearInterval(countdownTimer);

    // Update active transaction in DB
    const txn = transactionDatabase.find(t => t.id === currentTxnId);
    if (txn) txn.status = terminalState;

    // UI Updates
    const activeTab = $(`.txn-tab-btn[data-txnid="${currentTxnId}"]`);
    if (activeTab) {
      activeTab.classList.remove('running', 'paused');
      activeTab.classList.add(terminalState === 'REFUNDED' ? 'refunded' : 'reconciled');
    }

    // Engine UI
    if ($('#engine-indicator-badge')) {
      $('#engine-indicator-badge').className = 'status-badge status-success';
      $('#engine-indicator-badge').textContent = '🏁 TERMINAL REACHED';
    }
    if ($('#engine-live-dot')) {
      $('#engine-live-dot').className = 'engine-dot inactive';
    }
    if ($('#engine-live-text')) {
      $('#engine-live-text').className = 'text-green font-bold';
      $('#engine-live-text').textContent = 'STOPPED (Terminal Complete)';
    }

    // Rotating token UI
    if ($('#token-timer')) {
      $('#token-timer').innerHTML = `<strong class="text-green">🔒 Token Rotation Frozen — Terminal State Reached</strong>`;
    }
    if ($('#freeze-token-btn')) {
      $('#freeze-token-btn').textContent = '🔒 Rotation Stopped';
      $('#freeze-token-btn').disabled = true;
    }

    // Packet Transit animation stop
    if ($('#packet-transit-dot')) {
      $('#packet-transit-dot').classList.remove('animating-gw-bank');
      $('#packet-transit-dot').style.left = 'calc(100% - 130px)';
    }

    // Ledger update
    if ($('#ledger-state')) {
      $('#ledger-state').className = 'status-badge status-success';
      $('#ledger-state').textContent = terminalState;
    }
    if ($('#ledger-verification')) {
      $('#ledger-verification').className = 'status-badge status-success';
      $('#ledger-verification').textContent = 'VERIFIED_COMPLETE';
    }

    // Engine log entry
    addEngineLog(
      $('#engine-log'),
      getLiveTime(),
      `🛑 [TERMINAL STATE REACHED] ${txn ? txn.txnId : 'TXN'} marked as ${terminalState}. All engine polling and token rotation safely halted.`,
      'success'
    );
  }

  // Bind Global & Local Stop Buttons
  const globalRefundReceivedBtn = $('#global-refund-received-btn');
  if (globalRefundReceivedBtn) {
    globalRefundReceivedBtn.addEventListener('click', () => {
      stopEngineAndRotation('REFUNDED');
      alert(`✅ Transaction marked as REFUND RECEIVED / SUCCESSFUL!\n\nAll engine background loops, token rotation, and verification cycles have been cleanly halted.`);
    });
  }

  const engineStopBtn = $('#engine-stop-refunded-btn');
  if (engineStopBtn) {
    engineStopBtn.addEventListener('click', () => {
      stopEngineAndRotation('REFUNDED');
    });
  }

  // Global Start / Pause Buttons
  const globalStartBtn = $('#global-start-btn');
  if (globalStartBtn) {
    globalStartBtn.addEventListener('click', () => {
      resumeEngineAndRotation();
      const tab = $(`.txn-tab-btn[data-txnid="${currentTxnId}"]`);
      if (tab) {
        tab.classList.remove('paused');
        tab.classList.add('running');
      }
      addEngineLog($('#engine-log'), getLiveTime(), `▶ Transaction monitoring resumed manually for ${$('#display-txnid').textContent}`, 'info');
    });
  }

  const globalPauseBtn = $('#global-pause-btn');
  if (globalPauseBtn) {
    globalPauseBtn.addEventListener('click', () => {
      isEngineRunning = false;
      isTokenRotationActive = false;
      if (tokenInterval) clearInterval(tokenInterval);
      if (engineInterval) clearInterval(engineInterval);
      const tab = $(`.txn-tab-btn[data-txnid="${currentTxnId}"]`);
      if (tab) tab.classList.add('paused');
      if ($('#engine-live-text')) $('#engine-live-text').textContent = 'PAUSED';
      addEngineLog($('#engine-log'), getLiveTime(), `⏸ Transaction monitoring paused manually`, 'warning');
    });
  }

  function resumeEngineAndRotation() {
    isEngineRunning = true;
    isTokenRotationActive = true;
    startTokenRotation();
    startEngine();
    if ($('#engine-live-dot')) $('#engine-live-dot').className = 'engine-dot active';
    if ($('#engine-live-text')) $('#engine-live-text').textContent = 'ACTIVE POLLING';
    if ($('#engine-indicator-badge')) {
      $('#engine-indicator-badge').className = 'status-badge status-success';
      $('#engine-indicator-badge').textContent = '🟢 RUNNING';
    }
  }

  // =============================================
  // 3. NAVIGATION & SCROLL OBSERVERS
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

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navItems.forEach(n => n.classList.remove('active'));
        const active = document.querySelector(`.nav-item[data-target="${id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.25 });

  pages.forEach(p => navObserver.observe(p));

  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12 });

  $$('.animate-on-scroll').forEach(el => scrollObserver.observe(el));

  // =============================================
  // 4. PAGE-SPECIFIC INITIALIZATION OBSERVER
  // =============================================
  const pageAnimObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animatedPages.has(entry.target.id)) {
        animatedPages.add(entry.target.id);
        const pageId = entry.target.id;
        if (pageId === 'page-2') animateTraditionalFlow();
        if (pageId === 'page-3') animateFrameworkFlow();
        if (pageId === 'page-5') startTokenRotation();
        if (pageId === 'page-7') startEngine();
        if (pageId === 'page-11') animateEvidenceMatrix();
        if (pageId === 'page-13') animateDecisionTree();
        if (pageId === 'page-15') animateMetrics();
      }
    });
  }, { threshold: 0.2 });

  pages.forEach(p => pageAnimObserver.observe(p));

  // =============================================
  // 5. PAYMENT DEMO (Page 1)
  // =============================================
  const payBtn = $('#pay-btn');
  if (payBtn) {
    payBtn.addEventListener('click', async () => {
      payBtn.disabled = true;
      payBtn.textContent = '⏳ Processing UPI Transfer...';

      const flowDiv = $('#payment-flow');
      if (flowDiv) flowDiv.classList.remove('hidden');

      const flowNodes = flowDiv.querySelectorAll('.flow-node');
      const flowArrows = flowDiv.querySelectorAll('.flow-arrow');

      // Sequentially activate nodes
      for (let i = 0; i < flowNodes.length; i++) {
        await sleep(500);
        flowNodes[i].classList.add('active');
        if (i < flowArrows.length) flowArrows[i].classList.add('active');
      }

      // Bank Failure
      await sleep(600);
      flowNodes[flowNodes.length - 1].classList.remove('active');
      flowNodes[flowNodes.length - 1].classList.add('danger');

      await sleep(400);
      const statusDiv = $('#payment-status');
      if (statusDiv) {
        statusDiv.classList.remove('hidden');
        statusDiv.style.animation = 'fadeInUp 0.4s ease';
      }

      payBtn.textContent = '🔴 Payment Failed (Monitoring Debit)';
      payBtn.className = 'btn btn-danger btn-large btn-full';

      if ($('#display-status-badge')) {
        $('#display-status-badge').className = 'status-badge status-danger';
        $('#display-status-badge').textContent = '🔴 Failed';
      }

      const activeTab = $(`.txn-tab-btn[data-txnid="${currentTxnId}"]`);
      if (activeTab) activeTab.classList.add('running');

      addEngineLog($('#engine-log'), getLiveTime(), `Payment failure registered for ${$('#display-txnid').textContent}. Evidence correlation initiated.`, 'warning');
    });
  }

  // =============================================
  // 6. FLOW ANIMATIONS (Page 2 & 3)
  // =============================================
  async function animateTraditionalFlow() {
    const nodes = $$('#traditional-flow .flow-node');
    const arrows = $$('#traditional-flow .flow-arrow');
    for (let i = 0; i < nodes.length; i++) {
      await sleep(250);
      nodes[i].classList.add('active');
      if (i < arrows.length) arrows[i].classList.add('active');
    }
  }

  async function animateFrameworkFlow() {
    const nodes = $$('#framework-flow .flow-node');
    const arrows = $$('#framework-flow .flow-arrow');
    for (let i = 0; i < nodes.length; i++) {
      await sleep(200);
      nodes[i].classList.add('active');
      if (i < arrows.length) arrows[i].classList.add('active');
    }
  }

  // =============================================
  // 7. TOKEN ROTATION (Page 5)
  // =============================================
  function startTokenRotation() {
    if (tokenInterval || !isTokenRotationActive) return;

    const tokenEl = $('#token-value');
    const countdownEl = $('#token-countdown');
    const historyList = $('#token-history-list');

    if (!tokenEl) return;

    countdownTimer = setInterval(() => {
      if (!isTokenRotationActive) return;
      countdownVal--;
      if (countdownVal <= 0) countdownVal = 4;
      if (countdownEl) countdownEl.textContent = countdownVal;
    }, 1000);

    tokenInterval = setInterval(() => {
      if (!isTokenRotationActive) return;

      const oldToken = tokenList[tokenIndex];
      tokenIndex = (tokenIndex + 1) % tokenList.length;
      const newToken = tokenList[tokenIndex];

      tokenEl.classList.add('token-rotating');
      setTimeout(() => {
        tokenEl.textContent = newToken;
        tokenEl.classList.remove('token-rotating');
      }, 250);

      if (historyList) {
        const item = document.createElement('div');
        item.className = 'token-history-item';
        item.innerHTML = `<span class="th-old">${oldToken}</span><span class="th-time">${getLiveTime()}</span>`;
        historyList.insertBefore(item, historyList.firstChild);

        while (historyList.children.length > 5) {
          historyList.removeChild(historyList.lastChild);
        }
      }
      countdownVal = 4;
    }, 4000);
  }

  const freezeTokenBtn = $('#freeze-token-btn');
  if (freezeTokenBtn) {
    freezeTokenBtn.addEventListener('click', () => {
      if (isTokenRotationActive) {
        isTokenRotationActive = false;
        clearInterval(tokenInterval);
        tokenInterval = null;
        freezeTokenBtn.textContent = '▶ Resume Rotation';
        freezeTokenBtn.className = 'btn btn-primary';
        if ($('#token-timer')) $('#token-timer').innerHTML = `<span class="text-yellow">⏸ Rotation Paused</span>`;
      } else {
        isTokenRotationActive = true;
        startTokenRotation();
        freezeTokenBtn.textContent = '⏸ Pause Rotation';
        freezeTokenBtn.className = 'btn btn-secondary';
        if ($('#token-timer')) $('#token-timer').innerHTML = `Next rotation cycle in: <span id="token-countdown">4</span>s`;
      }
    });
  }

  // =============================================
  // 8. PACKET TRANSIT & TAMPER DEMO (Page 6)
  // =============================================
  const transmitPacketBtn = $('#transmit-packet-btn');
  const resetPacketBtn = $('#reset-packet-btn');
  const packetDot = $('#packet-transit-dot');

  if (transmitPacketBtn && packetDot) {
    transmitPacketBtn.addEventListener('click', () => {
      packetDot.classList.add('animating-gw-bank');
      addEngineLog($('#engine-log'), getLiveTime(), 'Transmitting signed evidence packet: Payment Gateway ➔ Bank', 'info');
    });
  }

  if (resetPacketBtn && packetDot) {
    resetPacketBtn.addEventListener('click', () => {
      packetDot.classList.remove('animating-gw-bank');
      packetDot.style.left = '50%';
    });
  }

  const tamperBtn = $('#tamper-btn');
  if (tamperBtn) {
    tamperBtn.addEventListener('click', () => {
      const result = $('#tamper-result');
      if (result) {
        result.classList.remove('hidden');
        result.style.animation = 'fadeInUp 0.3s ease';
      }
      tamperBtn.disabled = true;
      tamperBtn.textContent = '⚠️ Tampering Detected & Blocked';
      addEngineLog($('#engine-log'), getLiveTime(), '🚨 Cryptographic verification failed! Signature mismatch. Evidence rejected.', 'danger');
    });
  }

  // =============================================
  // 9. CONTINUOUS ENGINE (Page 7)
  // =============================================
  const engineSteps = [
    { msg: '🔍 Polling bank settlement API for debit confirmation...', type: 'info' },
    { msg: '⏳ Bank response pending. Maintaining event tracking cycle...', type: 'warning' },
    { msg: '🔗 Cross-referencing UPI RRN against gateway logs...', type: 'info' },
    { msg: '🛡️ Verifying cryptographic proof token validity...', type: 'info' },
    { msg: '🔄 Check complete. Preserving active state in ledger.', type: 'info' }
  ];
  let engineStepIndex = 0;

  function startEngine() {
    if (engineInterval || !isEngineRunning) return;
    const logEl = $('#engine-log');
    if (!logEl) return;

    engineInterval = setInterval(() => {
      if (!isEngineRunning) return;
      const step = engineSteps[engineStepIndex];
      addEngineLog(logEl, getLiveTime(), step.msg, step.type);
      engineStepIndex = (engineStepIndex + 1) % engineSteps.length;
    }, 2800);
  }

  function addEngineLog(container, time, msg, status = 'info') {
    if (!container) return;
    const entry = document.createElement('div');
    entry.className = 'engine-log-entry';

    let color = '#38bdf8';
    if (status === 'success') color = '#34d399';
    if (status === 'danger') color = '#f87171';
    if (status === 'warning') color = '#fbbf24';

    entry.innerHTML = `<span class="log-time">[${time}]</span><span class="log-msg" style="color:${color}">${msg}</span>`;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
  }

  const clearLogBtn = $('#clear-engine-log-btn');
  if (clearLogBtn) {
    clearLogBtn.addEventListener('click', () => {
      if ($('#engine-log')) $('#engine-log').innerHTML = '';
    });
  }

  // Engine Uptime counter
  setInterval(() => {
    if (isEngineRunning && $('#engine-uptime')) {
      uptimeSeconds++;
      const h = String(Math.floor(uptimeSeconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((uptimeSeconds % 3600) / 60)).padStart(2, '0');
      const s = String(uptimeSeconds % 60).padStart(2, '0');
      $('#engine-uptime').textContent = `${h}:${m}:${s}`;
    }
  }, 1000);

  // =============================================
  // 10. CASE STUDY TRIGGERS (Pages 8, 9, 10)
  // =============================================
  // Case 1 Execute
  const runCase1Btn = $('#run-case1-btn');
  if (runCase1Btn) {
    runCase1Btn.addEventListener('click', async () => {
      runCase1Btn.disabled = true;
      runCase1Btn.textContent = '⏳ Executing Case 1...';

      // Update real-time timestamps
      const baseTime = Date.now();
      const case1Times = $$('.case1-time');
      case1Times.forEach((el, idx) => {
        el.textContent = new Date(baseTime + idx * 1000).toLocaleTimeString('en-US', { hour12: false });
      });

      const timelineItems = $$('#case1-timeline .timeline-item');
      for (let i = 0; i < timelineItems.length; i++) {
        await sleep(350);
        timelineItems[i].classList.add('active', 'success');
      }

      const checks = $$('#case1-checklist .check-item');
      for (let i = 0; i < checks.length; i++) {
        await sleep(250);
        checks[i].classList.add('pass');
        checks[i].querySelector('.check-icon').textContent = '✅';
      }

      await sleep(300);
      if ($('#case1-result')) {
        $('#case1-result').style.opacity = '1';
      }
      runCase1Btn.textContent = '✅ Case 1 Completed';
    });
  }

  // Case 2 Execute
  const runCase2Btn = $('#run-case2-btn');
  if (runCase2Btn) {
    runCase2Btn.addEventListener('click', async () => {
      runCase2Btn.disabled = true;
      runCase2Btn.textContent = '⏳ Executing Case 2...';

      const baseTime = Date.now();
      const case2Times = $$('.case2-time');
      case2Times.forEach((el, idx) => {
        el.textContent = new Date(baseTime + idx * 4000).toLocaleTimeString('en-US', { hour12: false });
      });

      const items = $$('#case2-timeline .timeline-item');
      for (let i = 0; i < items.length; i++) {
        const type = items[i].dataset.type || 'active';
        await sleep(type === 'warning' ? 700 : 400);
        items[i].classList.add('active', type);
      }

      if ($('#case2-correlation')) $('#case2-correlation').style.opacity = '1';
      runCase2Btn.textContent = '✅ Case 2 Completed';
    });
  }

  // Case 3 Execute
  const runCase3Btn = $('#run-case3-btn');
  if (runCase3Btn) {
    runCase3Btn.addEventListener('click', async () => {
      runCase3Btn.disabled = true;
      runCase3Btn.textContent = '⏳ Executing Case 3...';

      const baseTime = Date.now();
      const case3Times = $$('.case3-time');
      case3Times.forEach((el, idx) => {
        el.textContent = new Date(baseTime + idx * 5000).toLocaleTimeString('en-US', { hour12: false });
      });

      const items = $$('#case3-timeline .timeline-item');
      for (let i = 0; i < items.length; i++) {
        await sleep(500);
        items[i].classList.add('active', items[i].dataset.type || 'warning');
      }
      runCase3Btn.textContent = '✅ Case 3 Completed';
    });
  }

  // =============================================
  // 11. EVIDENCE MATRIX (Page 11)
  // =============================================
  async function animateEvidenceMatrix() {
    const statuses = $$('#evidence-matrix .evidence-status');
    const labels = ['✓ MATCH', '✓ MATCH', '✓ MATCH', '✓ VALID', '✓ RECEIVED', '✓ RECEIVED', '✓ MATCH', '✓ VERIFIED', '✓ PASSED'];

    for (let i = 0; i < statuses.length; i++) {
      await sleep(200);
      statuses[i].textContent = labels[i];
      statuses[i].classList.add('match');
      const row = statuses[i].closest('tr');
      if (row) row.style.background = '#f0fdf4';
    }

    await sleep(300);
    if ($('#evidence-decision')) $('#evidence-decision').style.opacity = '1';
  }

  // =============================================
  // 12. EVENT CHAIN TAMPER (Page 12)
  // =============================================
  const chainTamperBtn = $('#chain-tamper-btn');
  if (chainTamperBtn) {
    chainTamperBtn.addEventListener('click', () => {
      const amountEl = $('#chain-amount-3');
      if (amountEl) {
        amountEl.innerHTML = '<span class="tampered-text">Amount: ₹1,499</span> → <span class="tampered-new">₹2,499</span>';
      }
      const block3 = $('#chain-event-3');
      if (block3) block3.classList.add('tampered');

      const link3 = $('#chain-link-3');
      const link4 = $('#chain-link-4');
      if (link3) link3.classList.add('broken');
      if (link4) link4.classList.add('broken');

      const result = $('#chain-tamper-result');
      if (result) {
        result.classList.remove('hidden');
        result.style.animation = 'fadeInUp 0.3s ease';
      }
      chainTamperBtn.disabled = true;
      chainTamperBtn.textContent = '⚠️ Tampering Detected';
    });
  }

  // =============================================
  // 13. DECISION TREE (Page 13)
  // =============================================
  async function animateDecisionTree() {
    const nodes = $$('#decision-tree .decision-node');
    for (let i = 0; i < nodes.length; i++) {
      await sleep(300);
      nodes[i].classList.add('highlight');
      await sleep(150);
      if (i < nodes.length - 1) nodes[i].classList.add('yes');
    }
  }

  // =============================================
  // 14. METRICS ANIMATION (Page 15)
  // =============================================
  async function animateMetrics() {
    await sleep(200);
    const fills = $$('#metrics-dashboard .metric-bar-fill');
    fills.forEach(fill => {
      fill.style.width = (fill.dataset.fill || 0) + '%';
    });
  }

  // =============================================
  // 15. LIVE SIMULATION (Page 16 - 5 Txns, 3 Scenarios)
  // =============================================
  const simBtn = $('#run-simulation-btn');
  const resetSimBtn = $('#reset-simulation-btn');

  if (simBtn) {
    simBtn.addEventListener('click', async () => {
      simBtn.disabled = true;
      simBtn.textContent = '⏳ EXECUTING 5-TRANSACTION SIMULATION...';

      ['sim-output-1', 'sim-output-2', 'sim-output-3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
      });

      await Promise.all([
        runSimScenario1(),
        runSimScenario2(),
        runSimScenario3()
      ]);

      await sleep(400);
      simBtn.textContent = '✅ SIMULATION COMPLETE (ALL 5 TXNS SETTLED)';
      simBtn.className = 'btn btn-success btn-xl';
    });
  }

  if (resetSimBtn) {
    resetSimBtn.addEventListener('click', () => {
      ['sim-output-1', 'sim-output-2', 'sim-output-3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
      });
      if (simBtn) {
        simBtn.disabled = false;
        simBtn.textContent = '▶ RUN SIMULATION (ALL 3 SCENARIOS)';
        simBtn.className = 'btn btn-primary btn-xl';
      }
    });
  }

  async function addSimLog(containerId, timestamp, text, color = '#f1f5f9') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const entry = document.createElement('div');
    entry.className = 'sim-log-entry';
    entry.innerHTML = `<span class="sim-timestamp">[${timestamp}]</span><span class="sim-event" style="color:${color}">${text}</span>`;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
  }

  async function runSimScenario1() {
    const id = 'sim-output-1';
    const logs = [
      { t: getLiveTime(0), msg: '⚡ TXN-01 (₹1,499) initiated via Axis Bank UPI', c: '#38bdf8' },
      { t: getLiveTime(1), msg: '🔴 Payment Gateway Timeout registered', c: '#f87171' },
      { t: getLiveTime(2), msg: '🔐 Cryptographic evidence bound: A7F3-19BC', c: '#38bdf8' },
      { t: getLiveTime(3), msg: '✅ Bank authoritative debit confirmation arrived', c: '#34d399' },
      { t: getLiveTime(4), msg: '✅ 7-Factor Refund Eligibility checks passed', c: '#34d399' },
      { t: getLiveTime(5), msg: '🟢 SAFE TO INITIATE RAPID REFUND', c: '#34d399' },
      { t: getLiveTime(6), msg: '✅ TXN-01 REFUND COMPLETED (₹1,499 settled)', c: '#34d399' },
      { t: getLiveTime(7), msg: '⚡ TXN-04 (₹4,500) initiated & recovered via same pipeline', c: '#38bdf8' },
      { t: getLiveTime(8), msg: '✅ TXN-04 REFUND COMPLETED (₹4,500 settled)', c: '#34d399' }
    ];
    for (const log of logs) {
      await sleep(350);
      await addSimLog(id, log.t, log.msg, log.c);
    }
  }

  async function runSimScenario2() {
    const id = 'sim-output-2';
    const logs = [
      { t: getLiveTime(0), msg: '⚡ TXN-02 (₹2,850) initiated via HDFC Bank UPI', c: '#38bdf8' },
      { t: getLiveTime(1), msg: '🔴 Network dropped ACK — Payment Failed', c: '#f87171' },
      { t: getLiveTime(2), msg: '⏳ Debit confirmation not immediate. Engine continues polling...', c: '#fbbf24' },
      { t: getLiveTime(4), msg: '⏳ Cycle 2: Preserving evidence in immutable ledger...', c: '#fbbf24' },
      { t: getLiveTime(6), msg: '🎉 Delayed bank confirmation received (RRN matched)', c: '#34d399' },
      { t: getLiveTime(7), msg: '✅ Re-correlation passed — No reconciliation reset needed', c: '#34d399' },
      { t: getLiveTime(8), msg: '✅ TXN-02 REFUND COMPLETED (₹2,850 settled)', c: '#34d399' }
    ];
    for (const log of logs) {
      await sleep(450);
      await addSimLog(id, log.t, log.msg, log.c);
    }
  }

  async function runSimScenario3() {
    const id = 'sim-output-3';
    const logs = [
      { t: getLiveTime(0), msg: '⚡ TXN-03 (₹899) & TXN-05 (₹620) initiated', c: '#38bdf8' },
      { t: getLiveTime(1), msg: '🔴 Payment failed at switch level', c: '#f87171' },
      { t: getLiveTime(3), msg: '⚠️ No authoritative debit evidence received from bank', c: '#fbbf24' },
      { t: getLiveTime(5), msg: '⚠️ Polling limit threshold reached without debit confirmation', c: '#fbbf24' },
      { t: getLiveTime(6), msg: '🚫 DO NOT AUTO-REFUND (Prevents duplicate disbursement)', c: '#f87171' },
      { t: getLiveTime(7), msg: '🟡 Transferred to Exception / Reconciliation Queue', c: '#fbbf24' },
      { t: getLiveTime(8), msg: '🔒 Terminal State: RECONCILIATION_REQUIRED', c: '#fbbf24' }
    ];
    for (const log of logs) {
      await sleep(400);
      await addSimLog(id, log.t, log.msg, log.c);
    }
  }

  // Initialize with first transaction
  switchActiveTransaction(1);
});
