const Program = require("../models/Program");
const asyncHandler = require("../utils/asyncHandler");
const { boolean, enumValue, escapedRegex, page, positiveNumber, string } = require("../utils/request");

const listPrograms = asyncHandler(async (req, res) => {
  const {
    country,
    degreeLevel,
    intake,
    field,
    q,
    maxTuition,
    scholarshipAvailable,
    sortBy = "relevance",
    page: pageQuery = 1,
    limit = 10,
  } = req.query;

  const filters = {};

  if (country) filters.country = string(country, "country", { max: 80 });

  if (degreeLevel) {
    filters.degreeLevel = enumValue(degreeLevel, "degreeLevel", ["bachelor", "master", "diploma", "certificate"]);
  }

  if (field) {
    filters.field = string(field, "field", { max: 80 });
  }

  if (intake) {
    filters.intakes = string(intake, "intake", { max: 40 });
  }

  if (maxTuition) {
    filters.tuitionFeeUsd = { $lte: positiveNumber(maxTuition, "maxTuition", { min: 0, max: 1000000 }) };
  }

  const scholarshipFlag = boolean(scholarshipAvailable, "scholarshipAvailable");
  if (typeof scholarshipFlag === "boolean") {
    filters.scholarshipAvailable = scholarshipFlag;
  }

  if (q) {
    filters.$or = [
      { title: escapedRegex(string(q, "q", { max: 80 })) }, { universityName: escapedRegex(q) }, { field: escapedRegex(q) },
    ];
  }

  const { page: pageNumber, limit: pageSize } = page({ page: pageQuery, limit });

  const sortMap = {
    tuitionAsc: { tuitionFeeUsd: 1 },
    tuitionDesc: { tuitionFeeUsd: -1 },
    relevance: { scholarshipAvailable: -1, tuitionFeeUsd: 1 },
  };

  const [items, total] = await Promise.all([
    Program.find(filters)
      .sort(sortMap[sortBy] || sortMap.relevance)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Program.countDocuments(filters),
  ]);

  res.json({
    success: true,
    data: items,
    meta: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

module.exports = {
  listPrograms,
};
