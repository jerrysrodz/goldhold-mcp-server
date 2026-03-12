// relay-client.js -- GoldHold Relay API client

const RELAY_URL = process.env.GOLDHOLD_RELAY_URL || "https://relay.goldhold.ai";
const API_KEY = process.env.GOLDHOLD_API_KEY || "";

async function relayCall(method, path, body) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "GoldHold-MCP/1.1",
    },
  };
  if (body && method !== "GET") opts.body = JSON.stringify(body);
  const res = await fetch(`${RELAY_URL}${path}`, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Relay ${method} ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function memorySearch(query, folder, limit) {
  return relayCall("POST", "/v1/search", { query, namespace: folder, top_k: limit || 10 });
}

export async function store(subject, body, folder, type) {
  const payload = { to: "self", subject, body, type: type || "NOTE" };
  if (folder) payload.namespace = folder;
  return relayCall("POST", "/v1/send", payload);
}

export async function turn(search, storeItems, send, compact) {
  const payload = { compact: compact !== false };
  if (search) payload.search = search;
  if (storeItems) payload.store = storeItems;
  if (send) payload.send = send;
  return relayCall("POST", "/v1/turn", payload);
}

export async function resume(compact) {
  return relayCall("POST", "/v1/auto", { compact: compact !== false });
}

export async function batch(ops) {
  return relayCall("POST", "/v1/batch", { ops });
}

export async function close(sessionSummary, compact) {
  return relayCall("POST", "/v1/session/close", { session_summary: sessionSummary, compact: compact !== false });
}

export async function inbox(includeRead, limit) {
  return relayCall("POST", "/v1/inbox", { include_read: includeRead, limit: limit || 20 });
}

export async function send(to, subject, body) {
  return relayCall("POST", "/v1/send", { to, subject, body });
}

export async function status() {
  return relayCall("GET", "/v1/status");
}
