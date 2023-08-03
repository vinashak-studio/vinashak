const { getPagination, getPagingData } = require("../utils/pagination");
const { Op } = require("sequelize");

module.exports = {
  list,
  create,
  clone,
  get,
  update,
  delete: _delete
};

async function list(AccountId, TestSuiteId, page = 0, size = 10000) {
  const { limit, offset } = getPagination(page, size);
  const data = await global.DbStoreModel.TestCase.findAndCountAll({
    where: {
      AccountId,
      TestSuiteId
    },
    order: [["seqNo", "ASC"]],
    limit,
    offset
  });
  return getPagingData(data, page, limit);
}

async function create(AccountId, TestSuiteId, payload) {
  const ts = await global.DbStoreModel.TestSuite.findByPk(TestSuiteId);

  const testSuites = await global.DbStoreModel.TestSuite.findAll({
    attributes: ["id"],
    where: {
      ProjectMasterId: ts.ProjectMasterId
    }
  });

  let seqNo = await global.DbStoreModel.TestCase.max("seqNo", {
    where: {
      TestSuiteId: {
        [Op.in]: testSuites.map((suite) => suite.id)
      }
    }
  });
  if (seqNo == null) {
    seqNo = 0;
  }
  seqNo = Number(seqNo) + 1;

  const tc = new global.DbStoreModel.TestCase({
    ...payload,
    AccountId,
    TestSuiteId
  });
  tc.seqNo = seqNo;
  tc.createdAt = Date.now();
  tc.updatedAt = Date.now();
  await tc.save();
  return tc;
}

async function clone(AccountId, TestSuiteId, id) {
  let tc = await get(AccountId, TestSuiteId, id);
  tc = tc.toJSON();
  delete tc.id;
  delete tc.seqNo;
  const tcClone = new global.DbStoreModel.TestCase({
    ...tc,
    AccountId,
    TestSuiteId
  });
  tcClone.createdAt = Date.now();
  tcClone.updatedAt = Date.now();
  await tcClone.save();
  return tcClone;
}

async function update(accountId, suiteId, id, payload) {
  const tc = await get(accountId, suiteId, id);
  Object.assign(tc, payload);
  tc.updatedAt = Date.now();
  return await tc.save();
}

async function _delete(accountId, suiteId, id) {
  const tc = await get(accountId, suiteId, id);
  return await tc.destroy({ force: true });
}

// helper functions

async function get(AccountId, TestSuiteId, id) {
  let tc;
  if (AccountId) {
    tc = await global.DbStoreModel.TestCase.findOne({
      include: global.DbStoreModel.TestSuite,
      where: {
        id,
        AccountId,
        TestSuiteId
      }
    });
  } else {
    tc = await global.DbStoreModel.TestCase.findByPk(id);
  }

  if (!tc) throw new Error("Test case not found");
  return tc;
}