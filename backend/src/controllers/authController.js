const asyncHandler = require("../utils/asyncHandler");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const env = require("../config/env");
const HttpError = require("../utils/httpError");
const { enumValue, positiveNumber, string } = require("../utils/request");

function userPayload(user) { return { id: user._id, fullName: user.fullName, email: user.email, role: user.role, targetCountries: user.targetCountries, interestedFields: user.interestedFields, preferredIntake: user.preferredIntake, maxBudgetUsd: user.maxBudgetUsd, englishTest: user.englishTest, profileComplete: user.profileComplete }; }
function tokenFor(user) { return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn, issuer: "waygood-api", audience: "waygood-client" }); }

const register = asyncHandler(async (req, res) => {
  const fullName = string(req.body.fullName, "fullName", { required: true, max: 100 });
  const email = string(req.body.email, "email", { required: true, max: 254 }).toLowerCase();
  const password = string(req.body.password, "password", { required: true, max: 128 });
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, "email is invalid.");
  if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new HttpError(400, "password must be at least 12 characters and include upper-case, lower-case, and a number.");
  }
  if (await Student.exists({ email })) throw new HttpError(409, "An account with this email already exists.");
  const targetCountries = Array.isArray(req.body.targetCountries) ? req.body.targetCountries.map((v) => string(v, "targetCountries item", { max: 80 })) : [];
  const interestedFields = Array.isArray(req.body.interestedFields) ? req.body.interestedFields.map((v) => string(v, "interestedFields item", { max: 80 })) : [];
  const user = await Student.create({ fullName, email, password, role: "student", targetCountries, interestedFields, preferredIntake: string(req.body.preferredIntake, "preferredIntake", { max: 40 }), maxBudgetUsd: positiveNumber(req.body.maxBudgetUsd, "maxBudgetUsd", { min: 0 }), englishTest: { exam: "IELTS", score: positiveNumber(req.body.englishTest?.score, "englishTest.score", { min: 0, max: 9 }) || 0 }, profileComplete: Boolean(targetCountries.length && interestedFields.length) });
  res.status(201).json({ success: true, data: { user: userPayload(user), token: tokenFor(user) } });
});

const login = asyncHandler(async (req, res) => {
  const email = string(req.body.email, "email", { required: true, max: 254 }).toLowerCase();
  const password = string(req.body.password, "password", { required: true, max: 128 });
  const user = await Student.findOne({ email });
  if (!user || !(await user.comparePassword(password))) throw new HttpError(401, "Invalid email or password.");
  res.json({ success: true, data: { user: userPayload(user), token: tokenFor(user) } });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: userPayload(req.user) } });
});

module.exports = {
  register,
  login,
  me,
};
