const express = require("express");

const {
  createApplication,
  listApplications,
  updateApplicationStatus,
} = require("../controllers/applicationController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);
router.get("/", listApplications);
router.post("/", createApplication);
router.patch("/:id/status", updateApplicationStatus);

module.exports = router;
