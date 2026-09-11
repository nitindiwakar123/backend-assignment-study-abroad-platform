const University = require("../models/University");
const cacheService = require("../services/cacheService");
const asyncHandler = require("../utils/asyncHandler");
const { escapedRegex, parse, universityQuery } = require("../validators/requestSchemas");

const SORTS = {
  name: { name: 1, _id: 1 },
  ranking: { qsRanking: 1, popularScore: -1, _id: 1 },
  popular: { popularScore: -1, qsRanking: 1, _id: 1 },
};

function buildFilters(query) {
  const filters = {};
  if (query.country) filters.country = query.country;
  if (query.partnerType) filters.partnerType = query.partnerType;
  if (query.scholarshipAvailable !== undefined) filters.scholarshipAvailable = query.scholarshipAvailable;
  if (query.q) {
    const search = escapedRegex(query.q);
    filters.$or = [{ name: search }, { country: search }, { city: search }, { tags: search }];
  }
  return filters;
}

const listUniversities = asyncHandler(async (req, res) => {
  const query = parse(universityQuery, req.query);
  const filters = buildFilters(query);
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    University.find(filters).sort(SORTS[query.sortBy]).skip(skip).limit(query.limit).lean(),
    University.countDocuments(filters),
  ]);
  res.json({ success: true, data: items, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } });
});

const listPopularUniversities = asyncHandler(async (req, res) => {
  const cacheKey = "popular-universities";
  const cachedUniversities = await cacheService.get(cacheKey);
  if (cachedUniversities) {
    return res.json({ success: true, data: cachedUniversities, meta: { cache: "hit" } });
  }
  const universities = await University.find().sort(SORTS.popular).limit(6).lean();
  await cacheService.set(cacheKey, universities);
  res.json({ success: true, data: universities, meta: { cache: "miss" } });
});

module.exports = { listPopularUniversities, listUniversities };
