const Program = require("../models/Program");
const asyncHandler = require("../utils/asyncHandler");
const { escapedRegex, parse, programQuery } = require("../validators/requestSchemas");

const SORTS = {
  tuitionAsc: { tuitionFeeUsd: 1, _id: 1 },
  tuitionDesc: { tuitionFeeUsd: -1, _id: 1 },
  relevance: { scholarshipAvailable: -1, tuitionFeeUsd: 1, _id: 1 },
};

function buildFilters(query) {
  const filters = {};
  for (const field of ["country", "degreeLevel", "field"]) {
    if (query[field]) filters[field] = query[field];
  }
  if (query.intake) filters.intakes = query.intake;
  if (query.maxTuition !== undefined) filters.tuitionFeeUsd = { $lte: query.maxTuition };
  if (query.scholarshipAvailable !== undefined) filters.scholarshipAvailable = query.scholarshipAvailable;
  if (query.q) {
    const search = escapedRegex(query.q);
    filters.$or = [{ title: search }, { universityName: search }, { field: search }];
  }
  return filters;
}

const listPrograms = asyncHandler(async (req, res) => {
  const query = parse(programQuery, req.query);
  const filters = buildFilters(query);
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    Program.find(filters).sort(SORTS[query.sortBy]).skip(skip).limit(query.limit).lean(),
    Program.countDocuments(filters),
  ]);

  res.json({
    success: true,
    data: items,
    meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  });
});

module.exports = { listPrograms };
