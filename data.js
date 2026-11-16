window.PORTFOLIO_DATA = {
  bootLines: [
    ['dim', 'SOC-OS v2.5 :: initializing analyst workstation...'],
    ['ok', '[  OK  ] Loading SIEM connectors (Stellar Cyber, RSA NetWitness)'],
    ['ok', '[  OK  ] Syncing endpoint agents (Bitdefender, Trend Micro DSM)'],
    ['ok', '[  OK  ] Applying firewall policies (Palo Alto, Sangfor, Huawei)'],
    ['ok', '[  OK  ] Arming FortiWeb WAF rules'],
    ['ok', '[  OK  ] Verifying certs: CompTIA Security+ ✓  MTCNA ✓'],
    ['dim', '> Analyst online: Syazwan Shukri. Welcome.']
  ],
  roles: [
    'SOC Analyst @ BitRanger',
    'Threat Hunter',
    'Incident Responder',
    'CompTIA Security+ Certified',
    'Network Defender'
  ],
  workflowSteps: [
    ['Monitor', 'Keep watch on the SIEM, EDR and WAF dashboards for new alerts and unusual patterns, such as login spikes, odd outbound traffic or malware detections.', 'Stellar Cyber · RSA NetWitness · FortiWeb'],
    ['Triage', 'Check severity and context. Is the asset critical? Is the source known-good? Rule out false positives fast so real threats get attention first.', 'Alert context · asset inventory'],
    ['Investigate', 'Correlate logs across sources, pivot on IPs, hashes and domains, and check IOCs against threat intelligence to understand scope and impact.', 'Log analysis · threat intel · Wireshark'],
    ['Contain', 'Stop the spread: block malicious IPs on the firewall or WAF, and flag affected endpoints for isolation or cleanup.', 'Palo Alto · Sangfor · Huawei · Bitdefender'],
    ['Report', 'Document the timeline, findings and actions taken, then escalate to L2 or notify the client with clear recommendations.', 'Incident tickets · escalation']
  ],
  triageAlerts: [
    { sev: 'high', src: 'SIEM · auth logs', title: 'Brute-force then successful login', log: '52 failed logins for user "admin" from 185.220.101.4 in 2 minutes\n→ 1 successful login from the same IP\n→ geo: unexpected foreign country', tp: true, why: 'Many failures followed by a success from an unfamiliar foreign IP is a classic brute-force compromise. Block the IP, reset the credentials and review the session.' },
    { sev: 'low', src: 'Firewall · outbound', title: 'Large download from update server', log: 'Host WS-0231 → download.windowsupdate.com\n1.2 GB over HTTPS during the patch window\nprocess: svchost.exe (wuauserv)', tp: false, why: 'This is legitimate Windows Update traffic from the expected service during the scheduled patch window. Benign.' },
    { sev: 'high', src: 'EDR · process tree', title: 'Office spawning encoded PowerShell', log: 'WINWORD.EXE\n └─ powershell.exe -nop -w hidden -enc JABjAGwAaQBlAG4AdAA...\n    └─ outbound connection to 45.9.148.x:443', tp: true, why: 'Word should never launch hidden, encoded PowerShell. This is a typical malicious macro dropper. Isolate the endpoint and hunt for the IOC.' },
    { sev: 'med', src: 'WAF · FortiWeb', title: 'SQL injection pattern on login page', log: "POST /login.php\nusername=admin' OR 1=1-- &password=x\nsrc: 103.x.x.x · 40 similar requests / min", tp: true, why: "A repeated `' OR 1=1--` payload is an active SQL injection attempt. Block the source IP at the WAF and confirm the app isn't vulnerable." },
    { sev: 'med', src: 'IDS · internal', title: 'Port scan from internal host', log: '10.10.5.20 scanning 10.10.0.0/16 on ports 1-1024\nhost tag: "NESSUS-SCANNER" · change ticket CHG-1182 approved\ntime: within scheduled scan window', tp: false, why: 'The source is the approved vulnerability scanner, running under an approved change ticket in its window. Expected activity, so mark it a false positive and consider tuning the rule.' },
    { sev: 'high', src: 'EDR · file activity', title: 'Mass file renames + known bad hash', log: 'FS-02: 3,400 files renamed to *.locked in 90s\nfile hash matches ransomware IOC feed\nREADME_DECRYPT.txt created in shares', tp: true, why: 'Mass encryption, a matching IOC hash and a ransom note: this is active ransomware. Isolate immediately and escalate as a critical incident.' },
    { sev: 'low', src: 'VPN · auth', title: 'Login during office hours via VPN', log: 'user: aisyah.r · MFA passed\nsrc: Kuala Lumpur, MY (usual location)\ntime: Tue 09:12 · device: corporate laptop', tp: false, why: 'Normal location, normal time, a corporate device and MFA passed. Nothing suspicious here.' },
    { sev: 'med', src: 'DNS logs', title: 'High-volume random subdomains', log: 'HR-PC-07 queried 2,100 unique subdomains in 10 min\ne.g. a9f3k2...q8.x7-cdn-sync.top\nlong, random-looking labels · new domain (3 days old)', tp: true, why: 'Many long random subdomains on a newly registered domain points to DNS tunneling or C2 beaconing. Block the domain and investigate the host.' }
  ],
  mitreMap: {
    'Brute-force then successful login': [['T1110', 'Brute Force'], ['T1078', 'Valid Accounts']],
    'Office spawning encoded PowerShell': [['T1566.001', 'Spearphishing Attachment'], ['T1059.001', 'PowerShell'], ['T1027', 'Obfuscated Files']],
    'SQL injection pattern on login page': [['T1190', 'Exploit Public-Facing Application']],
    'Mass file renames + known bad hash': [['T1486', 'Data Encrypted for Impact']],
    'High-volume random subdomains': [['T1071.004', 'Application Layer Protocol: DNS'], ['T1568', 'Dynamic Resolution']]
  },
  phishFlags: {
    from: ['Look-alike sender domain', '"acme-c0rp-support.com" swaps the "o" for a zero, and it isn\'t the company\'s real domain (acmecorp.com).'],
    reply: ['Reply-To mismatch', 'Replies go to a free Gmail address, not to the company. Attackers do this to receive your answers.'],
    greet: ['Generic greeting', '"Dear Valued Employee": your real IT team knows your name.'],
    urgent: ['Urgency and threats', 'A 2-hour deadline and "files deleted" are pressure tactics to make you act before you think.'],
    cred: ['Asks for your password', 'Legitimate IT will never ask you to confirm your current password through an email link.'],
    link: ['Malicious link', 'The button really goes to acme-login.verify-session.xyz, not the company portal. Always hover before you click.'],
    attach: ['Dangerous attachment', '"Password_Policy.pdf.exe" uses a double extension. It\'s an executable pretending to be a PDF.'],
    typo: ['Spelling mistakes', '"immediatly" and "pasword". Sloppy writing is a classic sign of phishing.']
  },
  skills: [
    ['Stellar Cyber', 'siem', 2, 'basic'], ['RSA NetWitness', 'siem', 2, 'basic'], ['Wireshark', 'network', 2, 'basic'],
    ['Bitdefender', 'endpoint', 2, 'basic'], ['Trend Micro DSM', 'endpoint', 2, 'basic'],
    ['Palo Alto', 'network', 2, 'basic'], ['FortiWeb WAF', 'network', 2, 'basic'], ['Sangfor Firewall', 'network', 2, 'basic'], ['MikroTik RouterOS', 'network', 3, 'certified (MTCNA)'],
    ['Kali Linux', 'os', 3, 'intermediate'], ['Windows', 'os', 3, 'intermediate'],
    ['Python', 'code', 2, 'basic'], ['Java', 'code', 2, 'basic'], ['C++', 'code', 2, 'basic'], ['Solidity', 'code', 2, 'basic'], ['Arduino IDE', 'code', 3, 'intermediate']
  ]
};
