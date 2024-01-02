const sequelize = require("sequelize");
const TestStatus = require("../../runner/enums/TestStatus");
const { Op } = sequelize;

module.exports = {
  getJobInfo,
  updateJob,
  updateBuild,
  updateBuildStatus,
  consolidate,
  updateScreenshot
};

async function getJobInfo(id) {
  const jobInfo = await global.DbStoreModel.Job.findOne({
    include: [
      global.DbStoreModel.BuildMaster,
      {
        model: global.DbStoreModel.TestCase,
        include: {
          model: global.DbStoreModel.TestScenario,
          include: global.DbStoreModel.ProjectMaster
        }
      }
    ],
    where: {
      id
    }
  });
  if (!jobInfo) throw new Error(`Job ID:${id} not found`);
  jobInfo.settings = {
    ...jobInfo.TestCase?.TestScenario?.settings,
    env: jobInfo.TestCase?.TestScenario?.ProjectMaster?.settings?.env
  };
  return jobInfo;
}

async function getBuildInfo(id) {
  const buildInfo = await global.DbStoreModel.BuildMaster.findOne({
    include: [global.DbStoreModel.Job],
    where: { id }
  });
  if (!buildInfo) throw new Error(`Build ID:${id} not found`);
  return buildInfo;
}

async function updateJob(id, params) {
  const job = await getJobInfo(id);
  Object.assign(job, params);
  job.updatedAt = Date.now();
  return await job.save();
}

async function updateScreenshot(id, payload) {
  const job = await getJobInfo(id);
  if (!job.screenshot) job.screenshot = [];
  job.screenshot = [...job.screenshot, payload];
  job.updatedAt = Date.now();
  return await job.save();
}

async function consolidate(buildId) {
  try {
    const results = await global.DbStoreModel.Job.findAll({
      attributes: ["result", [sequelize.fn("COUNT", sequelize.col("id")), "Count"]],
      where: {
        BuildMasterId: buildId
      },
      group: ["result"],
      raw: true
    });

    const minmax = await global.DbStoreModel.Job.findAll({
      attributes: [
        [sequelize.fn("MIN", sequelize.col("startTime")), "MIN"],
        [sequelize.fn("MAX", sequelize.col("endTime")), "MAX"]
      ],
      where: {
        BuildMasterId: buildId,
        result: {
          [Op.not]: 0
        }
      },
      raw: true
    });

    let startTime, endTime;

    minmax.forEach((r) => {
      startTime = r.MIN;
      endTime = r.MAX;
    });

    let draft = 0,
      total = 0,
      passed = 0,
      failed = 0,
      skipped = 0,
      status = 0,
      running = 0;
    results.forEach((r) => {
      switch (r.result) {
        case TestStatus.DRAFT:
          draft += r.Count;
          break;
        case TestStatus.PASS:
          passed += r.Count;
          break;
        case TestStatus.FAIL:
          failed += r.Count;
          break;
        case TestStatus.RUNNING:
          running += r.Count;
          break;
        default:
          skipped += r.Count;
          break;
      }
      total += r.Count;
    });

    const sum = passed + failed + skipped + running;
    if (sum === passed) {
      status = TestStatus.PASS;
    } else if (failed > 0) {
      status = TestStatus.FAIL;
    } else if (draft > 0) {
      status = TestStatus.DRAFT;
    } else {
      status = TestStatus.RUNNING;
    }
    await updateBuildStatus(buildId, { total, passed, failed, skipped, running, startTime, endTime, status });
  } catch (error) {
    logger.error(error);
  }
}

async function updateBuildStatus(id, params) {
  const build = await getBuildInfo(id);
  Object.assign(build, params);
  build.updatedAt = Date.now();
  return await build.save();
}

async function updateBuild(id) {
  const build = await getBuildInfo(id);

  let total = 0,
    skipped = 0,
    failed = 0,
    passed = 0;
  build.Jobs.forEach((job) => {
    total++;
    switch (job.result) {
      case TestStatus.PASS:
        passed++;
        break;
      case TestStatus.FAIL:
        failed++;
        break;
      case TestStatus.RUNNING:
        break;
      default:
        logger.info("Job details", job.id, job.result);
        skipped++;
    }
  });
  build.status = failed > 0 ? TestStatus.FAIL : TestStatus.PASS;
  build.total = total;
  build.passed = passed;
  build.failed = failed;
  build.skipped = skipped;
  build.updatedAt = Date.now();
  build.endTime = Date.now();
  return await build.save();
}
