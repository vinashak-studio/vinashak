const express = require("express");
const router = express.Router();
const Joi = require("joi");
const validateRequest = require("../_middleware/validate-request");
const authorize = require("../_middleware/authorize");
const projectService = require("../services/project.service");
const testSuiteService = require("../services/testsuite.service");
const testCaseService = require("../services/testcase.service");
const schedulerService = require("../services/scheduler");

const status = require("http-status");

const csrf = require("../_middleware/checkCSRF");
const Role = require("../_helpers/role");

// Project routes
router.get("/", csrf, authorize([Role.Admin, Role.Manager]), getAllProjects);
router.post("/", csrf, authorize([Role.Admin, Role.Manager]), projectSchema, createProject);
router.get("/:projectId", csrf, authorize([Role.Admin, Role.Manager]), getProject);
router.put("/:projectId", csrf, authorize([Role.Admin, Role.Manager]), projectSchema, updateProject);
router.delete("/:projectId", csrf, authorize([Role.Admin, Role.Manager]), _deleteProject);

// Test suite routes
router.get("/:projectId/suite", csrf, authorize([Role.Admin, Role.Manager, Role.Lead]), getAllTestSuites);
router.post("/:projectId/suite", csrf, authorize([Role.Admin, Role.Manager, Role.Lead]), testSuiteSchema, createTestSuite);
router.post("/:projectId/suite/:suiteId/clone", csrf, authorize([Role.Admin, Role.Manager, Role.Lead]), cloneTestSuite);
router.get("/:projectId/suite/:suiteId", csrf, authorize([Role.Admin, Role.Manager, Role.Lead]), getTestSuite);
router.put("/:projectId/suite/:suiteId", csrf, authorize([Role.Admin, Role.Manager, Role.Lead]), testSuiteSchema, updateTestSuite);
router.delete("/:projectId/suite/:suiteId", csrf, authorize([Role.Admin, Role.Manager, Role.Lead]), deleteTestSuite);

// Test case routes
router.get("/:projectId/suite/:suiteId/testcase", csrf, authorize([Role.Admin, Role.Lead, Role.Engineer]), getAllTestCases);
router.post("/:projectId/suite/:suiteId/testcase", csrf, authorize([Role.Admin, Role.Lead, Role.Engineer]), testCaseSchema, createTestCase);
router.post("/:projectId/suite/:suiteId/testcase/:testcaseId/clone", csrf, authorize([Role.Admin, Role.Lead, Role.Engineer]), cloneTestCase);
router.get("/:projectId/suite/:suiteId/testcase/:testcaseId", csrf, authorize([Role.Admin, Role.Lead, Role.Engineer]), getTestCase);
router.put(
  "/:projectId/suite/:suiteId/testcase/:testcaseId",
  csrf,
  authorize([Role.Admin, Role.Lead, Role.Engineer]),
  testCaseSchema,
  updateTestCase
);
router.delete("/:projectId/suite/:suiteId/testcase/:testcaseId", csrf, authorize([Role.Admin, Role.Lead, Role.Engineer]), deleteTestCase);

// Job Scheduler routes
router.get("/:projectId/job", csrf, authorize([Role.Admin, Role.Lead, Role.Engineer]), getAllJobs);
router.post("/:projectId/job", csrf, authorize([Role.Admin, Role.Lead, Role.Engineer]), jobSchema, createJob);
router.get("/:projectId/job/:jobId", csrf, authorize([Role.Admin, Role.Lead, Role.Engineer]), getJobById);
router.put("/:projectId/job/:jobId", csrf, authorize([Role.Admin, Role.Lead, Role.Engineer]), jobSchema, updateJob);
router.delete("/:projectId/job/:jobId", csrf, authorize([Role.Admin, Role.Lead, Role.Engineer]), deleteJob);

module.exports = router;

// Project functions

function projectSchema(req, _, next) {
  validateRequest(req, next, {
    name: Joi.string().min(4).required(),
    description: Joi.string(),
    status: Joi.boolean(),
    settings: Joi.object()
  });
}

function getAllProjects(req, res) {
  projectService
    .list(req.auth.id)
    .then((o) => res.json(o))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function createProject(req, res) {
  projectService
    .create(req.auth.id, req.body)
    .then((o) =>
      res.json({
        id: o?.id,
        message: `Project '${req.body.name}' created successfully.`
      })
    )
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function getProject(req, res) {
  projectService
    .get(req.auth.id, req.params.projectId)
    .then((o) => res.json(o))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function updateProject(req, res) {
  projectService
    .update(req.auth.id, req.params.projectId, req.body)
    .then(() => res.json({ message: "Project updated successfully." }))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function _deleteProject(req, res) {
  projectService
    .delete(req.auth.id, req.params.projectId)
    .then(() => res.json({ message: "Project deleted successfully." }))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

// Test suite functions

function testCloneSuiteSchema(req, _, next) {
  validateRequest(req, next, {
    testSuiteId: Joi.string().required(),
    name: Joi.string().min(4).required(),
    description: Joi.string()
  });
}

function testSuiteSchema(req, _, next) {
  validateRequest(req, next, {
    name: Joi.string().min(4).required(),
    description: Joi.string(),
    status: Joi.boolean(),
    remark: Joi.string(),
    settings: Joi.object()
  });
}

function getAllTestSuites(req, res) {
  testSuiteService
    .list(req.auth.id, req.params.projectId)
    .then((o) => res.json(o))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function createTestSuite(req, res) {
  testSuiteService
    .create(req.auth.id, req.params.projectId, req.body)
    .then((o) =>
      res.json({
        id: o?.id,
        message: `Test suite '${req.body.name}' created successfully.`
      })
    )
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function getTestSuite(req, res) {
  testSuiteService
    .get(req.auth.id, req.params.projectId, req.params.suiteId)
    .then((o) => res.json(o))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function updateTestSuite(req, res) {
  testSuiteService
    .update(req.auth.id, req.params.projectId, req.params.suiteId, req.body)
    .then(() => res.json({ message: "Test suite updated successfully." }))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function deleteTestSuite(req, res) {
  testSuiteService
    .delete(req.auth.id, req.params.projectId, req.params.suiteId)
    .then(() => res.json({ message: "Test suite deleted successfully." }))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function cloneTestSuite(req, res) {
  testSuiteService
    .clone(req.auth.id, req.params.projectId, req.params.suiteId, req.body)
    .then((o) =>
      res.json({
        id: o?.id,
        message: `Test suite '${req.body.name}' cloned successfully.`
      })
    )
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

// Test case functions

function testCaseSchema(req, _, next) {
  validateRequest(req, next, {
    enabled: Joi.boolean().optional(),
    given: Joi.string().optional(),
    when: Joi.string().optional(),
    then: Joi.string().optional(),
    execSteps: Joi.any().optional(),
    settings: Joi.object().optional().default({}),
    tags: Joi.array().optional().default([]),
    type: Joi.number().optional()
  });
}

function getAllTestCases(req, res) {
  testCaseService
    .list(req.auth.id, req.params.suiteId)
    .then((o) => res.json(o))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function createTestCase(req, res) {
  testCaseService
    .create(req.auth.id, req.params.suiteId, req.body)
    .then((o) =>
      res.json({
        id: o?.id,
        message: `Test case created successfully.`
      })
    )
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function cloneTestCase(req, res) {
  testCaseService
    .clone(req.auth.id, req.params.suiteId, req.params.testcaseId)
    .then((o) =>
      res.json({
        id: o?.id,
        message: `Test case cloned successfully.`
      })
    )
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function getTestCase(req, res) {
  testCaseService
    .get(req.auth.id, req.params.suiteId, req.params.testcaseId)
    .then((o) => res.json(o))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function updateTestCase(req, res) {
  testCaseService
    .update(req.auth.id, req.params.suiteId, req.params.testcaseId, req.body)
    .then(() => res.json({ message: "Test case updated successfully." }))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function deleteTestCase(req, res) {
  testCaseService
    .delete(req.auth.id, req.params.suiteId, req.params.testcaseId)
    .then(() => res.json({ message: "Test case deleted successfully" }))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

// Job Scheduler functions

function jobSchema(req, _, next) {
  validateRequest(req, next, {
    name: Joi.string().min(4).required(),
    cron_setting: Joi.string()
      .required()
      .regex(
        /(^((\*\/)?([1-5]?[0-9])((\,|\-|\/)\d+)*|\*)\s((\*\/)?((2[0-3]|1[0-9]|[0-9]))((\,|\-|\/)\d+)*|\*)\s((\*\/)?([1-9]|[12][0-9]|3[01])((\,|\-|\/)\d+)*|\*)\s((\*\/)?([1-9]|1[0-2])((\,|\-|\/)\d+)*|\*)\s((\*\/)?[0-6]((\,|\-|\/)\d+)*|\*)$)|@(annually|yearly|monthly|weekly|daily|hourly|reboot)/
      ),
    callback: Joi.object(),
    status: Joi.number().optional()
  });
}

function getAllJobs(req, res) {
  schedulerService
    .getAllJobs(req.params.projectId)
    .then((o) => res.json(o))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function getJobById(req, res) {
  schedulerService
    .getJobById(req.params.jobId)
    .then((o) => res.json(o))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function createJob(req, res) {
  schedulerService
    .createJob(req.auth.id, req.params.projectId, req.body)
    .then((o) => res.json(o))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function updateJob(req, res) {
  schedulerService
    .updateJob(req.auth.id, req.params.projectId, req.params.jobId, req.body)
    .then((o) => res.json(o))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}

function deleteJob(req, res) {
  schedulerService
    .deleteJob(req.auth.id, req.params.projectId, req.params.jobId)
    .then((o) => res.json(o))
    .catch((err) => {
      logger.error(err);
      res.status(status.INTERNAL_SERVER_ERROR).send({
        error: err.message,
        message: status[`${status.INTERNAL_SERVER_ERROR}_MESSAGE`]
      });
    });
}