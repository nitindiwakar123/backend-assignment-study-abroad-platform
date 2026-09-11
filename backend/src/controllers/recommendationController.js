const asyncHandler = require("../utils/asyncHandler");
const { buildProgramRecommendations } = require("../services/recommendationService");
const HttpError = require("../utils/httpError");
const { objectId, parse } = require("../validators/requestSchemas");

const getRecommendations = asyncHandler(async (req, res) => {
  const studentId = parse(objectId, req.params.studentId);
  if (req.user.role !== "counselor" && req.user.id !== studentId) throw new HttpError(403, "You can only view your own recommendations.");
  const payload = await buildProgramRecommendations(studentId);

  res.json({
    success: true,
    ...payload,
  });
});

module.exports = {
  getRecommendations,
};
