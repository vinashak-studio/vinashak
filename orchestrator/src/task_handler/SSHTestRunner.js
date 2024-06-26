const BPromise = require("bluebird");
const SSH2Promise = require("ssh2-promise");

const Task = require("./Task");
const { TestStatus } = require("../constants");

class TestRunner extends Task {
  constructor(taskInfo) {
    super(taskInfo);
    this.stepExecutor = this.stepExecutor.bind(this);
    this.conn = new SSH2Promise(this.settings);
  }

  async before() {
    logger.info("Initializing SSH connect");
    return await this.conn.connect();
  }

  async stepExecutor(accumulator, event) {
    const stepOutcome = {
      stepNo: accumulator.length + 1,
      result: TestStatus.RUNNING,
      startTime: Date.now(),
      event
    };

    if (event.enabled && this.shouldTaskContinue()) {
      try {
        logger.info("SSH Command", event.commandText);
        let result = await this.conn.exec(event.commandText);
        logger.info("SSH Output", result);
        if (result != null) {
          const arr = result.split("\n").filter((i) => !i.includes("Last login:"));
          result = arr.join("\n");
        }
        result = result.substring(0, result.length - 1);
        stepOutcome.result = event.expectedText?.length > 0 && event.expectedText != result ? TestStatus.FAIL : TestStatus.PASS;
        stepOutcome.actual = result;
      } catch (e) {
        logger.error("SSHTestRunner:", e);
        stepOutcome.result = TestStatus.FAIL;
        stepOutcome.actual = e.message;
      }
    } else {
      stepOutcome.actual = "Test step is skipped";
      stepOutcome.result = TestStatus.SKIP;
    }
    stepOutcome.endTime = Date.now();
    stepOutcome.stepTime = stepOutcome.endTime - stepOutcome.startTime;
    this.addStep(stepOutcome);
    return accumulator.concat(stepOutcome);
  }

  async execute() {
    logger.info("SSH steps", JSON.stringify(this.execSteps));
    this.steps = await BPromise.reduce(this.execSteps, this.stepExecutor, []);
    logger.info("SSH steps", JSON.stringify(this.steps));
    const outcome = this.steps.find((s) => s.result === TestStatus.FAIL) || { result: TestStatus.PASS };
    this.actual = { actualResult: outcome };
    this.result = outcome?.result;

    return Promise.resolve({
      actual: outcome?.actual,
      steps: this.steps,
      result: outcome?.result
    });
  }

  async after() {
    if (this.conn) {
      await this.conn.close();
    }
    this.conn = null;
    return Promise.resolve();
  }

  async stop() {
    await this.after();
  }
}

module.exports = TestRunner;
