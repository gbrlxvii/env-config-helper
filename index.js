'use strict';

function getEnvVar(key, fallback) {
  return process.env[key] !== undefined ? process.env[key] : fallback;
}

function requireEnvVar(key) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
  return process.env[key];
}

function parseEnvFile(content) {
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    result[key] = val;
  }
  return result;
}

module.exports = { getEnvVar, requireEnvVar, parseEnvFile };
