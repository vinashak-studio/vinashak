import React, { useContext, useEffect, useState } from "react";
import IconButton from "../../utilities/IconButton";
import DeleteItemDialog from "../../utilities/DeleteItemDialog";
import { cropString } from "../utils";
import Centered from "../../utilities/Centered";
import Spinner from "../../utilities/Spinner";
import Tooltip from "../../utilities/Tooltip";
import IconRenderer from "../../IconRenderer";
import SearchComponent from "../../utilities/Search";
import WebContext from "../../context/WebContext";
import {
  fetchTestCaseList,
  createTestCase,
  resetTestCaseFlags,
  deleteTestCase,
  updateTestCase,
  fetchTestCase,
  cloneTestCase,
  runTestCases
} from "../../../redux/actions/TestCaseActions";
import { useDispatch, useSelector } from "react-redux";
import CreateTestCaseDialog from "./CreateTestCaseDialog";
import CustomAlertDialog from "../../utilities/CustomAlertDialog";
import UpdateTestCaseDialog from "./UpdateTestCaseDialog";
import isEmpty from "lodash/isEmpty";
import PageHeader, { Page, PageActions, PageBody, PageTitle } from "../common/PageHeader";
import FirstTimeCard from "../common/FirstTimeCard";
import EmptyIconRenderer from "../../utilities/EmptyIconRenderer";
import ImportTestCaseDialog from "./ImportTestCaseDialog";

const TC_TYPES = ["Scenario", "REST-API", "Web", "SSH"];

function TestCaseManagement({ suite, onClose }) {
  const dispatch = useDispatch();
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const { project } = useContext(WebContext);
  const { isFirstTestCase, loading, testcases, isError, message, showMessage } = useSelector((state) => state.testcase);

  useEffect(() => {
    fetchTestCases();
  }, []);

  const fetchTestCases = () => {
    if (project?.id && suite?.id) {
      dispatch(fetchTestCaseList(project?.id, suite?.id));
    }
  };

  const resetState = () => {
    setSelectedTestCase(null);
    setShowCreateDialog(false);
    setShowUpdateDialog(false);
    setShowDeleteDialog(false);
    setShowImportDialog(false);
  };

  return (
    <>
      {isFirstTestCase ? (
        <Page>
          <PageHeader>
            <PageTitle>Test Cases</PageTitle>
          </PageHeader>
          <PageBody>
            <Centered>
              <FirstTimeCard
                id="first-test-case"
                icon="AddTask"
                loading={loading}
                onClick={() => setShowCreateDialog(true)}
                onClose={onClose}
                title="Create first TestCase"
                details={`TestSuite: ${suite?.name}`}
                buttonTitle="Create"
                buttonIcon="PostAdd"
              />
            </Centered>
          </PageBody>
        </Page>
      ) : (
        <RenderList
          testcases={testcases}
          showDeleteDialog={(selectedTestCase) => {
            setSelectedTestCase(selectedTestCase);
            setShowDeleteDialog(true);
          }}
          showAddTestCaseDialog={() => setShowCreateDialog(true)}
          loading={loading}
          editTestCase={(selectedTestCase) => {
            setSelectedTestCase(selectedTestCase);
            setShowUpdateDialog(true);
            dispatch(fetchTestCase(project?.id, suite?.id, selectedTestCase.id));
          }}
          updateTestCase={(t) => dispatch(updateTestCase(project?.id, suite?.id, t.id, t))}
          deleteTestCase={(selectedTestCase) => {
            setSelectedTestCase(selectedTestCase);
            setShowDeleteDialog(true);
          }}
          cloneTestCase={(selectedTestCase) => {
            setSelectedTestCase(selectedTestCase);
            dispatch(cloneTestCase(project?.id, suite?.id, selectedTestCase.id));
          }}
          runTestCases={(selectedTestCase) => {
            dispatch(runTestCases(project?.id, [selectedTestCase.id]));
          }}
          importTestCase={(selectedTestCase) => {
            setSelectedTestCase(selectedTestCase);
            setShowImportDialog(true);
          }}
        />
      )}
      {showDeleteDialog && (
        <DeleteItemDialog
          title="Delete Test Case"
          question="Are you sure you want to delete the selected Test Case?"
          showDialog={showDeleteDialog}
          onClose={resetState}
          item={selectedTestCase.name}
          onDelete={() => {
            dispatch(deleteTestCase(project?.id, suite?.id, selectedTestCase?.id));
            setShowDeleteDialog(false);
          }}
        />
      )}
      {showCreateDialog && (
        <CreateTestCaseDialog
          showDialog={showCreateDialog}
          onClose={resetState}
          createTestCase={(record) => {
            dispatch(createTestCase(project?.id, suite?.id, record));
            setShowCreateDialog(false);
          }}
        />
      )}
      {showUpdateDialog && (
        <UpdateTestCaseDialog
          testsuite={suite}
          testcase={selectedTestCase}
          isOpen={showUpdateDialog}
          onClose={resetState}
          onUpdate={(t) => {
            dispatch(updateTestCase(project?.id, suite?.id, t.id, t));
            resetState();
          }}
        />
      )}
      {showImportDialog && (
        <ImportTestCaseDialog
          projectId={project?.id}
          testSuiteId={suite?.id}
          testcase={selectedTestCase}
          showDialog={showImportDialog}
          onClose={resetState}
        />
      )}
      <CustomAlertDialog
        level={isError ? "warn" : "success"}
        message={message}
        showDialog={showMessage}
        onClose={() => {
          dispatch(resetTestCaseFlags());
          fetchTestCases();
        }}
      />
    </>
  );
}

export default TestCaseManagement;

function RenderList({
  testcases = [],
  showAddTestCaseDialog,
  loading,
  editTestCase,
  deleteTestCase,
  updateTestCase,
  cloneTestCase,
  runTestCases,
  importTestCase
}) {
  const [search, setSearch] = useState("");

  let filtered = [];
  if (isEmpty(search)) {
    filtered = testcases;
  } else {
    const searchText = search.toLowerCase();
    filtered = testcases?.filter(
      (tc) =>
        String("TCID-" + tc.seqNo)
          .toLowerCase()
          .includes(searchText) ||
        tc.given?.toLowerCase().includes(searchText) ||
        tc.when?.toLowerCase().includes(searchText) ||
        tc.then?.toLowerCase().includes(searchText)
    );
  }

  return (
    <Page>
      <PageHeader>
        <PageTitle>Test Cases</PageTitle>
        <PageActions>
          <SearchComponent search={search} placeholder="Search" onChange={(ev) => setSearch(ev)} onClear={() => setSearch("")} />
          <IconButton title="Add New" icon="AddTask" onClick={() => showAddTestCaseDialog()} />
        </PageActions>
      </PageHeader>
      <PageBody>
        {loading ? (
          <Centered>
            <Spinner>Loading</Spinner>
          </Centered>
        ) : filtered?.length === 0 ? (
          <Centered>
            <EmptyIconRenderer title="TestCase Not Found" />
          </Centered>
        ) : (
          <table className="relative w-full border">
            <TableHeader headers={["#TID", "Given", "When", "Then", "Type", "Actions"]} />
            {filtered?.length > 0 && (
              <tbody className="divide-y">
                {filtered.map((s, index) => (
                  <Row
                    key={index}
                    rowIndex={index}
                    editTestCase={editTestCase}
                    record={s}
                    updateTestCase={updateTestCase}
                    deleteTestCase={deleteTestCase}
                    cloneTestCase={cloneTestCase}
                    runTestCases={runTestCases}
                    importTestCase={importTestCase}
                  />
                ))}
              </tbody>
            )}
          </table>
        )}
      </PageBody>
    </Page>
  );
}

function TableHeader(props) {
  return (
    <thead>
      <tr>
        {props.headers.map((header, index) => (
          <Header key={index} title={header} />
        ))}
      </tr>
    </thead>
  );
}

function Header({ title }) {
  return (
    <th className="sticky top-0 pl-2 py-3 border-b-2 border-slate-200 bg-slate-100 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider truncate">
      {title}
    </th>
  );
}

function Row({ rowIndex, record, editTestCase, deleteTestCase, cloneTestCase, updateTestCase, runTestCases, importTestCase }) {
  const tcType = TC_TYPES[record.type] || "Unknown";

  const exportTestCase = () => {
    const copy = {
      type: tcType
    };
    ["seqNo", "enabled", "given", "when", "then", "execSteps", "settings", "tags"].forEach(function (key) {
      copy[key] = record[key];
    });
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(copy, null, 2));
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", `testcase_TCID-${record.seqNo}.json`);
    linkElement.click();
  };
  return (
    <tr key={"row-" + rowIndex} className="bg-white hover:bg-slate-50 border-b border-slate-200 text-sm">
      <td className="pl-2 w-[5.2rem]">
        <div className="flex flex-row items-center justify-start">
          <input
            type="checkbox"
            name={rowIndex}
            id={"check-" + rowIndex}
            className="text-color-0800 rounded mx-1"
            checked={record.enabled}
            onChange={(_ev) =>
              updateTestCase({
                id: record.id,
                enabled: _ev.target.checked
              })
            }
          />
          <label className="w-20">{`TCID-${record.seqNo}`}</label>
        </div>
      </td>
      <td className="px-2 py-0.5 h-16 break-words max-w-[10rem]">
        <Tooltip title={`TCID-${record.seqNo}`} content={record.given} placement="bottom">
          <label>{record.given && cropString(record.given, 35 * 3).toString()}</label>
        </Tooltip>
      </td>
      <td className="px-2 py-0.5 h-16 break-words max-w-[10rem]">
        <Tooltip title={`TCID-${record.seqNo}`} content={record.when} placement="bottom">
          <label>{record.when && cropString(record.when, 35 * 3).toString()}</label>
        </Tooltip>
      </td>
      <td className="px-2 py-0.5 h-16 break-words max-w-[10rem]">
        <Tooltip title={`TCID-${record.seqNo}`} content={record.then} placement="bottom">
          <label>{record.then && cropString(record.then, 35 * 3).toString()}</label>
        </Tooltip>
      </td>
      <td className="px-2 py-0.5 w-20">
        <label
          className={`text-xs font-normal select-none ${
            record.status === 0
              ? "bg-purple-300"
              : record.status === 1
              ? "bg-indigo-300"
              : record.status === 2
              ? "bg-blue-300"
              : record.status === 3
              ? "bg-violet-400"
              : ""
          }`}
        >
          {tcType}
        </label>
      </td>
      <td className="px-2 py-0.5 w-40">
        <div className="flex flex-row justify-end">
          {record.enabled && record.type > 0 && (
            <IconRenderer
              icon="PlayArrowRounded"
              className="text-color-0500 hover:text-cds-blue-0500 mr-2 cursor-pointer"
              fontSize="medium"
              onClick={() => runTestCases(record)}
            />
          )}
          <IconRenderer
            icon="ContentCopy"
            className="text-color-0500 hover:text-cds-blue-0500 mr-2 cursor-pointer"
            fontSize="medium"
            onClick={() => cloneTestCase(record)}
          />
          <IconRenderer
            icon="Edit"
            className="text-color-0500 hover:text-cds-blue-0500 mr-2 cursor-pointer"
            fontSize="medium"
            onClick={() => editTestCase(record)}
          />
          <IconRenderer
            icon="DeleteForever"
            className="text-color-0500 hover:text-cds-red-0600 mr-2 cursor-pointer"
            fontSize="medium"
            onClick={() => deleteTestCase(record)}
          />
          <IconRenderer
            icon="FileDownload"
            className="text-color-0500 hover:text-cds-blue-0500 mr-2 cursor-pointer"
            fontSize="medium"
            onClick={exportTestCase}
          />
          <IconRenderer
            icon="FileUpload"
            className="text-color-0500 hover:text-cds-blue-0500 mr-2 cursor-pointer"
            fontSize="medium"
            onClick={() => importTestCase(record)}
          />
        </div>
      </td>
    </tr>
  );
}
