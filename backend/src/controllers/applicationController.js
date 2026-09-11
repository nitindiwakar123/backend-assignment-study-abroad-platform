const { validStatusTransitions } = require("../config/constants");
const Application = require("../models/Application");
const Program = require("../models/Program");
const cacheService = require("../services/cacheService");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const { applicationsQuery, createApplicationBody, parse, updateApplicationStatusBody } = require("../validators/requestSchemas");

async function invalidateSummaryCaches() {
  await Promise.all([cacheService.delete("dashboard-overview"), cacheService.delete("popular-universities")]);
}

function isOwner(application, user) {
  return user.role === "counselor" || application.student.toString() === user.id;
}

const listApplications = asyncHandler(async (req, res) => {
  const query = parse(applicationsQuery, req.query);
  const filters = req.user.role === "student" ? { student: req.user._id } : {};
  if (req.user.role === "counselor" && query.studentId) filters.student = query.studentId;
  if (query.status) filters.status = query.status;
  const applications = await Application.find(filters)
    .populate("student", "fullName email role")
    .populate("program", "title degreeLevel tuitionFeeUsd")
    .populate("university", "name country city")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: applications });
});

const createApplication = asyncHandler(async (req, res) => {
  const payload = parse(createApplicationBody, req.body);
  const student = req.user.role === "counselor" && payload.studentId ? payload.studentId : req.user._id;
  const program = await Program.findById(payload.programId).select("university country intakes").lean();
  if (!program) throw new HttpError(404, "Program not found.");
  if (!program.intakes.includes(payload.intake)) throw new HttpError(400, "The selected intake is not available for this program.");
  try {
    const application = await Application.create({ student, program: program._id, university: program.university, destinationCountry: program.country, intake: payload.intake, status: "draft", timeline: [{ status: "draft", note: "Application created." }] });
    await invalidateSummaryCaches();
    res.status(201).json({ success: true, data: application });
  } catch (error) {
    if (error.code === 11000) throw new HttpError(409, "An application already exists for this program and intake.");
    throw error;
  }
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const applicationId = parse(objectId, req.params.id);
  const payload = parse(updateApplicationStatusBody, req.body);
  const application = await Application.findById(applicationId);
  if (!application) throw new HttpError(404, "Application not found.");
  if (!isOwner(application, req.user)) throw new HttpError(403, "You do not have access to this application.");
  if (!validStatusTransitions[application.status].includes(payload.status)) {
    throw new HttpError(409, `Cannot change status from ${application.status} to ${payload.status}.`);
  }
  application.status = payload.status;
  application.timeline.push({ status: payload.status, note: payload.note || `Status changed to ${payload.status}.`, changedAt: new Date() });
  await application.save();
  await invalidateSummaryCaches();
  res.json({ success: true, data: application });
});

module.exports = { createApplication, listApplications, updateApplicationStatus };
