const Runtime = require("./runtime");

class FlowEngine {
  constructor({ flow, context = {} }) {
    this._flow = flow;
    this._context = context;
    this._runtime = new Runtime({ flow: this._flow, context: this._context });
  }

  start() {
    this._runtime.start();
    return this._runtime;
  }
}

module.exports = FlowEngine;
