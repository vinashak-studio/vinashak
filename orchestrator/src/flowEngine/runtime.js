const EventEmitter = require("events");

const Flow = require("./flow");
const { STATUSCODES } = require("../constants");
const TaskFactory = require("./task_factory");

class Runtime extends EventEmitter {
  constructor({ instanceId, flow, context = {} } = {}) {
    super();
    this._instanceId = instanceId;
    this._flow = new Flow(flow);
    this._context = context;
    this._isRunning = false;
    this._started = false;
    this._completed = false;
    this._state = new Map();
    this._context.nodes = {};
    this._context.startTime = Date.now();
    this._queue = [];
  }

  get flow() {
    return this._flow;
  }

  get startNode() {
    return this.flow.startNode;
  }

  get isRunning() {
    return this._isRunning;
  }

  set isRunning(isRunning) {
    this._isRunning = isRunning;
  }

  changeNodeStatus(id, status) {
    if (!this._context.nodes[id]) this._context.nodes[id] = {};
    this._context.nodes[id][status] = Date.now();
    this._context.nodes[id].status = status;
    this._state.set(id, status);
    this.emit("state", {
      id,
      status
    });
  }

  start() {
    this.runNode({ node: this.startNode });
    this._isRunning = true;
    this.emit("start", { node: this.startNode });
  }

  stop(message) {
    this._context.endTime = Date.now();
    this._context.elapsedTime = this._context.endTime - this._context.startTime;
    this._isRunning = false;
    this.emit("end", { message });
  }

  async runNode({ node, prevNode } = {}) {
    if (!node) {
      return;
    }
    logger.info("Processing Task", node.id);
    let canRun = false;
    if (prevNode) {
      const inboundConnections = this.flow.getInboundConnections(node.id);
      const allCompleted = inboundConnections.filter((c) => this._state.get(c) === STATUSCODES.COMPLETED);
      if (inboundConnections.length === allCompleted.length) {
        canRun = true;
      }
    } else {
      canRun = true;
    }
    if (canRun) {
      this.changeNodeStatus(node.id, STATUSCODES.RUNNING);
      try {
        node.projectId = this._context.id;
        node.instanceId = this._instanceId;

        const task = TaskFactory.createNew(node);
        const result = await task.run();
        this.completeNode({ node, message: result });
      } catch (error) {
        this.emit("error", { error });
        throw error;
      }
    }
  }

  allNodesTraversed() {
    const completed = [...this._state].filter(([k, v]) => v === STATUSCODES.COMPLETED);
    return completed.length === this.flow.nodes.length;
  }

  completeNode({ node, message }) {
    logger.info("Processed Task", node.id);
    this.changeNodeStatus(node.id, STATUSCODES.COMPLETED);
    const outboundConnections = this.flow.getOutboundConnections(node.id);
    if (this.allNodesTraversed()) {
      return this.stop(message);
    }
    const next = [];
    // We have not reached the end, let us continue
    outboundConnections.map((outNode) =>
      next.push({
        node: this.flow.getNode(outNode),
        prevNode: node,
        message
      })
    );

    next.forEach((n) => this.runNode(n));
  }
}

module.exports = Runtime;
