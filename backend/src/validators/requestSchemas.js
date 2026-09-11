const { z } = require("zod");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Must be a valid MongoDB ObjectId.");
const optionalBoolean = z
  .enum(["true", "false"])
  .optional()
  .transform((value) => value === undefined ? undefined : value === "true");
const pagination = {
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
};
const trimmedText = (max) => z.string().trim().min(1).max(max);

const registerBody = z.object({
  fullName: trimmedText(100),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/),
  targetCountries: z.array(trimmedText(80)).max(10).default([]),
  interestedFields: z.array(trimmedText(80)).max(10).default([]),
  preferredIntake: trimmedText(40).optional(),
  maxBudgetUsd: z.coerce.number().finite().min(0).max(1000000).optional(),
  englishTest: z.object({ score: z.coerce.number().min(0).max(9) }).strict().optional(),
}).strict();

const loginBody = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
}).strict();

const programQuery = z.object({
  country: trimmedText(80).optional(), degreeLevel: z.enum(["bachelor", "master", "diploma", "certificate"]).optional(),
  intake: trimmedText(40).optional(), field: trimmedText(80).optional(), q: trimmedText(80).optional(),
  maxTuition: z.coerce.number().finite().min(0).max(1000000).optional(), scholarshipAvailable: optionalBoolean,
  sortBy: z.enum(["tuitionAsc", "tuitionDesc", "relevance"]).default("relevance"), ...pagination,
}).strict();

const universityQuery = z.object({
  country: trimmedText(80).optional(), partnerType: z.enum(["direct", "recruitment-partner", "institution-partner"]).optional(),
  q: trimmedText(80).optional(), scholarshipAvailable: optionalBoolean,
  sortBy: z.enum(["name", "ranking", "popular"]).default("popular"), ...pagination,
}).strict();

const createApplicationBody = z.object({ programId: objectId, intake: trimmedText(40), studentId: objectId.optional() }).strict();
const updateApplicationStatusBody = z.object({ status: z.enum(["draft", "submitted", "under-review", "offer-received", "visa-processing", "enrolled", "rejected"]), note: z.string().trim().max(500).optional() }).strict();
const applicationsQuery = z.object({ studentId: objectId.optional(), status: z.enum(["draft", "submitted", "under-review", "offer-received", "visa-processing", "enrolled", "rejected"]).optional() }).strict();

function parse(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const details = result.error.issues.map((issue) => ({ field: issue.path.join(".") || "request", message: issue.message }));
  const error = new Error("Request validation failed.");
  error.statusCode = 400;
  error.details = details;
  throw error;
}

function escapedRegex(value) { return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); }

module.exports = { applicationsQuery, createApplicationBody, escapedRegex, loginBody, objectId, parse, programQuery, registerBody, universityQuery, updateApplicationStatusBody };
