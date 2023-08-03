import React, { useCallback, useMemo, useRef, useState } from "react";
import ReactFlow, { Controls, addEdge, useNodesState, useEdgesState, Background, MarkerType } from "reactflow";
import ConnectionLine from "./ConnectionLine";
import TestCaseNode from "./TestCaseNode";
import { useDispatch, useSelector } from "react-redux";
import TestCaseStartNode from "./TestCaseStartNode";
import StartNode from "./StartNode";
import DefaultEdge from "./DefaultEdge";
import * as actionTypes from "../../../redux/actions";
import "reactflow/dist/style.css";
import "reactflow/dist/base.css";
import TestSuiteNode from "./TestSuiteNode";
import TestCaseEndNode from "./TestCaseEndNode";

const TestCaseSequencer = () => {
  const dispatch = useDispatch();
  const reportRef = useRef(null);
  const reactFlowWrapper = useRef();
  const { nodes: initialNodes, edges: initialEdges } = useSelector((state) => state.sequencer);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes = useMemo(() => {
    return { root: StartNode, tc: TestCaseNode, ts: TestSuiteNode, tss: TestCaseStartNode, tse: TestCaseEndNode };
  }, []);

  const edgeTypes = useMemo(() => ({ default: DefaultEdge }), []);

  const onDragStop = useCallback(
    (_ev, node) => {
      if (node) {
        const changes = [...nodes];
        let i = changes.findIndex((item) => item.id === node.id);
        if (i > -1) {
          changes[i].position = node.position;
          let minX = 10000,
            maxX = 0,
            minY = 10000,
            maxY = 0;
          let tssIndex = -1,
            tseIndex = -1;

          changes.forEach((n, index) => {
            if (n.parentNode === node.parentNode) {
              if (n.type === "tss") {
                tssIndex = index;
              } else if (n.type === "tse") {
                tseIndex = index;
              } else {
                if (n.position.x < minX) {
                  minX = n.position.x;
                }
                if (n.position.x > maxX) {
                  maxX = n.position.x;
                }
                if (n.position.y > maxY) {
                  maxY = n.position.y;
                }
                if (n.position.y < minY) {
                  minY = n.position.y;
                }
              }
            }
          });

          i = changes.findIndex((item) => item.id === node.parentNode);
          if (i > -1) {
            changes[i].style.width = maxX - minX + 250;
            changes[i].style.height = maxY - minY + 100;
            if (changes[i].position.x > changes[i].position.x + minX) {
              changes[i].position.x = changes[i].position.x + minX;
            }
            if (changes[i].position.y > changes[i].position.y + minY) {
              changes[i].position.y = changes[i].position.y + minY;
            }
            if (tssIndex > -1) {
              changes[tssIndex].position.y = changes[i].style.height / 2;
            }

            if (tseIndex > -1) {
              changes[tseIndex].position.y = changes[i].style.height / 2;
              changes[tseIndex].position.x = (tssIndex > -1 ? changes[tssIndex].position.x + changes[i].style.width : changes[i].style.width) - 50;
            }
          }
          setNodes(changes);
          dispatch({
            type: actionTypes.TEST_SEQUENCER,
            payload: {
              nodes: changes
            }
          });
        }
      }
    },
    [nodes, setNodes]
  );

  const onConnect = useCallback(
    (params) => {
      const changes = addEdge(
        {
          ...params,
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "rgb(148 163 184)"
          },
          type: "default"
        },
        edges
      );
      setEdges(changes);
      dispatch({
        type: actionTypes.TEST_SEQUENCER,
        payload: {
          edges: changes
        }
      });
    },
    [edges, setEdges]
  );

  return (
    <div className="reactflow-wrapper h-[90vh] " ref={reactFlowWrapper}>
      <ReactFlow
        id="testsequencer-canvas"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        maxZoom={1.5}
        minZoom={0.5}
        deleteKeyCode={46}
        elementsSelectable={true}
        connectionLineComponent={ConnectionLine}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onDragStop}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        style={{ background: "white" }}
        proOptions={{
          account: "paid-custom",
          hideAttribution: true
        }}
      >
        <Controls />
        <Background color="#aaa" gap={15} />
      </ReactFlow>
    </div>
  );
};

export default TestCaseSequencer;