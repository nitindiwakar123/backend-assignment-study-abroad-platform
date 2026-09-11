const HttpError = require("../utils/httpError");

// A bounded in-process limiter protects a single instance; deploy behind a shared
// gateway limiter for horizontally scaled production deployments.
function rateLimit({ windowMs = 15 * 60 * 1000, max = 100 } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const record = hits.get(key);
    if (!record || record.resetAt <= now) hits.set(key, { count: 1, resetAt: now + windowMs });
    else record.count += 1;
    const current = hits.get(key);
    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(Math.max(0, max - current.count)));
    if (current.count > max) return next(new HttpError(429, "Too many requests. Please try again later."));
    next();
  };
}
module.exports = rateLimit;
