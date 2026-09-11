const jwt = require("jsonwebtoken");

const env = require("../config/env");
const Student = require("../models/Student");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const { loginBody, parse, registerBody } = require("../validators/requestSchemas");

function serializeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    targetCountries: user.targetCountries,
    interestedFields: user.interestedFields,
    preferredIntake: user.preferredIntake,
    maxBudgetUsd: user.maxBudgetUsd,
    englishTest: user.englishTest,
    profileComplete: user.profileComplete,
  };
}

function createToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn, issuer: "waygood-api", audience: "waygood-client" }
  );
}

function authResponse(user) {
  return { user: serializeUser(user), token: createToken(user) };
}

const register = asyncHandler(async (req, res) => {
  const payload = parse(registerBody, req.body);
  const existingUser = await Student.exists({ email: payload.email });

  if (existingUser) {
    throw new HttpError(409, "An account with this email already exists.");
  }

  // Public registration never accepts a role; counselor accounts are provisioned internally.
  const user = await Student.create({
    ...payload,
    role: "student",
    englishTest: { exam: "IELTS", score: payload.englishTest?.score || 0 },
    profileComplete: payload.targetCountries.length > 0 && payload.interestedFields.length > 0,
  });

  res.status(201).json({ success: true, data: authResponse(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = parse(loginBody, req.body);
  const user = await Student.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    throw new HttpError(401, "Invalid email or password.");
  }

  res.json({ success: true, data: authResponse(user) });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: serializeUser(req.user) } });
});

module.exports = { login, me, register };
