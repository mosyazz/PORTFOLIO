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
    ['Security Onion', 'siem', 3, 'production'],
    ['Elasticsearch', 'siem', 3, 'production'],
    ['Stellar Cyber', 'siem', 3, 'production'],
    ['RSA NetWitness', 'siem', 2, 'hands-on'],
    ['Wireshark', 'network', 3, 'proficient'],
    ['Suricata / Zeek', 'network', 2, 'hands-on'],
    ['Palo Alto', 'network', 2, 'production'],
    ['FortiWeb WAF', 'network', 2, 'production'],
    ['Sangfor Firewall', 'network', 2, 'production'],
    ['MikroTik RouterOS', 'network', 3, 'certified (MTCNA)'],
    ['Bitdefender EDR', 'endpoint', 2, 'production'],
    ['Trend Micro DSM', 'endpoint', 2, 'production'],
    ['Sysmon', 'endpoint', 2, 'hands-on'],
    ['Kali Linux', 'os', 3, 'intermediate'],
    ['Windows', 'os', 3, 'intermediate'],
    ['Python', 'code', 3, 'automation'],
    ['Java', 'code', 2, 'foundational'],
    ['C++', 'code', 2, 'foundational'],
    ['Solidity', 'code', 2, 'foundational'],
    ['Arduino IDE', 'code', 3, 'intermediate']
  ],
  pcapScenarios: [
    {
      id: 'dns-tunnel',
      name: 'DNS Tunneling & C2 Beaconing',
      category: 'Command and Control (T1071.004)',
      summary: 'High-entropy TXT lookups on newly registered domain exfiltrating base64-encoded system telemetry.',
      displayFilter: 'dns.flags.response == 0 and udp.port == 53',
      analystNotes: 'Note the anomalous subdomain length (48+ characters) and high query cadence to external nameserver. Standard recursive resolvers should never forward structured base64 chunks like this.',
      mitigation: 'Implement DNS sinkholing on internal resolver, block parent domain on perimeter firewall, isolate offending endpoint 10.10.40.12 for memory forensics.',
      packets: [
        {
          no: 1, time: '0.000000', src: '10.10.40.12', dst: '10.10.0.2', proto: 'DNS', len: 114,
          info: 'Standard query 0x1f4a TXT aW5pdF9iZWFjb25faWQ9OTkxOA.x7-cdn-sync.top',
          layers: [
            'Frame 1: 114 bytes on wire (912 bits)',
            'Ethernet II, Src: Micro-Star_4a:12:ef, Dst: Cisco_00:01:aa',
            'Internet Protocol Version 4, Src: 10.10.40.12, Dst: 10.10.0.2',
            'User Datagram Protocol, Src Port: 52194, Dst Port: 53',
            'Domain Name System (query)\n  Transaction ID: 0x1f4a\n  Queries: aW5pdF9iZWFjb25faWQ9OTkxOA.x7-cdn-sync.top: type TXT, class IN'
          ],
          hex: '0000  00 01 aa bb cc dd 00 1f  4a 12 ef 08 00 45 00 00  ........J....E..\n0010  64 3a 11 40 00 80 11 ea  0a 0a 28 0c 0a 0a 00 02  d:.@......(.....\n0020  cb e2 00 35 00 50 2a 3f  1f 4a 01 00 00 01 00 00  ...5.P*?.J......\n0030  1c 61 57 35 70 64 46 39  69 5a 57 46 6a 62 32 35  .aW5pdF9iZWZjYjI1\n0040  0b 78 37 2d 63 64 6e 2d  73 79 6e 63 03 74 6f 70  .x7-cdn-sync.top'
        },
        {
          no: 2, time: '0.041209', src: '10.10.0.2', dst: '10.10.40.12', proto: 'DNS', len: 146,
          info: 'Standard query response 0x1f4a TXT "cmd=whoami;whoami /priv;sleep 60"',
          layers: [
            'Frame 2: 146 bytes on wire (1168 bits)',
            'Internet Protocol Version 4, Src: 10.10.0.2, Dst: 10.10.40.12',
            'User Datagram Protocol, Src Port: 53, Dst Port: 52194',
            'Domain Name System (response)\n  Answers: aW5pd...: type TXT, class IN, "cmd=whoami;whoami /priv;sleep 60"'
          ],
          hex: '0000  00 1f 4a 12 ef 08 00 01  aa bb cc dd 08 00 45 00  ..J...........E.\n0010  84 1f 00 00 40 11 05 0a  0a 0a 00 02 0a 0a 28 0c  ....@.........(.\n0020  00 35 cb e2 00 70 81 80  1f 4a 81 80 00 01 00 01  .5...p...J......\n0030  25 63 6d 64 3d 77 68 6f  61 6d 69 3b 73 6c 65 65  %cmd=whoami;slee\n0040  70 20 36 30 00 00 00 00                           p 60....'
        },
        {
          no: 3, time: '0.982140', src: '10.10.40.12', dst: '10.10.0.2', proto: 'DNS', len: 132,
          info: 'Standard query 0x1f4b TXT bWFjX2FkZHI9MDBmZGE0MTJlZg.x7-cdn-sync.top',
          layers: [
            'Frame 3: 132 bytes on wire (1056 bits)',
            'User Datagram Protocol, Src Port: 52194, Dst Port: 53',
            'Domain Name System (query)\n  Queries: bWFjX2FkZHI9MDBmZGE0MTJlZg.x7-cdn-sync.top: type TXT, class IN'
          ],
          hex: '0000  00 01 aa bb cc dd 00 1f  4a 12 ef 08 00 45 00 00  ........J....E..\n0010  76 3b 11 40 00 80 11 e8  0a 0a 28 0c 0a 0a 00 02  v;.@......(.....\n0020  cb e2 00 35 00 62 11 aa  1f 4b 01 00 00 01 00 00  ...5.b...K......\n0030  1b 62 57 46 6a 58 32 46  6b 5a 48 49 39 4d 44 42  .bWFjX2FkZHI9MDB\n0040  0b 78 37 2d 63 64 6e 2d  73 79 6e 63 03 74 6f 70  .x7-cdn-sync.top'
        }
      ]
    },
    {
      id: 'syn-scan',
      name: 'TCP Stealth Half-Open Port Scan',
      category: 'Reconnaissance (T1046)',
      summary: 'Adversary probes sequential high-profile ports with TCP SYN packets, tearing down before completion.',
      displayFilter: 'tcp.flags.syn == 1 and tcp.flags.ack == 0',
      analystNotes: 'Classic nmap -sS stealth scan pattern. Notice the source host rotates destination ports (21, 22, 23, 80, 443) rapidly with incrementing identification numbers and fixed TCP window sizes (1024).',
      mitigation: 'Trigger dynamic firewall rate-limiting on Palo Alto/Sangfor, drop ingress from source IP 194.26.29.112, alert SOC team on reconnaissance spike.',
      packets: [
        {
          no: 1, time: '0.000100', src: '194.26.29.112', dst: '10.10.10.5', proto: 'TCP', len: 58,
          info: '49281 → 21 [SYN] Seq=0 Win=1024 Len=0 MSS=1460',
          layers: [
            'Frame 1: 58 bytes on wire (464 bits)',
            'Internet Protocol Version 4, Src: 194.26.29.112, Dst: 10.10.10.5',
            'Transmission Control Protocol, Src Port: 49281, Dst Port: 21 (FTP), Flags: [SYN], Win: 1024'
          ],
          hex: '0000  00 50 56 c0 00 08 00 0c  29 11 22 33 08 00 45 00  .PV.....).\"3..E.\n0010  00 2c a1 01 00 00 34 06  b2 10 c2 1a 1d 70 0a 0a  .,....4......p..\n0020  0a 05 c0 81 00 15 39 12  00 00 00 00 00 00 60 02  ......9.......`.\n0030  04 00 a1 b2 00 00 02 04  05 b4                    ........'
        },
        {
          no: 2, time: '0.001420', src: '194.26.29.112', dst: '10.10.10.5', proto: 'TCP', len: 58,
          info: '49282 → 22 [SYN] Seq=0 Win=1024 Len=0 MSS=1460',
          layers: [
            'Transmission Control Protocol, Src Port: 49282, Dst Port: 22 (SSH), Flags: [SYN], Win: 1024'
          ],
          hex: '0000  00 50 56 c0 00 08 00 0c  29 11 22 33 08 00 45 00  .PV.....).\"3..E.\n0010  00 2c a1 02 00 00 34 06  b2 0f c2 1a 1d 70 0a 0a  .,....4......p..\n0020  0a 05 c0 82 00 16 39 13  00 00 00 00 00 00 60 02  ......9.......`.\n0030  04 00 a1 b3 00 00 02 04  05 b4                    ........'
        },
        {
          no: 3, time: '0.002810', src: '194.26.29.112', dst: '10.10.10.5', proto: 'TCP', len: 58,
          info: '49283 → 443 [SYN] Seq=0 Win=1024 Len=0 MSS=1460',
          layers: [
            'Transmission Control Protocol, Src Port: 49283, Dst Port: 443 (HTTPS), Flags: [SYN], Win: 1024'
          ],
          hex: '0000  00 50 56 c0 00 08 00 0c  29 11 22 33 08 00 45 00  .PV.....).\"3..E.\n0010  00 2c a1 03 00 00 34 06  b2 0e c2 1a 1d 70 0a 0a  .,....4......p..\n0020  0a 05 c0 83 01 bb 39 14  00 00 00 00 00 00 60 02  ......9.......`.\n0030  04 00 a1 b4 00 00 02 04  05 b4                    ........'
        }
      ]
    },
    {
      id: 'cleartext-http',
      name: 'Unencrypted Credential Sniffing',
      category: 'Credential Access (T1552.001)',
      summary: 'Authentication transaction transmitted over unencrypted HTTP exposing plaintext credentials in wire data.',
      displayFilter: 'http.request.method == "POST"',
      analystNotes: 'Critical security hygiene violation. The web form submitted cleartext credentials directly across the network layer over TCP port 80 with no TLS encapsulation.',
      mitigation: 'Enforce HTTPS via HSTS preload, block port 80 login submissions on FortiWeb WAF, rotate compromised user password immediately.',
      packets: [
        {
          no: 1, time: '0.000000', src: '192.168.1.55', dst: '192.168.1.10', proto: 'HTTP', len: 342,
          info: 'POST /api/v1/auth/login HTTP/1.1 (application/x-www-form-urlencoded)',
          layers: [
            'Hypertext Transfer Protocol\n  POST /api/v1/auth/login HTTP/1.1\\r\\n\n  Host: portal.internal-corp.local\\r\\n\n  Content-Type: application/x-www-form-urlencoded\\r\\n',
            'HTML Form URL Encoded: application/x-www-form-urlencoded\n  user: syazwan.adm\n  pass: Winter2026!SecurityP@ss'
          ],
          hex: '0000  50 4f 53 54 20 2f 61 70  69 2f 76 31 2f 61 75 74  POST /api/v1/aut\n0010  68 2f 6c 6f 67 69 6e 20  48 54 54 50 2f 31 2e 31  h/login HTTP/1.1\n0020  0d 0a 48 6f 73 74 3a 20  70 6f 72 74 61 6c 2e 69  ..Host: portal.i\n0030  75 73 65 72 3d 73 79 61  7a 77 61 6e 2e 61 64 6d  user=syazwan.adm\n0040  26 70 61 73 73 3d 57 69  6e 74 65 72 32 30 32 36  &pass=Winter2026'
        }
      ]
    }
  ],
  incidentCase: {
    id: 'INC-2026-0881',
    name: 'Operation DarkViper: Advanced Endpoint Intrusion',
    targetAsset: 'Finance Subnet (WKSTN-FIN-04) ➔ Domain Controller (DC-01)',
    threatActor: 'Simulated APT29 Profile',
    status: 'ACTIVE_INCIDENT',
    nodes: [
      {
        id: 'n1',
        title: 'Initial Phishing Ingress',
        tactic: 'Initial Access (T1566.001)',
        host: 'WKSTN-FIN-04 (10.10.20.45)',
        artifact: 'Invoice_Q3.pdf.exe',
        desc: 'Employee opened double-extension invoice attachment received via external look-alike domain.',
        containedBy: 'isolate',
        status: 'compromised'
      },
      {
        id: 'n2',
        title: 'Hidden PowerShell Stager',
        tactic: 'Execution (T1059.001)',
        host: 'WKSTN-FIN-04 (PID 4812)',
        artifact: 'powershell.exe -w hidden -enc JABj...',
        desc: 'Base64 encoded payload executed in memory, spawned rundll32.exe and scheduled persistence task.',
        containedBy: 'isolate',
        status: 'compromised'
      },
      {
        id: 'n3',
        title: 'LSASS Memory Injection',
        tactic: 'Credential Access (T1003.001)',
        host: 'WKSTN-FIN-04 (Sysmon EID 10)',
        artifact: 'Target: lsass.exe / GrantedAccess: 0x1010',
        desc: 'Mimikatz memory dump accessed plain-text domain credentials for DA account "adm_khairul".',
        containedBy: 'revoke',
        status: 'compromised'
      },
      {
        id: 'n4',
        title: 'C2 Beacon & DC Lateral Probe',
        tactic: 'Lateral Movement (T1021.002)',
        host: 'Outbound to 185.220.101.4:443',
        artifact: 'SMB / IPC$ connection attempt to DC-01',
        desc: 'Compromised workstation initiated encrypted beacon and probed port 445 on Primary Domain Controller.',
        containedBy: 'block-c2',
        status: 'compromised'
      }
    ],
    actions: [
      {
        id: 'isolate',
        label: '1. Isolate Endpoint via EDR API',
        desc: 'Sever network connectivity for WKSTN-FIN-04 while keeping EDR live telemetry open.',
        targetNodes: ['n1', 'n2']
      },
      {
        id: 'revoke',
        label: '2. Revoke Kerberos TGT & Reset DA',
        desc: 'Invalidate hijacked authentication tokens across Active Directory forest.',
        targetNodes: ['n3']
      },
      {
        id: 'block-c2',
        label: '3. Push Perimeter Firewall Drop Rule',
        desc: 'Null-route 185.220.101.4 across Palo Alto & Sangfor edge clusters.',
        targetNodes: ['n4']
      }
    ]
  }
};
