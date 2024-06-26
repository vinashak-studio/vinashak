const express = require("express");
const router = express.Router();
const runner = require("../services/runner.service");
const status = require("http-status");
const isEmpty = require("lodash/isEmpty");
const authorize = require("../_middleware/authorize");
const csrf = require("../_middleware/checkCSRF");
const { RUN_TYPE } = require("../constants");

router.post("/:projectId/stop", csrf, authorize(), stopProjectBuilds);
router.post(
  "/:projectId/runProject",
  csrf,
  authorize(),
  (req, res, next) => {
    req.params.flow = true;
    next();
  },
  startProjectBuilds
);
router.post("/:projectId/runTestScenario/:scenarioId", csrf, authorize(), startTestScenario);
router.post("/:projectId/runTestCases", csrf, authorize(), startTestCases);

router.post("/:projectId/trigger", startProjectBuilds);
router.post("/:projectId/trigger-sequence", triggerSequence);

module.exports = router;

// Build Runner functions
function triggerSequence(req, res) {
  logger.info("triggerSequence", req.params.projectId);
  runner
    .triggerSequence(req.params.projectId)
    .then((response) => res.status(status.ACCEPTED).json(response))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({ error: err.message, message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`] });
    });
}

function startProjectBuilds(req, res) {
  let options = {};
  if (!isEmpty(req.body)) {
    options = {
      ...req.body
    };
  }
  logger.info("Starting project build", req.params.projectId);
  runner
    .create(req.auth?.id, req.params.projectId, {
      options
    })
    .then((response) => res.status(status.OK).json(response))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({ error: err.message, message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`] });
    });
}

function stopProjectBuilds(req, res) {
  runner
    .stop(req.params.projectId)
    .then((response) => res.status(status.ACCEPTED).json(response))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({ error: err.message, message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`] });
    });
}

function startTestCases(req, res) {
  logger.info("StartTestCases", req.params.projectId, req.body);
  runner
    .createTestCase(req.auth?.id, req.params.projectId, RUN_TYPE.TESTCASE, req.body)
    .then((response) => res.status(status.OK).json(response))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({ error: err.message, message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`] });
    });
}

function startTestScenario(req, res) {
  logger.info("Start Test Scenario", req.params.projectId, req.params.scenarioId);
  runner
    .createTestScenario(req.auth?.id, req.params.projectId, req.params.scenarioId)
    .then((response) => res.status(status.OK).json(response))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({ error: err.message, message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`] });
    });
}
