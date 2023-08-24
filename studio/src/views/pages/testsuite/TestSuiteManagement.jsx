import React, { useContext, useEffect, useState } from "react";
import IconButton from "../../utilities/IconButton";
import WebContext from "../../context/WebContext";
import {
  createTestSuite,
  fetchTestSuiteList,
  deleteTestSuite,
  resetTestSuiteFlags,
  updateTestSuite,
  cloneTestSuite,
  runTestSuite
} from "../../../redux/actions/TestSuiteActions";
import { fetchTestCaseList } from "../../../redux/actions/TestCaseActions";
import { useDispatch, useSelector } from "react-redux";
import { ProjectColors } from "../common/ProjectColors";
import CreateTestSuiteDialog from "./CreateTestSuiteDialog";
import DeleteItemDialog from "../../utilities/DeleteItemDialog";
import CustomAlertDialog from "../../utilities/CustomAlertDialog";
import Centered from "../../utilities/Centered";
import SearchComponent from "../../utilities/Search";
import IconRenderer from "../../IconRenderer";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Tooltip from "../../utilities/Tooltip";
import EmptyIconRenderer from "../../utilities/EmptyIconRenderer";
import TestCaseManagement from "./TestCaseManagement";
import NewlineText from "../../utilities/NewlineText";
import TailwindToggleRenderer from "../../tailwindrender/renderers/TailwindToggleRenderer";
import CloneTestSuiteDialog from "./CloneTestSuiteDialog";
import PageHeader, { Page, PageActions, PageBody, PageTitle } from "../common/PageHeader";
import FirstTimeCard from "../common/FirstTimeCard";

dayjs.extend(relativeTime);

const MAX_ALLOWED_TEST_SUITES = 25;

function TestSuiteManagement() {
  const dispatch = useDispatch();
  const [search, setSearch] = useState(null);
  const [selectedTestSuite, setSelectedTestSuite] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);

  const { project, suite, changeSuite } = useContext(WebContext);
  const { testsuites, isFirstTestSuite, showMessage, message, isError, loading } = useSelector((state) => state.suite);

  useEffect(() => {
    if (project?.id) {
      fetchTestSuites();
      if (suite?.id) {
        dispatch(fetchTestCaseList(project?.id, suite?.id));
      }
    }
  }, [project, suite]);

  const handleCreateTestSuite = (testsuite) => {
    if (project?.id) {
      dispatch(createTestSuite(project?.id, testsuite));
      setShowCreateDialog(false);
    }
  };

  const handleCloneTestSuite = (testsuite) => {
    if (project?.id && selectedTestSuite?.id) {
      dispatch(cloneTestSuite(project?.id, selectedTestSuite.id, testsuite));
      setShowCloneDialog(false);
    }
  };

  const handleDeleteTestSuite = () => {
    if (project?.id && selectedTestSuite?.id) {
      dispatch(deleteTestSuite(project?.id, selectedTestSuite.id));
      setShowDeleteDialog(false);
    }
  };

  const fetchTestSuites = () => project?.id && dispatch(fetchTestSuiteList(project.id));

  const openTestSuite = (testsuite) => {
    if (project?.id && testsuite?.id) {
      changeSuite(testsuite);
      dispatch(fetchTestCaseList(project.id, testsuite.id));
    }
  };

  const resetState = () => {
    setSelectedTestSuite(null);
    setShowCreateDialog(false);
    setShowCloneDialog(false);
    setShowDeleteDialog(false);
  };

  if (suite) {
    return (
      <Centered>
        <TestCaseManagement suite={suite} onClose={() => changeSuite(null)} />
      </Centered>
    );
  }

  const filtered = search?.length > 0 ? testsuites?.filter((s) => s.name.includes(search)) : testsuites;

  return (
    <Page>
      <PageHeader show={!isFirstTestSuite}>
        <PageTitle>Test Suites</PageTitle>
        <PageActions>
          <SearchComponent search={search} placeholder="Search suite name" onChange={setSearch} onClear={() => setSearch("")} />
          <Tooltip
            title={
              testsuites?.length > MAX_ALLOWED_TEST_SUITES ? (
                <p>
                  Maximum number testsuites allowed is <strong>{MAX_ALLOWED_TEST_SUITES}</strong>
                </p>
              ) : (
                "Create new test suite"
              )
            }
            placement="bottom"
          >
            <IconButton
              title="Create"
              icon="DashboardCustomize"
              disabled={testsuites?.length > MAX_ALLOWED_TEST_SUITES}
              onClick={() => setShowCreateDialog(true)}
            />
          </Tooltip>
        </PageActions>
      </PageHeader>
      <PageBody>
        {isFirstTestSuite ? (
          <Centered>
            <FirstTimeCard
              id="first-test-suite"
              icon="Extension"
              loading={loading}
              onClick={() => setShowCreateDialog(true)}
              title="Create first TestSuite"
              buttonTitle="Create"
              buttonIcon="PostAdd"
            />
          </Centered>
        ) : (
          <>
            {filtered.length > 0 ? (
              <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-3 p-5">
                {filtered.map((testsuite, index) => (
                  <TestSuiteCard
                    key={index}
                    testsuite={testsuite}
                    projectId={project?.id}
                    openTestSuite={openTestSuite}
                    setSelectedTestSuite={setSelectedTestSuite}
                    setShowCloneDialog={setShowCloneDialog}
                    setShowDeleteDialog={setShowDeleteDialog}
                  />
                ))}
              </div>
            ) : (
              <Centered>
                <EmptyIconRenderer title="TestSuite Not Found" />
                <IconButton title="Refresh" icon="Refresh" onClick={fetchTestSuites} />
              </Centered>
            )}
          </>
        )}
        {showDeleteDialog && (
          <DeleteItemDialog
            title="Delete Test Suite"
            question="Are you sure you want to delete the selected testsuite?"
            showDialog={showDeleteDialog}
            onClose={resetState}
            item={selectedTestSuite?.name}
            onDelete={handleDeleteTestSuite}
          />
        )}
        <CreateTestSuiteDialog showDialog={showCreateDialog} onClose={resetState} createTestSuite={handleCreateTestSuite} />
        {showCloneDialog && (
          <CloneTestSuiteDialog
            showDialog={showCloneDialog}
            onClose={resetState}
            testsuite={selectedTestSuite}
            cloneTestSuite={handleCloneTestSuite}
          />
        )}
        <CustomAlertDialog
          level={isError ? "warn" : "success"}
          message={message}
          showDialog={showMessage}
          onClose={() => {
            fetchTestSuites();
            dispatch(resetTestSuiteFlags());
          }}
        />
      </PageBody>
    </Page>
  );
}

export default TestSuiteManagement;

const TestSuiteCard = ({ projectId, testsuite, openTestSuite, setSelectedTestSuite, setShowCloneDialog, setShowDeleteDialog }) => {
  const dispatch = useDispatch();

  const { id, name, status, description, createdAt, updatedAt } = testsuite;

  const editTestSuite = () => openTestSuite(testsuite);

  const run = () => dispatch(runTestSuite(projectId, id));

  const cloneTestSuite = () => {
    setSelectedTestSuite(testsuite);
    setShowCloneDialog(true);
  };

  const deleteTestSuite = () => {
    setSelectedTestSuite(testsuite);
    setShowDeleteDialog(true);
  };

  const handleToggle = () => dispatch(updateTestSuite(projectId, id, { name, status: !status }));

  const trimmedName = name?.trim() || "";

  return (
    <div key={name} className="bg-white shadow-md hover:shadow-2xl rounded-md h-full">
      <div className="flex flex-row rounded-tr rounded-tl h-full">
        <div className="flex flex-col w-3/12 items-center justify-center ">
          <div
            className="relative w-12 h-12 m-3 mb-1.5 rounded-full flex justify-center shadow-lg hover:shadow-inner items-center bg-opacity-70 text-center select-none text-white font-medium"
            style={{ backgroundColor: ProjectColors[trimmedName.charAt(0).toLowerCase()] }}
            onClick={editTestSuite}
          >
            {trimmedName.charAt(0).toUpperCase() + trimmedName.charAt(name.length - 1).toUpperCase()}
          </div>
          <p className={`text-slate-500 text-xs break-words select-all rounded px-1 ${status ? "bg-green-200" : "bg-slate-200"}`}>
            {status ? "Active" : "In-Active"}
          </p>
        </div>
        <div className="flex flex-col w-9/12 text-left py-3">
          <div className="flex flex-row mb-2 items-center justify-end">
            <Tooltip
              title="Enable/Disable TestSuite"
              content={
                <p>
                  Enable or Disable the <strong>TestSuite</strong>
                </p>
              }
            >
              <TailwindToggleRenderer path={id} visible={true} enabled={true} data={status} handleChange={handleToggle} />
            </Tooltip>
            {status && (
              <Tooltip
                title="Run TestSuite"
                content={
                  <p>
                    Execute test cases of <strong>TestSuite</strong>
                  </p>
                }
              >
                <IconRenderer icon="PlayArrowRounded" className="text-color-0500 hover:text-cds-blue-0500 mt-1 mx-1 cursor-pointer" onClick={run} />
              </Tooltip>
            )}
            <Tooltip
              title="Clone TestSuite"
              content={
                <p>
                  Clone the <strong>TestSuite</strong>
                </p>
              }
            >
              <IconRenderer
                icon="FileCopyOutlined"
                className="text-color-0500 hover:text-cds-blue-0500 mt-1 mx-1 cursor-pointer"
                onClick={cloneTestSuite}
              />
            </Tooltip>
            <Tooltip
              title="Edit TestSuite"
              content={
                <p>
                  View and modify the <strong>TestSuite</strong> details.
                  <br />
                  Create network elements, deploy, Simulate and more
                </p>
              }
            >
              <IconRenderer
                icon="ModeEditOutlineOutlined"
                className="text-color-0500 hover:text-cds-blue-0500 mt-1 mx-1 cursor-pointer"
                onClick={editTestSuite}
              />
            </Tooltip>
            <Tooltip
              title="Delete TestSuite"
              content={
                <p>
                  Permanently purges the <strong>TestSuite</strong> from system including all backups.
                </p>
              }
            >
              <IconRenderer
                icon="DeleteOutlineTwoTone"
                className="text-color-0500 hover:text-cds-red-0600 mt-1 mx-1 cursor-pointer"
                onClick={deleteTestSuite}
              />
            </Tooltip>
          </div>
          <div className="text-slate-600 text-sm font-medium break-words pb-1">{name}</div>
          {createdAt?.length > 0 && (
            <Tooltip title={`Created on ${createdAt}`}>
              <div className="text-slate-500 text-xs break-words select-all">
                <IconRenderer icon="CalendarToday" fontSize="12" className="text-color-0600 pr-0.5" />
                {dayjs(Number(new Date(createdAt).getTime())).fromNow()}
              </div>
            </Tooltip>
          )}
          {updatedAt?.length > 0 && (
            <Tooltip title={`Last Modified on ${updatedAt}`}>
              <div className="text-slate-500 text-xs break-words select-all">
                <IconRenderer icon="CalendarToday" fontSize="12" className="text-color-0600 pr-0.5" />
                {dayjs(Number(new Date(updatedAt).getTime())).fromNow()}
              </div>
            </Tooltip>
          )}
          {description?.length > 0 && (
            <div className="mt-1 text-slate-500 text-xs break-words pr-2 select-all inline-flex items-center">
              <IconRenderer icon="InfoOutlined" fontSize="12" className="text-color-0600 pr-0.5" />
              <NewlineText text={description} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
