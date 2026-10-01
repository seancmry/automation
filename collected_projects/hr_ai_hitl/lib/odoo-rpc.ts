/**
 * Low-level Odoo JSON-RPC helpers (server + seed scripts).
 */

export type OdooConfig = {
  url: string;
  db: string;
  username: string;
  password: string;
};

export function odooConfigFromEnv(): OdooConfig {
  const url = process.env.ODOO_URL;
  const db = process.env.ODOO_DB;
  const username = process.env.ODOO_USERNAME;
  const password = process.env.ODOO_PASSWORD;
  if (!url || !db || !username || !password) {
    throw new Error("ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD required");
  }
  return { url, db, username, password };
}

export async function jsonRpc(
  url: string,
  service: string,
  method: string,
  args: unknown[],
): Promise<unknown> {
  const res = await fetch(`${url.replace(/\/$/, "")}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
      id: Date.now(),
    }),
  });
  if (!res.ok) {
    throw new Error(`Odoo HTTP ${res.status}`);
  }
  const body = (await res.json()) as {
    result?: unknown;
    error?: { message?: string; data?: { message?: string } };
  };
  if (body.error) {
    throw new Error(body.error.data?.message || body.error.message || "Odoo JSON-RPC error");
  }
  return body.result;
}

export async function authenticate(cfg: OdooConfig): Promise<number> {
  const uid = (await jsonRpc(cfg.url, "common", "authenticate", [
    cfg.db,
    cfg.username,
    cfg.password,
    {},
  ])) as number | false;
  if (!uid) {
    throw new Error("Odoo authentication failed");
  }
  return uid;
}

export async function executeKw<T = unknown>(
  cfg: OdooConfig,
  uid: number,
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  return (await jsonRpc(cfg.url, "object", "execute_kw", [
    cfg.db,
    uid,
    cfg.password,
    model,
    method,
    args,
    kwargs,
  ])) as T;
}
