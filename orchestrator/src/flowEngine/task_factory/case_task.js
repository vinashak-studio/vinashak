const Task = require("./task");

class TestCaseTask extends Task {

  constructor(info) {
    super(info);
  }

  run() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ done: true, async: true });
      }, 1000);
    });
  }
}

module.exports = TestCaseTask;
