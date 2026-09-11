const Application = require("../models/Application");
const Program = require("../models/Program");
const { applicationStatuses, validStatusTransitions } = require("../config/constants");
const cacheService = require("../services/cacheService");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const { enumValue, objectId, string } = require("../utils/request");

function canAccess(application, user) { return user.role === "counselor" || application.student.toString() === user.id; }
async function clearDependentCaches() { await Promise.all([cacheService.delete("dashboard-overview"), cacheService.delete("popular-universities")]); }

const listApplications = asyncHandler(async (req, res) => {
  const filters = req.user.role === "student" ? { student: req.user._id } : {};
  if (req.query.studentId && req.user.role === "counselor") filters.student = objectId(req.query.studentId, "studentId");
  if (req.query.status) filters.status = enumValue(req.query.status, "status", applicationStatuses);
  const applications = await Application.find(filters).populate("student", "fullName email role").populate("program", "title degreeLevel tuitionFeeUsd").populate("university", "name country city").sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: applications });
});

const createApplication = asyncHandler(async (req, res) => {
  const programId = objectId(req.body.programId, "programId");
  const intake = string(req.body.intake, "intake", { required: true, max: 40 });
  const studentId = req.user.role === "counselor" && req.body.studentId ? objectId(req.body.studentId, "studentId") : req.user._id;
  const program = await Program.findById(programId).select("university country intakes").lean();
  if (!program) throw new HttpError(404, "Program not found.");
  if (!program.intakes.includes(intake)) throw new HttpError(400, "The selected intake is not available for this program.");
  try {
    const application = await Application.create({ student: studentId, program: program._id, university: program.university, destinationCountry: program.country, intake, status: "draft", timeline: [{ status: "draft", note: "Application created." }] });
    await clearDependentCaches();
    res.status(201).json({ success: true, data: application });
  } catch (error) {
    if (error?.code === 11000) throw new HttpError(409, "An application already exists for this program and intake.");
    throw error;
  }
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const application = await Application.findById(objectId(req.params.id, "applicationId"));
  if (!application) throw new HttpError(404, "Application not found.");
  if (!canAccess(application, req.user)) throw new HttpError(403, "You do not have access to this application.");
  const status = enumValue(req.body.status, "status", applicationStatuses, { required: true });
  if (!validStatusTransitions[application.status].includes(status)) throw new HttpError(409, `Cannot change status from ${application.status} to ${status}.`);
  const note = string(req.body.note, "note", { max: 500 }) || `Status changed to ${status}.`;
  application.status = status;
  application.timeline.push({ status, note, changedAt: new Date() });
  await application.save();
  await clearDependentCaches();
  res.json({ success: true, data: application });
});
module.exports = { createApplication, listApplications, updateApplicationStatus };
