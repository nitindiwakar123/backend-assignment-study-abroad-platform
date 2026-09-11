const net = require("net");
const { URL } = require("url");
const env = require("../config/env");

/**
 * Redis is the shared cache when REDIS_URL is configured. The small TTL memory
 * fallback keeps local development usable without silently making Redis a hard
 * runtime dependency. Cache entries are advisory, never authorization data.
 */
class CacheService {
  constructor() { this.memory = new Map(); }
  async command(parts) {
    if (!env.redisUrl) return null;
    const url = new URL(env.redisUrl);
    const payload = `*${parts.length}\r\n${parts.map((part) => `$${Buffer.byteLength(String(part))}\r\n${part}\r\n`).join("")}`;
    return new Promise((resolve) => {
      const socket = net.createConnection({ host: url.hostname, port: Number(url.port || 6379) });
      let response = "";
      const finish = () => { socket.destroy(); resolve(null); };
      socket.setTimeout(500, finish);
      socket.on("connect", () => socket.write(payload));
      socket.on("data", (chunk) => { response += chunk; if (response.endsWith("\r\n")) { socket.end(); resolve(response); } });
      socket.on("error", finish);
    });
  }
  async get(key) {
    const response = await this.command(["GET", key]);
    if (response?.startsWith("$")) {
      const value = response.slice(response.indexOf("\r\n") + 2, -2);
      try { return JSON.parse(value); } catch { return null; }
    }
    const record = this.memory.get(key);
    if (!record || record.expiresAt <= Date.now()) { this.memory.delete(key); return null; }
    return record.value;
  }
  async set(key, value, ttlSeconds = env.cacheTtlSeconds) {
    const serialised = JSON.stringify(value);
    await this.command(["SET", key, serialised, "EX", Math.max(1, ttlSeconds)]);
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
  async delete(key) { await this.command(["DEL", key]); this.memory.delete(key); }
}
module.exports = new CacheService();
