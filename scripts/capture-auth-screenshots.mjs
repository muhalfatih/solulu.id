import { spawn } from 'node:child_process';
import fs from 'node:fs';

const chromeProc = spawn('/home/muhalfatih/.local/bin/google-chrome', [
  '--headless',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--window-size=1280,900',
  '--no-sandbox',
  'about:blank'
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  await sleep(1500);
  const versionRes = await fetch('http://127.0.0.1:9222/json/version');
  const versionData = await versionRes.json();
  const wsUrl = versionData.webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise(resolve => ws.onopen = resolve);

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  // Create target page
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const attachRes = await send('Target.attachToTarget', { targetId, flatten: true });
  const sessionId = attachRes.sessionId;

  function sendSession(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, sessionId, method, params }));
    });
  }

  await sendSession('Page.enable');
  await sendSession('Network.enable');

  const targets = [
    {
      role: 'operator',
      url: 'http://localhost:3000/operator',
      output: 'alur-booking-dan-jobdesk/screenshots/08-operator-console.png'
    },
    {
      role: 'admin',
      url: 'http://localhost:3000/admin',
      output: 'alur-booking-dan-jobdesk/screenshots/09-admin-dashboard.png'
    },
    {
      role: 'counselor',
      url: 'http://localhost:3000/counselor',
      output: 'alur-booking-dan-jobdesk/screenshots/10-counselor-dashboard.png'
    }
  ];

  for (const t of targets) {
    console.log(`Setting cookie for role: ${t.role}`);
    await sendSession('Network.setCookie', {
      name: 'solulu_demo_role',
      value: t.role,
      domain: 'localhost',
      path: '/'
    });

    console.log(`Navigating to ${t.url}`);
    await sendSession('Page.navigate', { url: t.url });
    await sleep(3000); // Allow turbopack compile and render

    console.log(`Capturing screenshot -> ${t.output}`);
    const screenshot = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(t.output, Buffer.from(screenshot.data, 'base64'));
    console.log(`Saved: ${t.output}`);
  }

  ws.close();
  chromeProc.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err);
  chromeProc.kill();
  process.exit(1);
});
