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

  // 5 Real-World Transactions Database
  const transactionDatabase = [
    {
      id: 1,
      txnId: 'TXN784529101',
      orderId: 'ORD-20260904-7842',
      amount: 1499,
      method: 'UPI (GooglePay / Axis Bank)',
      status: 'UNSTOPPED', // unstopped | refunded | reversed | reconciled | tampered | paused
      uptime: 0,
      token: 'A7F3-19BC-42D8',
      rrn: 'RRN4829104821',
      gwStatus: 'TIMEOUT_RETRY_FAILED',
      bankStatus: 'DEBIT_CONFIRMED',
      terminalState: null,
      history: [
        { time: getLiveTime(-10), text: 'Transaction initialized. Monitoring engine active.' }
      ]
    },
    {
      id: 2,
      txnId: 'TXN784529102',
      orderId: 'ORD-20260904-7843',
      amount: 2850,
      method: 'UPI (PhonePe / HDFC Bank)',
      status: 'UNSTOPPED',
      uptime: 0,
      token: 'E2C8-71FA-98D1',
      rrn: 'RRN4829104822',
      gwStatus: 'DROPPED_ACK',
      bankStatus: 'DELAYED_CONFIRMATION',
      terminalState: null,
      history: [
        { time: getLiveTime(-8), text: 'Transaction initialized. Waiting for bank acknowledgment.' }
      ]
    },
    {
      id: 3,
      txnId: 'TXN784529103',
      orderId: 'ORD-20260904-7844',
      amount: 899,
      method: 'UPI (Paytm / SBI Bank)',
      status: 'UNSTOPPED',
      uptime: 0,
      token: '9D44-B6AC-33E4',
      rrn: 'RRN4829104823',
      gwStatus: 'DECLINED_AT_SWITCH',
      bankStatus: 'NO_DEBIT_RECORDED',
      terminalState: null,
      history: [
        { time: getLiveTime(-6), text: 'Transaction initialized. No debit confirmation received.' }
      ]
    },
    {
      id: 4,
      txnId: 'TXN784529104',
      orderId: 'ORD-20260904-7845',
      amount: 4500,
      method: 'UPI (Cred / ICICI Bank)',
      status: 'UNSTOPPED',
      uptime: 0,
      token: 'C1F8-03DE-77B2',
      rrn: 'RRN4829104824',
      gwStatus: 'CONNECTION_RESET',
      bankStatus: 'DEBIT_CONFIRMED',
      terminalState: null,
      history: [
        { time: getLiveTime(-4), text: 'Transaction initialized. Cryptographic proof generated.' }
      ]
    },
    {
      id: 5,
      txnId: 'TXN784529105',
      orderId: 'ORD-20260904-7846',
      amount: 620,
      method: 'UPI (BHIM / PNB Bank)',
      status: 'UNSTOPPED',
      uptime: 0,
      token: 'F7A2-8E1D-11C9',
      rrn: 'RRN4829104825',
      gwStatus: 'SWITCH_TIMEOUT',
      bankStatus: 'UNRESOLVED_BATCH',
      terminalState: null,
      history: [
        { time: getLiveTime(-2), text: 'Transaction initialized. Awaiting network routing.' }
      ]
    }
  ];

  let currentTxnId = 1;
  let isEngineRunning = true;
  let isTokenRotationActive = true;
  let tokenInterval = null;
  let engineInterval = null;
  let countdownTimer = null;
  let countdownVal = 4;

  const animatedPages = new Set();
  const tokenList = ['A7F3-19BC', 'E2C8-71FA', '9D44-B6AC', 'C1F8-03DE', 'F7A2-8E1D', 'B3C9-54FA', '6E1D-A9C7'];
  let tokenIndex = 0;

  // Log an action to the active transaction's private timeline
  function logUserAction(txnId, text) {
    const txn = transactionDatabase.find(t => t.id === txnId);
    if (!txn) return;
    const entry = { time: getLiveTime(), text };
    txn.history.unshift(entry);

    if (txnId === currentTxnId) {
      renderUserActionTimeline(txn);
    }
  }

  function renderUserActionTimeline(txn) {
    const list = $('#user-action-timeline-list');
    if (!list) return;
    list.innerHTML = '';
    txn.history.forEach(item => {
      const div = document.createElement('div');
      div.className = 'action-log-entry';
      div.innerHTML = `<span class="action-log-time">${item.time}</span><span class="action-log-text">${item.text}</span>`;
      list.appendChild(div);
    });
  }

  // =============================================
  // 1. TRANSACTION SWITCHER & UI SYNC
  // =============================================
  function switchActiveTransaction(txnNum) {
    currentTxnId = txnNum;
    const txn = transactionDatabase.find(t => t.id === txnNum) || transactionDatabase[0];

    // Update Top Tabs
    $$('.txn-tab-btn').forEach(btn => {
      const id = parseInt(btn.dataset.txnid);
      btn.classList.toggle('active', id === txnNum);
    });

    // Update Page 1
    if ($('#display-txnid')) $('#display-txnid').textContent = txn.txnId;
    if ($('#display-orderid')) $('#display-orderid').textContent = txn.orderId;
    if ($('#display-amount')) $('#display-amount').textContent = '₹' + txn.amount.toLocaleString();
    if ($('#pay-btn-amount')) $('#pay-btn-amount').textContent = '₹' + txn.amount.toLocaleString();
    if ($('#display-init-time')) $('#display-init-time').textContent = getLiveTime();

    // Update Ledger
    if ($('#ledger-txnid')) $('#ledger-txnid').textContent = txn.txnId;
    if ($('#ledger-orderid')) $('#ledger-orderid').textContent = txn.orderId;
    if ($('#ledger-amount')) $('#ledger-amount').textContent = '₹' + txn.amount.toLocaleString();
    if ($('#ledger-token')) $('#ledger-token').textContent = txn.token;
    if ($('#ledger-time')) $('#ledger-time').textContent = getLiveTime() + '.104';

    // Update Crypto Token
    if ($('#crypto-token-display')) $('#crypto-token-display').textContent = txn.token;
    if ($('#token-value')) $('#token-value').textContent = txn.token.split('-').slice(0, 2).join('-');

    // Update Packet UI
    if ($('#packet-txnid')) $('#packet-txnid').textContent = txn.txnId;
    if ($('#packet-token')) $('#packet-token').textContent = txn.token;
    if ($('#packet-time')) $('#packet-time').textContent = getLiveTime() + '.000';

    // Update Engine Monitor
    if ($('#engine-current-txnid')) $('#engine-current-txnid').textContent = txn.txnId;
    if ($('#user-action-txnid')) $('#user-action-txnid').textContent = `TXN-0${txn.id}`;

    // Render timeline for switched txn
    renderUserActionTimeline(txn);

    // Sync active state UI
    if (txn.status === 'UNSTOPPED' || txn.status === 'RUNNING') {
      isEngineRunning = true;
      isTokenRotationActive = true;
      if ($('#engine-indicator-badge')) {
        $('#engine-indicator-badge').className = 'status-badge status-danger';
        $('#engine-indicator-badge').textContent = '🔴 ACTIVE (UNSTOPPED)';
      }
      if ($('#engine-live-dot')) $('#engine-live-dot').className = 'engine-dot active';
      if ($('#engine-live-text')) $('#engine-live-text').textContent = 'ACTIVE POLLING';
      if ($('#token-timer')) $('#token-timer').innerHTML = `Next rotation cycle in: <span id="token-countdown">4</span>s`;
    } else {
      isEngineRunning = false;
      isTokenRotationActive = false;
      if ($('#engine-indicator-badge')) {
        $('#engine-indicator-badge').className = 'status-badge status-success';
        $('#engine-indicator-badge').textContent = `🏁 TERMINAL: ${txn.status}`;
      }
      if ($('#engine-live-dot')) $('#engine-live-dot').className = 'engine-dot inactive';
      if ($('#engine-live-text')) $('#engine-live-text').textContent = `STOPPED (${txn.status})`;
      if ($('#token-timer')) $('#token-timer').innerHTML = `<strong class="text-green">🔒 Rotation Frozen — ${txn.status}</strong>`;
    }

    addEngineLog($('#engine-log'), getLiveTime(), `Switched context to ${txn.txnId} (Order ${txn.orderId})`, 'info');
  }

  // Update tabs visual status classes (RED BLINKING IF UNSTOPPED)
  function refreshTabIndicators() {
    transactionDatabase.forEach(txn => {
      const btn = $(`.txn-tab-btn[data-txnid="${txn.id}"]`);
      if (!btn) return;
      btn.classList.remove('running', 'unstopped', 'paused', 'refunded', 'reversed', 'reconciled', 'tampered');

      if (txn.status === 'UNSTOPPED' || txn.status === 'RUNNING') {
        btn.classList.add('unstopped'); // Blinks red
      } else if (txn.status === 'REFUNDED') {
        btn.classList.add('refunded'); // Solid green
      } else if (txn.status === 'REVERSED') {
        btn.classList.add('reversed'); // Solid blue/emerald
      } else if (txn.status === 'RECONCILIATION') {
        btn.classList.add('reconciled'); // Solid yellow/amber
      } else if (txn.status === 'INVALID_TAMPERED') {
        btn.classList.add('tampered'); // Solid red
      } else if (txn.status === 'PAUSED') {
        btn.classList.add('paused');
      }
    });
  }

  // Bind tab clicks
  $$('.txn-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchActiveTransaction(parseInt(btn.dataset.txnid));
    });
  });

  // =============================================
  // 2. 4 TERMINAL STATE ACTIONS (PAGE 7)
  // =============================================
  function applyTerminalState(state, reason, badgeClass = 'status-success') {
    const txn = transactionDatabase.find(t => t.id === currentTxnId);
    if (!txn) return;

    txn.status = state;
    txn.terminalState = state;
    isEngineRunning = false;
    isTokenRotationActive = false;

    if (tokenInterval) clearInterval(tokenInterval);
    if (engineInterval) clearInterval(engineInterval);

    // Refresh tabs
    refreshTabIndicators();

    // Update UI elements
    if ($('#engine-indicator-badge')) {
      $('#engine-indicator-badge').className = `status-badge ${badgeClass}`;
      $('#engine-indicator-badge').textContent = `🏁 ${state}`;
    }
    if ($('#engine-live-dot')) $('#engine-live-dot').className = 'engine-dot inactive';
    if ($('#engine-live-text')) {
      $('#engine-live-text').textContent = `STOPPED (${state})`;
    }
    if ($('#token-timer')) {
      $('#token-timer').innerHTML = `<strong class="text-green">🔒 Token Rotation Frozen — ${state}</strong>`;
    }

    if ($('#ledger-state')) {
      $('#ledger-state').className = `status-badge ${badgeClass}`;
      $('#ledger-state').textContent = state;
    }
    if ($('#ledger-verification')) {
      $('#ledger-verification').className = `status-badge ${badgeClass}`;
      $('#ledger-verification').textContent = state === 'INVALID_TAMPERED' ? 'REJECTED_TAMPER' : 'VERIFIED';
    }

    // Packet animation halt
    if ($('#packet-transit-dot')) {
      $('#packet-transit-dot').classList.remove('animating-gw-bank');
      $('#packet-transit-dot').style.left = 'calc(100% - 80px)';
    }

    // Log to user action timeline & engine log
    logUserAction(txn.id, `Applied Terminal State [${state}]: ${reason}`);
    addEngineLog($('#engine-log'), getLiveTime(), `🛑 [TERMINAL STATE] ${txn.txnId} ➔ ${state}. ${reason}`, state === 'INVALID_TAMPERED' ? 'danger' : 'success');
  }

  // 1. REFUNDED
  const btnActionRefund = $('#btn-action-refund');
  if (btnActionRefund) {
    btnActionRefund.addEventListener('click', () => {
      applyTerminalState(
        'REFUNDED',
        'Authoritative bank debit verified & 7-factor eligibility satisfied. Instant refund disbursed via UPI switch.',
        'status-success'
      );
    });
  }

  // 2. REVERSED
  const btnActionReverse = $('#btn-action-reverse');
  if (btnActionReverse) {
    btnActionReverse.addEventListener('click', () => {
      applyTerminalState(
        'REVERSED',
        'Acquiring bank triggered automated reversal rollback at NPCI switch. Ledger state updated.',
        'status-success'
      );
    });
  }

  // 3. RECONCILIATION
  const btnActionReconcile = $('#btn-action-reconcile');
  if (btnActionReconcile) {
    btnActionReconcile.addEventListener('click', () => {
      applyTerminalState(
        'RECONCILIATION',
        'Authoritative debit confirmation timeout (>120s) or missing gateway ACK. Moved to manual audit exception queue.',
        'status-warning'
      );
    });
  }

  // 4. INVALID / TAMPERED
  const btnActionTamper = $('#btn-action-tamper');
  if (btnActionTamper) {
    btnActionTamper.addEventListener('click', () => {
      applyTerminalState(
        'INVALID_TAMPERED',
        'Cryptographic hash mismatch. Payload integrity signature corrupted. Auto-refund permanently blocked & security audit flagged.',
        'status-danger'
      );
    });
  }

  // Global Header "Payment Received / Stop Engine" Button
  const globalRefundReceivedBtn = $('#global-refund-received-btn');
  if (globalRefundReceivedBtn) {
    globalRefundReceivedBtn.addEventListener('click', () => {
      applyTerminalState(
        'REFUNDED',
        'Payment confirmation received. Engine polling and rotating tokens safely halted.',
        'status-success'
      );
    });
  }

  // Global Start / Pause
  const globalStartBtn = $('#global-start-btn');
  if (globalStartBtn) {
    globalStartBtn.addEventListener('click', () => {
      const txn = transactionDatabase.find(t => t.id === currentTxnId);
      if (txn) txn.status = 'UNSTOPPED';
      refreshTabIndicators();
      isEngineRunning = true;
      isTokenRotationActive = true;
      startTokenRotation();
      startEngine();
      if ($('#engine-indicator-badge')) {
        $('#engine-indicator-badge').className = 'status-badge status-danger';
        $('#engine-indicator-badge').textContent = '🔴 ACTIVE (UNSTOPPED)';
      }
      if ($('#engine-live-dot')) $('#engine-live-dot').className = 'engine-dot active';
      if ($('#engine-live-text')) $('#engine-live-text').textContent = 'ACTIVE POLLING';
      logUserAction(currentTxnId, '▶ Manually resumed monitoring engine.');
      addEngineLog($('#engine-log'), getLiveTime(), `▶ Monitoring engine resumed for ${$('#display-txnid').textContent}`, 'info');
    });
  }

  const globalPauseBtn = $('#global-pause-btn');
  if (globalPauseBtn) {
    globalPauseBtn.addEventListener('click', () => {
      const txn = transactionDatabase.find(t => t.id === currentTxnId);
      if (txn) txn.status = 'PAUSED';
      refreshTabIndicators();
      isEngineRunning = false;
      isTokenRotationActive = false;
      if (tokenInterval) clearInterval(tokenInterval);
      if (engineInterval) clearInterval(engineInterval);
      if ($('#engine-live-text')) $('#engine-live-text').textContent = 'PAUSED';
      logUserAction(currentTxnId, '⏸ Manually paused monitoring engine.');
      addEngineLog($('#engine-log'), getLiveTime(), `⏸ Monitoring engine paused manually`, 'warning');
    });
  }

  // =============================================
  // 3. 120-SECOND MONITORING TIMEOUT ENGINE
  // =============================================
  setInterval(() => {
    transactionDatabase.forEach(txn => {
      if (txn.status === 'UNSTOPPED' || txn.status === 'RUNNING') {
        txn.uptime++;

        // Update active transaction uptime text
        if (txn.id === currentTxnId && $('#engine-uptime')) {
          const h = String(Math.floor(txn.uptime / 3600)).padStart(2, '0');
          const m = String(Math.floor((txn.uptime % 3600) / 60)).padStart(2, '0');
          const s = String(txn.uptime % 60).padStart(2, '0');
          $('#engine-uptime').textContent = `${h}:${m}:${s}`;
        }

        // 120 Seconds Timeout Trigger!
        if (txn.uptime === 120) {
          applyTerminalState(
            'RECONCILIATION',
            '120-second timeout reached without authoritative bank debit receipt. Transferred to Reconciliation Queue.',
            'status-warning'
          );
          if ($('#timeout-reconciliation-alert')) {
            $('#timeout-reconciliation-alert').classList.remove('hidden');
          }
        }
      }
    });
  }, 1000);

  const dismissAlertBtn = $('#dismiss-timeout-alert-btn');
  if (dismissAlertBtn) {
    dismissAlertBtn.addEventListener('click', () => {
      if ($('#timeout-reconciliation-alert')) {
        $('#timeout-reconciliation-alert').classList.add('hidden');
      }
    });
  }

  // =============================================
  // 4. NAVIGATION & SCROLL OBSERVERS
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
  // 5. PAYMENT DEMO (PAGE 1)
  // =============================================
  const payBtn = $('#pay-btn');
  if (payBtn) {
    payBtn.addEventListener('click', async () => {
      payBtn.disabled = true;
      payBtn.textContent = '⏳ Processing UPI Transfer...';

      logUserAction(currentTxnId, 'Initiated checkout payment of ' + $('#display-amount').textContent);

      const flowDiv = $('#payment-flow');
      if (flowDiv) flowDiv.classList.remove('hidden');

      const flowNodes = flowDiv.querySelectorAll('.flow-node');
      const flowArrows = flowDiv.querySelectorAll('.flow-arrow');

      for (let i = 0; i < flowNodes.length; i++) {
        await sleep(500);
        flowNodes[i].classList.add('active');
        if (i < flowArrows.length) flowArrows[i].classList.add('active');
      }

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

      logUserAction(currentTxnId, '🔴 Payment Failed registered at gateway. Continuous evidence correlation engine activated.');
      addEngineLog($('#engine-log'), getLiveTime(), `Payment failure registered for ${$('#display-txnid').textContent}. Correlation initiated.`, 'warning');
    });
  }

  // =============================================
  // 6. FLOW ANIMATIONS (PAGE 2 & 3)
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
  // 7. TOKEN ROTATION (PAGE 5)
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
        logUserAction(currentTxnId, 'Paused cryptographic evidence reference rotation.');
      } else {
        isTokenRotationActive = true;
        startTokenRotation();
        freezeTokenBtn.textContent = '⏸ Pause Rotation';
        freezeTokenBtn.className = 'btn btn-secondary';
        if ($('#token-timer')) $('#token-timer').innerHTML = `Next rotation cycle in: <span id="token-countdown">4</span>s`;
        logUserAction(currentTxnId, 'Resumed cryptographic evidence reference rotation.');
      }
    });
  }

  // =============================================
  // 8. PACKET TRANSIT & TAMPER AUDIT (PAGE 6)
  // =============================================
  const transmitPacketBtn = $('#transmit-packet-btn');
  const resetPacketBtn = $('#reset-packet-btn');
  const packetDot = $('#packet-transit-dot');

  if (transmitPacketBtn && packetDot) {
    transmitPacketBtn.addEventListener('click', () => {
      packetDot.classList.add('animating-gw-bank');
      logUserAction(currentTxnId, 'Transmitted signed verification packet (Gateway ➔ Bank).');
      addEngineLog($('#engine-log'), getLiveTime(), 'Transmitting signed evidence packet: Payment Gateway ➔ Bank Network', 'info');
    });
  }

  if (resetPacketBtn && packetDot) {
    resetPacketBtn.addEventListener('click', () => {
      packetDot.classList.remove('animating-gw-bank');
      packetDot.style.left = '50%';
      logUserAction(currentTxnId, 'Reset network transit state.');
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

      logUserAction(currentTxnId, '🚨 Simulated tamper attempt (₹1,499 ➔ ₹1,999). SHA-256 mismatch detected; auto-refund blocked.');
      addEngineLog($('#engine-log'), getLiveTime(), '🚨 Cryptographic verification failed! Signature digest mismatch. Evidence rejected.', 'danger');
    });
  }

  // =============================================
  // 9. CONTINUOUS ENGINE LOGS (PAGE 7)
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

  // =============================================
  // 10. CASE STUDY TRIGGERS (PAGE 8, 9, 10)
  // =============================================
  const runCase1Btn = $('#run-case1-btn');
  if (runCase1Btn) {
    runCase1Btn.addEventListener('click', async () => {
      runCase1Btn.disabled = true;
      runCase1Btn.textContent = '⏳ Executing Case 1...';

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
      logUserAction(currentTxnId, 'Executed Case 1: Immediate debit verified ➔ Rapid refund completed.');
    });
  }

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
      logUserAction(currentTxnId, 'Executed Case 2: Delayed debit confirmation received ➔ Re-correlated & settled.');
    });
  }

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
      logUserAction(currentTxnId, 'Executed Case 3: Missing debit confirmation ➔ Transferred to Exception Queue.');
    });
  }

  // =============================================
  // 11. EVIDENCE MATRIX (PAGE 11)
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
  // 12. EVENT CHAIN TAMPER (PAGE 12)
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
      logUserAction(currentTxnId, 'Simulated chain tampering on Block 3: Hash link broken.');
    });
  }

  // =============================================
  // 13. DECISION TREE (PAGE 13)
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
  // 14. METRICS ANIMATION (PAGE 15)
  // =============================================
  async function animateMetrics() {
    await sleep(200);
    const fills = $$('#metrics-dashboard .metric-bar-fill');
    fills.forEach(fill => {
      fill.style.width = (fill.dataset.fill || 0) + '%';
    });
  }

  // =============================================
  // 15. LIVE SIMULATION (PAGE 16)
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

  // Initial load
  refreshTabIndicators();
  switchActiveTransaction(1);
});
