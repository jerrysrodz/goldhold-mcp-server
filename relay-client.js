// relay-client.js -- GoldHold Relay API client

const RELAY_URL = process.env.GOLDHOLD_RELAY_URL || "https://relay.goldhold.ai";
const API_KEY = process.env.GOLDHOLD_API_KEY || "";

async function relay(method, path, body) {
  const url = `${RELAY_URL}${path}`;
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
  };
  if (body && method !== "GET") opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Relay ${method} ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function memorySearch(query, folder, limit = 10) {
  return relay("POST", "/v1/memory/search", { query, folder, limit });
}

export async function memoryWrite(folder, key, content) {
  return relay("POST", "/v1/memory/write", { folder, key, content });
}

export async function memoryRead(folder, key) {
  return relay("POST", "/v1/memory/read", { folder, key });
}

export async function memoryDelete(folder, key) {
  return relay("POST", "/v1/memory/delete", { folder, key });
}

export async function inbox(include_read = false, limit = 20) {
  return relay("POST", "/v1/inbox", { include_read, limit });
}

export async function send(to, subject, body) {
  return relay("POST", "/v1/send", { to, subject, body });
}

export async function searchMessages(query, limit = 10) {
  return relay("POST", "/v1/search", { query, limit });
}

export async function status() {
  return relay("GET", "/v1/status");
}
