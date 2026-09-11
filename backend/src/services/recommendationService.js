const Program = require("../models/Program");
const Student = require("../models/Student");
const HttpError = require("../utils/httpError");

const WEIGHTS = { country: 35, field: 30, budget: 20, intake: 10, ielts: 5 };

function matchStages(student) {
  const countries = student.targetCountries || [];
  const fields = (student.interestedFields || []).map((field) => field.toLowerCase());
  const budget = Number(student.maxBudgetUsd) || 0;
  const intake = student.preferredIntake || "";
  const ieltsScore = Number(student.englishTest?.score) || 0;
  return [
    { $addFields: { normalizedField: { $toLower: "$field" } } },
    {
      $addFields: {
        countryMatch: { $in: ["$country", countries] },
        fieldMatch: { $in: ["$normalizedField", fields] },
        budgetMatch: { $lte: ["$tuitionFeeUsd", budget] },
        intakeMatch: intake ? { $in: [intake, "$intakes"] } : false,
        ieltsMatch: { $lte: ["$minimumIelts", ieltsScore] },
      },
    },
    {
      $addFields: {
        matchScore: {
          $add: [
            { $cond: ["$countryMatch", WEIGHTS.country, 0] },
            { $cond: ["$fieldMatch", WEIGHTS.field, 0] },
            { $cond: ["$budgetMatch", WEIGHTS.budget, 0] },
            { $cond: ["$intakeMatch", WEIGHTS.intake, 0] },
            { $cond: ["$ieltsMatch", WEIGHTS.ielts, 0] },
          ],
        },
      },
    },
  ];
}

function recommendationReasons(program, preferredIntake) {
  return [
    program.countryMatch && `Preferred country: ${program.country}`,
    program.fieldMatch && `Field alignment: ${program.field}`,
    program.budgetMatch && "Within budget",
    program.intakeMatch && `Preferred intake: ${preferredIntake}`,
    program.ieltsMatch && "IELTS requirement met",
  ].filter(Boolean);
}

function serializeRecommendation(program, preferredIntake) {
  const { countryMatch, fieldMatch, budgetMatch, intakeMatch, ieltsMatch, normalizedField, ...data } = program;
  return { ...data, reasons: recommendationReasons(program, preferredIntake) };
}

async function buildProgramRecommendations(studentId) {
  const student = await Student.findById(studentId).lean();
  if (!student) throw new HttpError(404, "Student not found.");
  const recommendations = await Program.aggregate([
    ...matchStages(student),
    { $match: { matchScore: { $gt: 0 } } },
    { $sort: { matchScore: -1, scholarshipAvailable: -1, tuitionFeeUsd: 1, _id: 1 } },
    { $limit: 5 },
  ]);
  return {
    data: {
      student: { id: student._id, fullName: student.fullName, targetCountries: student.targetCountries, interestedFields: student.interestedFields },
      recommendations: recommendations.map((program) => serializeRecommendation(program, student.preferredIntake)),
    },
    meta: { scoring: WEIGHTS, count: recommendations.length },
  };
}

module.exports = { buildProgramRecommendations };
