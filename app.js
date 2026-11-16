(() => {
  const {
    bootLines,
    roles,
    workflowSteps,
    triageAlerts,
    mitreMap,
    phishFlags,
    skills,
    pcapScenarios,
    incidentCase
  } = window.PORTFOLIO_DATA;

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  const escHtml = s => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const debounce = (fn, ms = 150) => {
    let id;
    return (...args) => {
      clearTimeout(id);
      id = setTimeout(() => fn(...args), ms);
    };
  };

  /* Cyber Audio Synthesizer (Web Audio API - Zero External Dependencies) */
  class CyberAudio {
    constructor() {
      this.ctx = null;
      this.enabled = store.get('cyber-audio') === '1';
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.04) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    }
    keyPress() {
      if (!this.enabled) return;
      this.playTone(320 + Math.random() * 80, 'triangle', 0.02, 0.02);
    }
    click() {
      if (!this.enabled) return;
      this.playTone(580, 'sine', 0.04, 0.03);
    }
    beep() {
      if (!this.enabled) return;
      this.playTone(880, 'sine', 0.07, 0.04);
    }
    alert() {
      if (!this.enabled) return;
      this.playTone(280, 'sawtooth', 0.15, 0.04);
    }
    success() {
      if (!this.enabled) return;
      this.playTone(523.25, 'triangle', 0.1, 0.04);
      setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.04), 80);
      setTimeout(() => this.playTone(783.99, 'sine', 0.22, 0.05), 160);
    }
    contain() {
      if (!this.enabled) return;
      this.playTone(350, 'sawtooth', 0.09, 0.03);
      setTimeout(() => this.playTone(700, 'sine', 0.18, 0.05), 90);
    }
  }

  const audio = new CyberAudio();
  const audioBtn = $('#audioBtn');
  const updateAudioUI = () => {
    audioBtn.textContent = audio.enabled ? '🔊' : '🔇';
    audioBtn.classList.toggle('on', audio.enabled);
    audioBtn.setAttribute('aria-pressed', String(audio.enabled));
    audioBtn.title = audio.enabled ? 'Cyber Audio SFX: ON (Click to mute)' : 'Cyber Audio SFX: OFF (Click to enable)';
  };
  updateAudioUI();
  audioBtn.onclick = () => {
    audio.enabled = !audio.enabled;
    store.set('cyber-audio', audio.enabled ? '1' : '0');
    updateAudioUI();
    if (audio.enabled) {
      audio.init();
      audio.success();
      toast('🔊 Cyber audio FX activated');
    } else {
      toast('🔇 Cyber audio muted');
    }
  };

  const toast = msg => {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('show'), 2000);
  };

  $('#yr').textContent = new Date().getFullYear();

  /* Theme */
  const root = document.documentElement;
  const themeBtn = $('#themeBtn');
  const themeMeta = $('meta[name="theme-color"]');
  const applyTheme = theme => {
    root.dataset.theme = theme;
    themeBtn.setAttribute('aria-pressed', String(theme === 'dark'));
    if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#070b10' : '#f4f7fa');
  };

  const savedTheme = store.get('theme');
  const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

  themeBtn.onclick = () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    store.set('theme', next);
    audio.click();
  };

  /* Matrix rain with pause/resume + debounced resize */
  function matrix(canvas, getBg, getFg) {
    const g = canvas.getContext('2d');
    const chars = '01アイウエオカキクケコサシスセソABCDEF<>/{}#$%*';
    const fs = 15;
    let drops = [];
    let raf = 0;
    let last = 0;
    let stopped = false;
    let paused = false;

    const fit = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      canvas.width = r.width;
      canvas.height = r.height;
      drops = Array.from({ length: Math.ceil(r.width / fs) }, () => Math.random() * -40);
    };
    const onResize = debounce(fit, 150);
    fit();
    addEventListener('resize', onResize, { passive: true });

    const frame = t => {
      if (stopped || paused) { raf = 0; return; }
      raf = requestAnimationFrame(frame);
      if (t - last < 55) return;
      last = t;
      g.globalAlpha = .14;
      g.fillStyle = getBg();
      g.fillRect(0, 0, canvas.width, canvas.height);
      g.globalAlpha = 1;
      g.fillStyle = getFg();
      g.font = fs + 'px "JetBrains Mono", monospace';
      drops.forEach((y, i) => {
        g.fillText(chars[Math.random() * chars.length | 0], i * fs, y * fs);
        if (y * fs > canvas.height && Math.random() > .975) drops[i] = 0;
        drops[i]++;
      });
    };

    raf = requestAnimationFrame(frame);

    return {
      pause() {
        paused = true;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
      },
      resume() {
        if (stopped || !paused) return;
        paused = false;
        if (!raf) raf = requestAnimationFrame(frame);
      },
      stop() {
        stopped = true;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        removeEventListener('resize', onResize);
      }
    };
  }

  /* Boot sequence */
  const boot = $('#boot');
  const bootLog = $('#bootLog');
  let bootDone = false;
  let bootRainCtrl = null;

  const endBoot = () => {
    if (bootDone) return;
    bootDone = true;
    boot.classList.add('done');
    boot.setAttribute('aria-hidden', 'true');
    setTimeout(() => bootRainCtrl && bootRainCtrl.stop(), 600);
    try { sessionStorage.setItem('booted', '1'); } catch (e) {}
  };

  let seen = false;
  try { seen = sessionStorage.getItem('booted') === '1'; } catch (e) {}
  if (seen || reduced) {
    boot.style.display = 'none';
    boot.setAttribute('aria-hidden', 'true');
    bootDone = true;
  } else {
    bootRainCtrl = matrix($('#bootRain'), () => '#05080c', () => '#3ddc97');
    bootLines.forEach(([c, txt], i) => {
      setTimeout(() => {
        const d = document.createElement('div');
        d.className = 'ln ' + c;
        d.textContent = txt;
        bootLog.appendChild(d);
        audio.keyPress();
      }, 180 * i);
    });
    setTimeout(endBoot, 180 * bootLines.length + 500);
    boot.addEventListener('click', endBoot);
    addEventListener('keydown', endBoot, { once: true });
  }

  let heroRainCtrl = null;
  if (!reduced) {
    const cssVar = n => getComputedStyle(root).getPropertyValue(n).trim();
    heroRainCtrl = matrix($('#rain'), () => cssVar('--bg'), () => cssVar('--accent'));
  }

  /* Mobile menu */
  const menuBtn = $('#menuBtn');
  const navUl = $('#navLinks');
  const setMenu = o => {
    navUl.classList.toggle('open', o);
    menuBtn.classList.toggle('open', o);
    menuBtn.setAttribute('aria-expanded', String(o));
    audio.click();
  };
  menuBtn.onclick = () => setMenu(!navUl.classList.contains('open'));
  navUl.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

  /* Custom cursor */
  if (matchMedia('(pointer: fine)').matches) {
    const ring = $('.cur-ring');
    const dot = $('.cur-dot');
    let x = -100, y = -100, rx = x, ry = y;
    addEventListener('pointermove', e => {
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate(${x}px,${y}px)`;
      ring.classList.toggle('hover', !!e.target.closest('a, button, input, .flip, .tag, .flag, .incident-node, .ws-tab, tr'));
    });
    document.addEventListener('mouseleave', () => {
      x = y = -100;
      dot.style.transform = 'translate(-100px,-100px)';
    });
    (function loop() {
      const k = reduced ? 1 : .2;
      rx += (x - rx) * k;
      ry += (y - ry) * k;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(loop);
    })();
  }

  /* Uptime */
  const t0 = Date.now();
  setInterval(() => {
    const s = (Date.now() - t0) / 1000 | 0;
    $('#uptime').textContent = [s / 3600 | 0, (s / 60 | 0) % 60, s % 60]
      .map(n => String(n).padStart(2, '0'))
      .join(':');
  }, 1000);

  /* Typed roles */
  const typed = $('#typed');
  if (reduced) {
    typed.textContent = roles[0];
  } else {
    let r = 0, i = 0, del = false;
    (function tick() {
      const w = roles[r];
      typed.innerHTML = '<b>' + escHtml(w.slice(0, i)) + '</b>';
      if (!del && i === w.length) { del = true; return setTimeout(tick, 1600); }
      if (del && i === 0) { del = false; r = (r + 1) % roles.length; }
      i += del ? -1 : 1;
      setTimeout(tick, del ? 35 : 75);
    })();
  }

  /* Network canvas with offscreen/hidden pause + debounced resize */
  const cv = $('#net');
  const cx = cv.getContext('2d');
  let W = 0, H = 0, nodes = [], mouse = { x: -999, y: -999 };
  let netRaf = 0;
  let heroVisible = true;

  const sizeNet = () => {
    const r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    W = cv.width = r.width * devicePixelRatio;
    H = cv.height = r.height * devicePixelRatio;
    const n = Math.min(80, Math.floor(r.width * r.height / 14000));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - .5) * .4 * devicePixelRatio,
      vy: (Math.random() - .5) * .4 * devicePixelRatio,
      threat: Math.random() < .08
    }));
  };
  sizeNet();
  addEventListener('resize', debounce(sizeNet, 150), { passive: true });
  cv.parentElement.addEventListener('mousemove', e => {
    const r = cv.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * devicePixelRatio;
    mouse.y = (e.clientY - r.top) * devicePixelRatio;
  });
  cv.parentElement.addEventListener('mouseleave', () => { mouse.x = mouse.y = -999; });

  const col = () => getComputedStyle(root).getPropertyValue('--accent').trim();
  function drawNet() {
    netRaf = 0;
    if (!heroVisible || document.hidden) return;
    const a = col();
    const crit = getComputedStyle(root).getPropertyValue('--crit').trim();
    const D = 130 * devicePixelRatio;
    cx.clearRect(0, 0, W, H);
    for (const p of nodes) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      const md = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (md > 0 && md < D * 1.2) {
        p.x += (p.x - mouse.x) / md * 1.2;
        p.y += (p.y - mouse.y) / md * 1.2;
      }
    }
    cx.lineWidth = devicePixelRatio;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const p = nodes[i], q = nodes[j], d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < D) {
          cx.strokeStyle = a;
          cx.globalAlpha = (1 - d / D) * .35;
          cx.beginPath();
          cx.moveTo(p.x, p.y);
          cx.lineTo(q.x, q.y);
          cx.stroke();
        }
      }
    }
    for (const p of nodes) {
      cx.globalAlpha = 1;
      cx.fillStyle = p.threat ? crit : a;
      cx.beginPath();
      cx.arc(p.x, p.y, (p.threat ? 3 : 2) * devicePixelRatio, 0, 7);
      cx.fill();
      if (p.threat) {
        cx.globalAlpha = .25 + .2 * Math.sin(Date.now() / 300);
        cx.beginPath();
        cx.arc(p.x, p.y, 9 * devicePixelRatio, 0, 7);
        cx.fill();
      }
    }
    if (!reduced) netRaf = requestAnimationFrame(drawNet);
  }

  const syncHeroAnimations = () => {
    const active = heroVisible && !document.hidden;
    if (active) {
      if (heroRainCtrl) heroRainCtrl.resume();
      if (!netRaf) netRaf = requestAnimationFrame(drawNet);
    } else {
      if (heroRainCtrl) heroRainCtrl.pause();
      if (netRaf) { cancelAnimationFrame(netRaf); netRaf = 0; }
    }
  };

  const heroEl = $('.hero');
  if (heroEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      syncHeroAnimations();
    }, { threshold: 0.01 }).observe(heroEl);
  }
  document.addEventListener('visibilitychange', syncHeroAnimations);
  drawNet();

  /* Interactive terminal */
  const out = $('#termOut');
  const inp = $('#termIn');
  const body = $('#termBody');
  const hist = [];
  let hi = 0;

  const print = (html, cls = '') => {
    const d = document.createElement('div');
    d.className = 'term-line ' + cls;
    d.innerHTML = html;
    out.appendChild(d);
    body.scrollTop = body.scrollHeight;
  };

  /* SOC Defense Sandbox Tab Navigation */
  function switchLabPane(paneId, scroll = false) {
    const tabs = $$('#labNav .lab-tab');
    const panes = $$('.lab-pane');
    tabs.forEach(t => {
      const active = t.dataset.pane === paneId;
      t.classList.toggle('on', active);
      t.setAttribute('aria-selected', String(active));
    });
    panes.forEach(p => {
      p.classList.toggle('active', p.id === paneId);
    });
    if (scroll) {
      const target = $('#labs');
      if (target) {
        target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }
    }
  }

  const cmds = {
    help: () => print('<span class="c">available commands:</span>\n  <span class="k">whoami</span>      who is this analyst\n  <span class="k">labs</span>        open SOC Defense Sandbox (all 4 interactive labs)\n  <span class="k">incident</span>    open the Incident War Room attack graph\n  <span class="k">packets</span>     open the Mini-Wireshark PCAP inspector\n  <span class="k">triage</span>      jump to the Triage Lab\n  <span class="k">phish</span>       jump to the Phish Hunt\n  <span class="k">skills</span>      tools &amp; tech stack\n  <span class="k">experience</span>  work history\n  <span class="k">certs</span>       certifications\n  <span class="k">education</span>   academic background\n  <span class="k">projects</span>    things I built\n  <span class="k">scan</span>        run a (fake) threat scan\n  <span class="k">nmap</span>        scan this portfolio\n  <span class="k">whois</span>       lookup the analyst\n  <span class="k">ping</span>        check if I\'m available\n  <span class="k">audio</span>       toggle cyber sound FX\n  <span class="k">contact</span>     get in touch\n  <span class="k">resume</span>      download my resume\n  <span class="k">print</span>       print-friendly resume view\n  <span class="k">theme</span>       toggle light/dark\n  <span class="k">history</span>     past commands\n  <span class="k">clear</span>       clear the screen\n<span class="c">psst… there are hidden commands too 👀</span>'),
    whoami: () => print('<span class="s">Mohamad Syazwan Mohd Shukri</span>\nSOC Analyst @ BitRanger Sdn. Bhd. · Penang, MY\nK-Youth Development Programme, Khazanah Nasional\nBIT (Hons.) Computer System Security @ UniKL MIIT\nEx-SOC intern @ Heitech Padu Berhad'),
    labs: () => { print('jumping to SOC Defense Sandbox...'); switchLabPane('pane-incident', true); },
    incident: () => { print('opening Incident War Room attack graph...'); switchLabPane('pane-incident', true); },
    packets: () => { print('opening Mini-Wireshark PCAP inspector...'); switchLabPane('pane-packets', true); },
    skills: () => print('<span class="k">siem</span>     : Stellar Cyber, RSA NetWitness, Security Onion, Elasticsearch\n<span class="k">edr</span>      : Bitdefender, Trend Micro DSM\n<span class="k">ids/suricata</span> : Suricata, Zeek, Sysmon\n<span class="k">firewall</span> : Palo Alto, Sangfor, Huawei, FortiWeb WAF\n<span class="k">network</span>  : MikroTik RouterOS, Wireshark\n<span class="k">os</span>       : Kali Linux, Ubuntu, Windows\n<span class="k">code</span>     : Python, Java, C++, Solidity'),
    experience: () => print('<span class="s">[Aug 2026 – Present]</span>  SOC Analyst @ BitRanger Sdn. Bhd. (CyRes, USM)\n  › Architected OwlSight MRA & Security Onion data pipeline across 3 enterprise client networks (MBPP, PDC, USM)\n  › K-Youth Development Programme, Khazanah Nasional\n<span class="s">[Oct 2024 – Feb 2025]</span> SOC Analyst Intern @ Heitech Padu Berhad\n  › SIEM alert monitoring, IOC threat hunting, firewall/WAF blocking\n<span class="s">[Mar 2021 – Jul 2021]</span> Telecom Drafter Intern @ ECHO Broadband\n  › Fiber optic network drafting, SLDs'),
    certs: () => print('<span class="p">✓</span> CompTIA Security+  <span class="c">(Dec 2023)</span>\n<span class="p">✓</span> MikroTik MTCNA     <span class="c">(Dec 2020)</span>'),
    education: () => print('BIT (Hons.) Computer System Security, UniKL MIIT · CGPA 3.50 (7× Dean\'s List)\nDiploma Electronic Eng. (Data Transmission &amp; Networking), MJII · CGPA 3.55'),
    projects: () => print('› <b style="color:var(--accent)">OwlSight MRA (BitRanger Sdn. Bhd.)</b>\n  SOC automation platform integrating Security Onion & Elasticsearch with on-premise AI assistance.\n  Interactive Tour: <a href="owlsight-tour.html" target="_blank" rel="noopener noreferrer">mosyaz.my/owlsight-tour.html</a>\n› Crowdfunding Using Blockchain (Solidity, MetaMask, OWASP hardening)\n› Smart Dustbin with ESP32 & IoT (Blynk, ultrasonic sensor)'),
    contact: () => print('email    : <a href="mailto:syazwanshkri1@gmail.com">syazwanshkri1@gmail.com</a>\nlinkedin : <a href="https://www.linkedin.com/in/syazwan-shukri/" target="_blank" rel="noopener noreferrer">linkedin.com/in/syazwan-shukri</a>'),
    resume: () => {
      print('<span class="p">↓</span> downloading RESUME_SYAZWAN_SHUKRI.pdf...');
      const a = document.createElement('a');
      a.href = 'RESUME_SYAZWAN_SHUKRI.pdf';
      a.download = '';
      a.click();
    },
    triage: () => { print('opening Triage Lab...'); switchLabPane('pane-triage', true); },
    theme: () => { themeBtn.click(); print('theme → ' + root.dataset.theme); },
    audio: () => { audioBtn.click(); print('audio → ' + (audio.enabled ? 'ON' : 'MUTED')); },
    clear: () => { out.innerHTML = ''; },
    scan: () => {
      const steps = [
        '[*] enumerating endpoints...',
        '[*] querying SIEM for last 24h...',
        '[*] matching IOCs against threat intel...',
        '[!] 0 critical · 2 suspicious IPs found',
        '[+] suspicious IPs blocked at firewall ✓',
        '<span class="p">[✓] environment secure. good job, analyst.</span>'
      ];
      steps.forEach((s, i) => setTimeout(() => {
        print(s, i === 3 ? 's' : '');
        audio.keyPress();
      }, 380 * i));
    },
    'sudo hire-me': () => {
      print('[sudo] password for recruiter: ********');
      setTimeout(() => {
        print('<span class="p">✓ Access granted.</span> Great choice! Reach me at <a href="mailto:syazwanshkri1@gmail.com">syazwanshkri1@gmail.com</a> 🚀');
        audio.success();
      }, 600);
      confetti();
    },
    sudo: () => print('<span class="e">usage: sudo hire-me</span>'),
    ls: () => print('about.txt  experience.log  incident.case  pcap/  skills.yml  certs/  projects/  resume.pdf'),
    'rm -rf /': () => print('<span class="e">nice try. incident logged and escalated to L2 😄</span>'),
    nmap: () => {
      const L = [
        'Starting Nmap 7.94 ( https://nmap.org )',
        'Nmap scan report for syazwan.portfolio',
        'PORT      STATE     SERVICE   VERSION',
        '22/tcp    filtered  ssh',
        '80/tcp    open      http      portfolio v3.0',
        '443/tcp   open      https     TLS 1.3',
        '<span class="p">1337/tcp  open      connect   happy to talk security</span>',
        'Nmap done: 1 IP address (1 host up) scanned in 0.42s'
      ];
      L.forEach((l, i) => setTimeout(() => {
        print(l);
        audio.keyPress();
      }, 140 * i));
    },
    whois: () => print('<span class="k">Domain</span>:      syazwan.portfolio\n<span class="k">Registrant</span>:  Mohamad Syazwan Mohd Shukri\n<span class="k">Role</span>:        SOC Analyst @ BitRanger Sdn. Bhd.\n<span class="k">Certs</span>:       CompTIA Security+, MikroTik MTCNA\n<span class="k">Location</span>:    Penang, MY\n<span class="k">Status</span>:      <span class="p">onShift ✓  openToConnect ✓</span>'),
    ping: () => {
      print('PING you → syazwan (on-shift): 56 data bytes');
      [12, 9, 11, 8].forEach((t, i) => setTimeout(() => {
        print(`64 bytes from syazwan: icmp_seq=${i + 1} ttl=64 time=${t} ms <span class="c">· replies fast</span>`);
        audio.beep();
      }, 350 * (i + 1)));
      setTimeout(() => print('<span class="p">4 packets transmitted, 4 received, 0% packet loss. Reachable ✓</span>'), 1750);
    },
    history: () => print(hist.map((h, i) => `  ${String(i + 1).padStart(3)}  ${escHtml(h)}`).join('\n')),
    'cat /etc/motd': () => print('<span class="s">Welcome to SOC-OS.</span>\nEvery alert tells a story. Read the logs, trust the evidence,\nescalate early, and document everything.'),
    motd: () => cmds['cat /etc/motd'](),
    date: () => print(escHtml(new Date().toString())),
    echo: args => print(escHtml(args || '')),
    phish: () => { print('opening Phish Hunt...'); switchLabPane('pane-phishing', true); },
    print: () => { print('opening print view...'); setTimeout(() => window.print(), 300); },
    exit: () => print('logout... just kidding, an analyst never leaves mid-shift 😄'),
    matrix: () => { print('<span class="p">wake up, analyst...</span>'); matrixBurst(); },
    hack: () => { print('<span class="e">[!] unauthorized hacking detected.</span>'); setTimeout(() => print('<span class="p">just kidding. defense is the real flex. 🛡️</span>'), 700); },
    coffee: () => print('☕ brewing... SOC analysts run on caffeine and correlation rules.')
  };

  const run = raw => {
    const c = raw.trim().toLowerCase();
    if (!c) return;
    print('<span class="p">$</span> ' + escHtml(c));
    hist.push(c);
    hi = hist.length;
    const [head] = c.split(/\s+/);
    if (cmds[c]) cmds[c]('');
    else if (cmds[head]) cmds[head](raw.trim().slice(head.length).trim());
    else print(`<span class="e">command not found: ${escHtml(c)}</span> · type <span class="k">help</span>`);
    audio.click();
  };

  function matrixBurst() {
    if (reduced) return;
    const c = document.createElement('canvas');
    c.className = 'fx-canvas matrix-burst';
    document.body.appendChild(c);
    const ctrl = matrix(c, () => '#05080c', () => '#3ddc97');
    setTimeout(() => {
      c.classList.add('fade-out');
      setTimeout(() => { ctrl.stop(); c.remove(); }, 650);
    }, 3200);
  }

  /* Konami code easter egg */
  const konami = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let kp = 0;
  addEventListener('keydown', e => {
    if (e.target === inp) return;
    kp = e.key.toLowerCase() === konami[kp] ? kp + 1 : (e.key.toLowerCase() === konami[0] ? 1 : 0);
    if (kp === konami.length) {
      kp = 0;
      matrixBurst();
      confetti();
      audio.success();
      toast('🕹 Konami code accepted: secret analyst mode unlocked');
    }
  });

  inp.addEventListener('keydown', e => {
    audio.keyPress();
    if (e.key === 'Enter') { run(inp.value); inp.value = ''; }
    else if (e.key === 'ArrowUp') { if (hi > 0) inp.value = hist[--hi]; e.preventDefault(); }
    else if (e.key === 'ArrowDown') { inp.value = hi < hist.length - 1 ? hist[++hi] : (hi = hist.length, ''); e.preventDefault(); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const m = Object.keys(cmds).find(k => k.startsWith(inp.value.toLowerCase()));
      if (m) inp.value = m;
    }
  });
  body.addEventListener('click', () => inp.focus({ preventScroll: true }));
  $$('#chips button').forEach(b => b.onclick = () => run(b.textContent));
  print('<span class="c">Welcome to syazwan@soc. Type</span> <span class="k">help</span> <span class="c">or click a command below.</span>');
  setTimeout(() => run('whoami'), 400);

  /* Confetti */
  function confetti() {
    if (reduced) return;
    const c = document.createElement('canvas');
    c.className = 'fx-canvas';
    document.body.appendChild(c);
    const g = c.getContext('2d');
    c.width = innerWidth;
    c.height = innerHeight;
    const colors = ['#3ddc97', '#63b3ed', '#f6c453', '#ff6b6b'];
    const ps = Array.from({ length: 140 }, () => ({
      x: innerWidth / 2,
      y: innerHeight / 2,
      vx: (Math.random() - .5) * 16,
      vy: Math.random() * -14 - 4,
      s: Math.random() * 6 + 3,
      c: colors[Math.random() * 4 | 0],
      r: Math.random() * 6
    }));
    let f = 0;
    (function step() {
      g.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => {
        p.vy += .4;
        p.x += p.vx;
        p.y += p.vy;
        p.r += .2;
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.r);
        g.fillStyle = p.c;
        g.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6);
        g.restore();
      });
      if (++f < 120) requestAnimationFrame(step);
      else c.remove();
    })();
  }

  /* Copy email */
  $$('[data-copy]').forEach(b => b.onclick = async () => {
    audio.click();
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      toast('✓ email copied to clipboard');
    } catch (e) {
      location.href = 'mailto:' + b.dataset.copy;
    }
  });

  /* Scroll: progress, active nav, to-top */
  const links = $$('#navLinks a');
  const secs = links.map(a => $(a.getAttribute('href')));
  const onScroll = () => {
    const h = document.documentElement;
    const denom = h.scrollHeight - h.clientHeight;
    $('#progress').style.width = (denom > 0 ? h.scrollTop / denom * 100 : 0) + '%';
    $('#toTop').classList.toggle('show', h.scrollTop > 600);
    let cur = -1;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < 140) cur = i; });
    links.forEach((a, i) => a.classList.toggle('active', i === cur));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  $('#toTop').onclick = () => {
    audio.click();
    scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  /* Reveal + counters */
  const countUp = el => {
    const end = parseFloat(el.dataset.count);
    const dec = +el.dataset.dec || 0;
    const suf = el.dataset.suffix || '';
    const tStart = performance.now();
    const dur = 1400;
    (function f(t) {
      const k = Math.min(1, (t - tStart) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = (end * e).toFixed(dec) + suf;
      if (k < 1) requestAnimationFrame(f);
    })(tStart);
  };

  function fillMeter(m) {
    [...m.children].forEach((i, k) => setTimeout(() => i.classList.toggle('f', k < +m.dataset.l), k * 120));
  }

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    e.target.querySelectorAll('[data-count]').forEach(countUp);
    e.target.querySelectorAll('.meter').forEach(fillMeter);
    io.unobserve(e.target);
  }), { threshold: .15 });
  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 80 + 'ms';
    io.observe(el);
  });

  /* Spotlight cards */
  document.addEventListener('pointermove', e => {
    const c = e.target.closest('.card');
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', e.clientX - r.left + 'px');
    c.style.setProperty('--my', e.clientY - r.top + 'px');
  });

  /* 3D tilt on projects */
  if (!reduced) {
    $$('.proj').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        c.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
      });
      c.addEventListener('pointerleave', () => { c.style.transform = ''; });
    });
  }

  /* Workflow */
  const flow = $('#flow');
  const det = $('#stepDetail');
  const showStep = i => {
    $$('#flow .step').forEach((b, j) => b.classList.toggle('on', i === j));
    const [t, d, tools] = workflowSteps[i];
    det.innerHTML = `<h4>[0${i + 1}] ${escHtml(t)}</h4><p>${escHtml(d)}</p><div class="tools">⚙ ${escHtml(tools)}</div>`;
  };
  workflowSteps.forEach(([t], i) => {
    const b = document.createElement('button');
    b.className = 'card step lift';
    b.innerHTML = `<div class="n">[0${i + 1}]</div><h4>${escHtml(t)}</h4>`;
    b.onclick = () => {
      audio.click();
      showStep(i);
    };
    flow.appendChild(b);
  });
  showStep(0);

  /* Lab Navigation Tabs & Deep Links */
  $$('#labNav .lab-tab').forEach(btn => {
    btn.onclick = () => {
      audio.click();
      switchLabPane(btn.dataset.pane);
    };
  });

  const handleLabHash = () => {
    const h = (location.hash || '').replace('#', '').toLowerCase();
    const map = {
      incident: 'pane-incident',
      'pane-incident': 'pane-incident',
      packets: 'pane-packets',
      'pane-packets': 'pane-packets',
      triage: 'pane-triage',
      'pane-triage': 'pane-triage',
      phish: 'pane-phishing',
      phishing: 'pane-phishing',
      'pane-phishing': 'pane-phishing',
      labs: 'pane-incident'
    };
    if (map[h]) {
      switchLabPane(map[h], true);
    }
  };
  window.addEventListener('hashchange', handleLabHash);
  if (location.hash) {
    setTimeout(handleLabHash, 100);
  }

  /* Feature 1: Interactive Incident War Room / Attack Graph */
  const incidentChainEl = $('#incidentChain');
  const actionListEl = $('#actionList');
  const containBar = $('#containBar');
  const caseStatusBadge = $('#caseStatusBadge');
  const containBanner = $('#containBanner');
  const executedActions = new Set();

  const renderIncidentNodes = selectedNodeId => {
    incidentChainEl.innerHTML = '';
    incidentCase.nodes.forEach((n, idx) => {
      const isContained = executedActions.has(n.containedBy);
      const isSelected = selectedNodeId ? n.id === selectedNodeId : idx === 0;
      const card = document.createElement('div');
      card.className = `incident-node ${isContained ? 'contained' : 'compromised'} ${isSelected ? 'active-node' : ''}`;
      card.innerHTML = `
        <div class="incident-node-top">
          <h4>[0${idx + 1}] ${escHtml(n.title)}</h4>
          <span class="node-tactic">${escHtml(n.tactic)}</span>
        </div>
        <div class="node-host">${escHtml(n.host)}</div>
        <p class="node-desc">${escHtml(n.desc)}</p>
        <span class="node-badge">${isContained ? '🛡️ SEVERED &amp; CONTAINED' : '🚨 COMPROMISED LINK'}</span>
      `;
      card.onclick = () => {
        audio.click();
        renderIncidentNodes(n.id);
        inspectNode(n);
      };
      incidentChainEl.appendChild(card);
      if (isSelected) inspectNode(n);
    });
  };

  const inspectNode = n => {
    $('#nodeDetailTactic').textContent = n.tactic;
    $('#nodeDetailTitle').textContent = n.title + ' — ' + n.host;
    $('#nodeDetailDesc').textContent = n.desc;
    $('#nodeDetailArtifact').textContent = 'Forensic Artifact: ' + n.artifact;
  };

  const renderContainmentActions = () => {
    actionListEl.innerHTML = '';
    incidentCase.actions.forEach(a => {
      const isDone = executedActions.has(a.id);
      const btn = document.createElement('button');
      btn.className = `action-btn ${isDone ? 'done' : ''}`;
      btn.disabled = isDone;
      btn.innerHTML = `<b>${isDone ? '✓ Executed: ' : '▶ Execute: '}${escHtml(a.label)}</b><span>${escHtml(a.desc)}</span>`;
      btn.onclick = () => executeContainment(a);
      actionListEl.appendChild(btn);
    });
  };

  const executeContainment = action => {
    if (executedActions.has(action.id)) return;
    executedActions.add(action.id);
    audio.contain();
    const pct = Math.round((executedActions.size / incidentCase.actions.length) * 100);
    containBar.style.width = pct + '%';
    renderContainmentActions();
    renderIncidentNodes();

    if (executedActions.size === incidentCase.actions.length) {
      caseStatusBadge.textContent = '✓ FULLY CONTAINED';
      caseStatusBadge.className = 'incident-status-pill contained';
      containBanner.classList.add('show');
      audio.success();
      confetti();
      toast('🏆 Threat chain severed: Incident fully contained!');
    } else {
      toast(`Action applied: ${action.label}`);
    }
  };

  renderIncidentNodes();
  renderContainmentActions();

  /* Feature 2: Mini-Wireshark Packet Inspector */
  const wsScenarioTabsEl = $('#wsScenarioTabs');
  const wsFilterDisplayEl = $('#wsFilterDisplay');
  const wsTableBodyEl = $('#wsTableBody');
  const wsTreeDissectEl = $('#wsTreeDissect');
  const wsHexDumpEl = $('#wsHexDump');
  const wsAnalystNotesEl = $('#wsAnalystNotes');
  const wsMitigationTextEl = $('#wsMitigationText');
  let currentScenario = pcapScenarios[0];
  let activePacketIdx = 0;

  const selectScenario = sc => {
    currentScenario = sc;
    activePacketIdx = 0;
    $$('#wsScenarioTabs .ws-tab').forEach((b, i) => b.classList.toggle('on', pcapScenarios[i].id === sc.id));
    wsFilterDisplayEl.textContent = sc.displayFilter;
    wsAnalystNotesEl.textContent = sc.analystNotes;
    wsMitigationTextEl.textContent = sc.mitigation;
    renderPacketsTable();
    inspectPacket(0);
  };

  const renderPacketsTable = () => {
    wsTableBodyEl.innerHTML = '';
    currentScenario.packets.forEach((p, idx) => {
      const tr = document.createElement('tr');
      if (idx === activePacketIdx) tr.className = 'active';
      tr.innerHTML = `
        <td>${p.no}</td>
        <td>${p.time}</td>
        <td>${escHtml(p.src)}</td>
        <td>${escHtml(p.dst)}</td>
        <td><span class="mono" style="color:var(--accent)">${escHtml(p.proto)}</span></td>
        <td>${p.len}</td>
        <td>${escHtml(p.info)}</td>
      `;
      tr.onclick = () => {
        audio.click();
        activePacketIdx = idx;
        $$('#wsTableBody tr').forEach((r, i) => r.classList.toggle('active', i === idx));
        inspectPacket(idx);
      };
      wsTableBodyEl.appendChild(tr);
    });
  };

  const inspectPacket = idx => {
    const p = currentScenario.packets[idx] || currentScenario.packets[0];
    if (!p) return;
    wsTreeDissectEl.textContent = p.layers.join('\n\n');
    wsHexDumpEl.textContent = p.hex;
  };

  pcapScenarios.forEach((sc, i) => {
    const btn = document.createElement('button');
    btn.className = `ws-tab ${i === 0 ? 'on' : ''}`;
    btn.textContent = sc.name;
    btn.onclick = () => {
      audio.click();
      selectScenario(sc);
    };
    wsScenarioTabsEl.appendChild(btn);
  });
  selectScenario(pcapScenarios[0]);

  /* Triage lab */
  const mitreHtml = a => {
    const m = mitreMap[a.title];
    if (!m) return '<div class="mitre">MITRE ATT&amp;CK: none (benign activity)</div>';
    return '<div class="mitre">MITRE ATT&amp;CK: ' + m.map(([id, name]) =>
      `<a href="https://attack.mitre.org/techniques/${id.replace('.', '/')}/" target="_blank" rel="noopener noreferrer"><b>${escHtml(id)}</b> ${escHtml(name)}</a>`
    ).join('') + '</div>';
  };

  let order, idx, score, streak, answered;
  const ranks = [[0, 'Trainee'], [3, 'L1 Analyst'], [5, 'Senior L1'], [7, 'L2 Analyst'], [8, 'Threat Hunter 🏆']];

  const updScore = () => {
    $('#sScore').textContent = score;
    $('#sStreak').textContent = streak;
    $('#sProg').textContent = `${Math.min(idx + (answered ? 1 : 0), order.length)} / ${order.length}`;
    $('#sBar').style.width = (Math.min(idx + (answered ? 1 : 0), order.length) / order.length * 100) + '%';
    $('#sRank').textContent = ranks.filter(r => score >= r[0]).pop()[1];
  };

  const showAlert = () => {
    answered = false;
    const a = triageAlerts[order[idx]];
    const s = $('#aSev');
    s.className = 'sev ' + a.sev;
    s.textContent = a.sev.toUpperCase();
    $('#aMeta').textContent = `${a.src} · #${String(4100 + order[idx] * 7).padStart(5, '0')}`;
    $('#aTitle').textContent = a.title;
    $('#aLog').textContent = a.log;
    $('#feedback').className = 'feedback';
    $('#verdictBtns').style.display = 'flex';
    updScore();
  };

  const startGame = () => {
    order = triageAlerts.map((_, i) => i).sort(() => Math.random() - .5);
    idx = 0;
    score = 0;
    streak = 0;
    showAlert();
  };

  const finish = () => {
    const pct = Math.round(score / order.length * 100);
    $('#aSev').className = 'sev low';
    $('#aSev').textContent = 'COMPLETE';
    $('#aTitle').textContent = `Shift complete: ${score}/${order.length} correct (${pct}%)`;
    $('#aLog').textContent = pct === 100
      ? 'Flawless triage. You would fit right into a SOC team!'
      : pct >= 60
        ? 'Solid work, analyst. A few more shifts and you will be L2 material.'
        : 'Tough shift! Every analyst starts somewhere. Try again?';
    $('#feedback').className = 'feedback show good';
    $('#feedback').innerHTML = 'Like how this lab thinks? <a href="#contact">Let\'s talk</a>, I\'d love to bring this mindset to your SOC.';
    if (pct >= 75) {
      audio.success();
      confetti();
    }
  };

  const submitVerdict = v => {
    if (answered) return;
    answered = true;
    const a = triageAlerts[order[idx]];
    const ok = (v === 'tp') === a.tp;
    if (ok) {
      score++;
      streak++;
      audio.beep();
    } else {
      streak = 0;
      audio.alert();
      const c = $('#alertCard');
      c.classList.remove('shake');
      void c.offsetWidth;
      c.classList.add('shake');
    }
    const fb = $('#feedback');
    const last = idx === order.length - 1;
    fb.innerHTML = `<strong>${ok ? '✓ Correct!' : '✗ Not quite.'}</strong> This is a <strong>${a.tp ? 'True Positive' : 'False Positive'}</strong>. ${escHtml(a.why)}
      ${mitreHtml(a)}
      <div class="feedback-actions"><button class="btn" id="nextBtn">${last ? '🏁 See results' : 'Next alert →'}</button></div>`;
    fb.className = 'feedback show ' + (ok ? 'good' : 'bad');
    $('#verdictBtns').style.display = 'none';
    updScore();
    $('#nextBtn').onclick = () => {
      audio.click();
      if (last) finish();
      else { idx++; showAlert(); }
    };
  };

  $$('#verdictBtns button').forEach(b => b.onclick = () => submitVerdict(b.dataset.v));
  $('#restart').onclick = () => {
    audio.click();
    startGame();
  };
  startGame();

  /* Triage Lab keyboard shortcuts when section is visible and active */
  let triageVisible = false;
  const triageSec = $('#pane-triage');
  if (triageSec && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      triageVisible = entries[0].isIntersecting;
    }, { threshold: 0.15 }).observe(triageSec);
  }
  addEventListener('keydown', e => {
    if (!triageVisible || !triageSec || !triageSec.classList.contains('active') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && e.target.closest('input, textarea, select, [contenteditable]')) return;
    const key = e.key.toLowerCase();
    if (!answered && $('#verdictBtns').style.display !== 'none') {
      if (key === '1' || key === 't') { e.preventDefault(); submitVerdict('tp'); }
      else if (key === '2' || key === 'f') { e.preventDefault(); submitVerdict('fp'); }
    } else if (answered && (key === 'enter' || key === 'n')) {
      const nextBtn = $('#nextBtn');
      if (nextBtn) { e.preventDefault(); nextBtn.click(); }
    }
  });

  /* Phish hunt (pointer + keyboard accessible) */
  const pTotal = Object.keys(phishFlags).length;
  let pFound = new Set();
  let pMiss = 0;

  const pUpdate = () => {
    $('#pFound').textContent = `${pFound.size}/${pTotal}`;
    $('#pMiss').textContent = pMiss;
    $('#pBar').style.width = pFound.size / pTotal * 100 + '%';
  };

  const pMark = (id, silent) => {
    if (pFound.has(id)) return;
    pFound.add(id);
    $$(`#mail .flag[data-id="${id}"]`).forEach(f => f.classList.add('found'));
    const list = $('#foundList');
    const empty = list.querySelector('.found-empty');
    if (empty) empty.remove();
    const li = document.createElement('li');
    li.innerHTML = `<b>🚩 ${escHtml(phishFlags[id][0])}</b>${escHtml(phishFlags[id][1])}`;
    list.appendChild(li);
    pUpdate();
    if (!silent) {
      audio.beep();
      if (pFound.size === pTotal) {
        audio.success();
        toast(pMiss === 0 ? '🎯 Perfect! All red flags, zero misclicks' : '✓ All 8 red flags found. Nice hunting!');
        confetti();
      }
    }
  };

  const handleFlagActivate = f => {
    if (f) {
      if (!pFound.has(f.dataset.id)) pMark(f.dataset.id);
    } else {
      pMiss++;
      pUpdate();
      audio.alert();
      toast('Looks legit. Keep hunting 🔍');
    }
  };

  $('#mail').addEventListener('click', e => handleFlagActivate(e.target.closest('.flag')));
  $('#mail').addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const f = e.target.closest('.flag');
    if (!f) return;
    e.preventDefault();
    e.stopPropagation();
    handleFlagActivate(f);
  });

  $('#pReveal').onclick = () => {
    audio.click();
    Object.keys(phishFlags).forEach(id => pMark(id, true));
  };
  $('#pReset').onclick = () => {
    audio.click();
    pFound = new Set();
    pMiss = 0;
    $$('#mail .flag').forEach(f => f.classList.remove('found'));
    $('#foundList').innerHTML = '<li class="found-empty">Nothing flagged yet. Start clicking!</li>';
    pUpdate();
  };

  /* Skills */
  const grid = $('#skillGrid');
  skills.forEach(([n, c, l, t]) => {
    const d = document.createElement('div');
    d.className = 'card skill lift reveal';
    d.dataset.cat = c;
    d.innerHTML = `<div class="skill-top"><h4>${escHtml(n)}</h4><span class="skill-cat">#${escHtml(c)}</span></div><div class="meter" data-l="${l}"><i></i><i></i><i></i><i></i><i></i></div><span class="lvl">${escHtml(t)}</span>`;
    grid.appendChild(d);
    io.observe(d);
  });

  $$('#filters button').forEach(b => b.onclick = () => {
    audio.click();
    $$('#filters button').forEach(x => x.classList.toggle('on', x === b));
    $$('#skillGrid .skill').forEach(s => s.classList.toggle('dim', b.dataset.f !== 'all' && s.dataset.cat !== b.dataset.f));
  });

  /* Flip cards */
  $$('.flip').forEach(f => {
    const t = () => {
      audio.click();
      f.classList.toggle('flipped');
    };
    f.onclick = t;
    f.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        t();
      }
    };
  });
})();
