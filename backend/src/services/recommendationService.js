const Program = require("../models/Program");
const Student = require("../models/Student");
const HttpError = require("../utils/httpError");

// The catalogue is scored and limited in MongoDB to avoid loading candidates into Node.
async function buildProgramRecommendations(studentId) {
  const student = await Student.findById(studentId).lean();
  if (!student) throw new HttpError(404, "Student not found.");
  const countries = student.targetCountries || [];
  const fields = (student.interestedFields || []).map((field) => field.toLowerCase());
  const intake = student.preferredIntake || "";
  const budget = Number(student.maxBudgetUsd) || 0;
  const score = Number(student.englishTest?.score) || 0;
  const recommendations = await Program.aggregate([
    { $addFields: { fieldLower: { $toLower: "$field" } } },
    { $addFields: { countryMatch: { $in: ["$country", countries] }, fieldMatch: { $in: ["$fieldLower", fields] }, budgetMatch: { $lte: ["$tuitionFeeUsd", budget] }, intakeMatch: intake ? { $in: [intake, "$intakes"] } : false, ieltsMatch: { $lte: ["$minimumIelts", score] } } },
    { $addFields: { matchScore: { $add: [{ $cond: ["$countryMatch", 35, 0] }, { $cond: ["$fieldMatch", 30, 0] }, { $cond: ["$budgetMatch", 20, 0] }, { $cond: ["$intakeMatch", 10, 0] }, { $cond: ["$ieltsMatch", 5, 0] }] } } },
    { $match: { matchScore: { $gt: 0 } } }, { $sort: { matchScore: -1, scholarshipAvailable: -1, tuitionFeeUsd: 1, _id: 1 } }, { $limit: 5 },
  ]);
  return { data: { student: { id: student._id, fullName: student.fullName, targetCountries: countries, interestedFields: student.interestedFields }, recommendations: recommendations.map((program) => {
    const { countryMatch, fieldMatch, budgetMatch, intakeMatch, ieltsMatch, fieldLower, ...data } = program;
    return { ...data, reasons: [countryMatch && `Preferred country: ${program.country}`, fieldMatch && `Field alignment: ${program.field}`, budgetMatch && "Within budget", intakeMatch && `Preferred intake: ${intake}`, ieltsMatch && "IELTS requirement met"].filter(Boolean) };
  }) }, meta: { scoring: { country: 35, field: 30, budget: 20, intake: 10, ielts: 5 }, count: recommendations.length } };
}
module.exports = { buildProgramRecommendations };
