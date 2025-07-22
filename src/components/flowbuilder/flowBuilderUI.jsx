"use client";
import React, { useEffect, useState, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle
} from "reactflow";
import Flag from '@mui/icons-material/Flag';
import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VariablesPanel from './variablePanel';
import ButtonNode from './buttonNode';
import NumberNode from './numberNode';
import TextNode from './textNode';
import createTemplateFlow from './templateHandler';
import DefaultNode from './defaultNode';
import { ToastContainer, toast } from 'react-toastify';
import FlowTestPanel from './FlowTestPanel';
import { useRouter } from 'next/navigation';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import Filter1Icon from '@mui/icons-material/Filter1';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import OfflineShareIcon from '@mui/icons-material/OfflineShare';

import "reactflow/dist/style.css";
import DeleteIcon from '@mui/icons-material/Delete';

const ErrorModal = ({ isOpen, onClose, endRouteNodes, nodes }) => {
  if (!isOpen) return null;

  const getNodeNames = (nodeIds) => {
    return nodeIds.map(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      return node?.data?.title || 'Untitled Node';
    });
  };

  const nodeNames = getNodeNames(endRouteNodes);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Cannot Save Flow
            </h3>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            The following route node{nodeNames.length > 1 ? 's are' : ' is'} not connected to other nodes. Please connect all route buttons or change them to a different node type:
          </p>
          
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-800 bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
            {nodeNames.map((nodeName, index) => (
              <li key={index} className="font-medium">
                {nodeName}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Fix Issues
          </button>
        </div>
      </div>
    </div>
  );
};


const initialNodes = [
  {
    id: "start",
    type: "input",
    data: { label: <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}> <Flag size={16} /> Start </div> },
    position: { x: 250, y: 5 },
    style: { width: 150, height: 50, background: "#f0f0f0", padding: "10px", borderRadius: "8px", fontWeight: "bold", textAlign: "center" }
  }
];

const nodeTypes = {
  buttonNode: ButtonNode,
  numberNode: NumberNode,
  textNode: TextNode,
  default: DefaultNode,
};

const initialEdges = [];

const variableOptions = [
  "age",
  "name",
  "email",
  "phone",
  "location"
];

export default function FlowBuilderUI({ flowId: propFlowId, flowName: propFlowName, onBack }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [tempNumberConfig, setTempNumberConfig] = useState({});
  const [configPanelVisibleNodeId, setConfigPanelVisibleNodeId] = useState(null);
  const [tempTextInputConfig, setTempTextInputConfig] = useState({});
  const [textConfigPanelVisibleNodeId, setTextConfigPanelVisibleNodeId] = useState(null);
  const [tempButtonConfig, setTempButtonConfig] = useState({ 
    buttons: [{ label: 'Button 1' }, { label: 'Button 2' }],
    nodeType: 'route'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error', or null
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [flowName, setFlowName] = useState(propFlowName ? decodeURIComponent(propFlowName) : "");
  const router = useRouter();
  const [showVariablePanel, setShowVariablesPanel] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState([]); 

  // Get flowId from props or URL
  const getFlowId = useCallback(() => {
    if (propFlowId) return propFlowId;
    
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      return url.searchParams.get("id");
    }
    return null;
  }, [propFlowId]);

  const closeErrorModal = () => {
  setShowErrorModal(false);
  setErrorModalData([]);
};
  
  const flowId = getFlowId();

  // Fetch flow details to get the name if not provided
  useEffect(() => {
    const fetchFlowDetails = async () => {
      if (!flowId) return;
      
      // If flowName is already provided via props, no need to fetch
      if (propFlowName) {
        setFlowName(decodeURIComponent(propFlowName));
        return;
      }

      try {
        const apiUrl = `https://flowbot-1048592730476.europe-west4.run.app/api/v2/flows/${flowId}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch flow details');
        }

        const data = await response.json();
        if (data && data.name) {
          setFlowName(data.name);
        }
      } catch (err) {
        console.error('Error fetching flow details:', err);
      }
    };

    fetchFlowDetails();
  }, [flowId, propFlowName]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);


  // Handle back button click
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      // Fallback if onBack prop is not provided
      router.push('/apps/flowbot/flowbuilder');
    }
  };


 const addNode = () => {
    const newNodeId = `node-${nodeIdCounter}`;
    const newNode = {
      id: newNodeId,
      type: "default",
      data: { 
        id: newNodeId, 
        title: "Click to edit title", 
        prompt: "Click to edit question/prompt", 
        inputType: null, 
        updateNodeData,
        deleteNode, 
        numberInputOptions: {}, 
        textInputOptions: {}, 
        buttonOptions: [{ label: 'Button 1' }, { label: 'Button 2' }] 
      },
      position: { x: 200 + nodeIdCounter * 100, y: 100 + nodeIdCounter * 100 },
      className: "min-w-[250px]"
    };
  
    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter((prev) => prev + 1);
  };

  const handleVariableAdd = (newVariable) => {
    // Handle the new variable in your main component if needed
    console.log('New variable added:', newVariable);
  };

  const updateNodeData = (id, key, value) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, [key]: value } } : node
      )
    );
  };

  // Save the entire flow as a batch
  const saveEntireFlow = async () => {
    const endRouteNodes = findRouteEndNodes();
      if (endRouteNodes.length > 0) {
        setShowErrorModal(true);
        setErrorModalData(endRouteNodes);
        return;
      }
      
    if (!flowId) {
      console.error("No flow ID available");
      toast.error("No flow ID found. Please check the URL parameters.");
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      // Create a topologically sorted list of nodes (starting from nodes connected to start)
      const sortedNodes = createSortedNodeList();
      
      const timestamp = new Date().toISOString();
      
      // Convert nodes to the backend format
      const formattedNodes = sortedNodes.map((node, index) => 
        convertNodeToBackendFormat(node, index, sortedNodes, timestamp)
      );

      // Create the payload
      const payload = {
        flow_id: parseInt(flowId),
        nodes: formattedNodes
      };

      console.log("Saving flow with payload:", payload);
      
      // Send to the backend
      const response = await fetch("https://flowbot-1048592730476.europe-west4.run.app/api/v2/nodes/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save flow: ${response.statusText}`);
      }
      
      const result = await response.json();

      toast.success("Flow saved successfully");
      setSaveStatus('success');
      
      return result;
    } catch (error) {
      console.error("Error saving flow:", error);
      setSaveStatus('error');
      toast.error("Failed to save flow");
      return null;
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // This function creates a topologically sorted list of nodes starting from the "start" node
const createSortedNodeList = () => {
  // Get all the regular nodes from the canvas (no virtual button nodes)
  const regularNodes = [];
  const visited = new Set();
  
  // Find direct children of the start node
  const startNodeChildren = edges
    .filter(edge => edge.source === "start")
    .map(edge => nodes.find(node => node.id === edge.target))
    .filter(Boolean);
  
  // For each child of the start node, do a depth-first traversal
  for (const child of startNodeChildren) {
    visitNode(child, visited, regularNodes);
  }
  
  // Return only the regular nodes (no virtual button nodes)
  return regularNodes;
};

const findRouteEndNodes = () => {
  const routeEndNodes = [];
  
  nodes.forEach(node => {
    if (node.data.inputType === "Buttons" && node.data.nodeType === 'route') {
      // For each button in the route node, check if it has outgoing connections
      const buttonOptions = node.data.buttonOptions || [];
      let hasAnyButtonConnections = false;
      
      for (let i = 0; i < buttonOptions.length; i++) {
        const hasButtonConnection = edges.some(edge => 
          edge.source === node.id && edge.sourceHandle === `button-${i}`
        );
        if (hasButtonConnection) {
          hasAnyButtonConnections = true;
          break;
        }
      }
      
      // If none of the buttons have connections, this is an end route node
      if (!hasAnyButtonConnections) {
        routeEndNodes.push(node.id);
      }
    }
  });
  
  return routeEndNodes;
};

const routeEndNodes = React.useMemo(() => {
  return findRouteEndNodes();
}, [nodes, edges]);


// Helper function for depth-first traversal
const visitNode = (node, visited, result) => {
  if (visited.has(node.id)) return;
  
  visited.add(node.id);
  result.push(node);
  
  // Find all children of this node
  const children = edges
    .filter(edge => {
      // For route nodes, consider edges with button-specific sourceHandles
      if (node.data.inputType === "Buttons" && node.data.nodeType === 'route') {
        return edge.source === node.id && edge.sourceHandle?.startsWith('button-');
      }
      // For list nodes, look for the list-output handle
      else if (node.data.inputType === "Buttons" && node.data.nodeType === 'list') {
        return edge.source === node.id && edge.sourceHandle === 'list-output';
      }
      // For other node types, regular connections
      else {
        return edge.source === node.id;
      }
    })
    .map(edge => nodes.find(n => n.id === edge.target))
    .filter(Boolean);
  
  for (const child of children) {
    visitNode(child, visited, result);
  }
};


 

// Convert nodes to backend format with proper parent relationships
const convertNodeToBackendFormat = (node, index, allNodes, timestamp) => {
  // For regular nodes, determine parent based on connections
  let parentIndex = null;
  let triggerButtonIndex = null; // New: track which button triggered this node
  let parentId = null; // Track parent ID for button name logic
  
  // Look for incoming edges to this node
  const incomingEdges = edges.filter(edge => edge.target === node.id);
  
  if (incomingEdges.length > 0) {
    parentId = incomingEdges[0].source;
    const sourceHandle = incomingEdges[0].sourceHandle;
    
    if (parentId === "start") {
      // Direct child of start node gets parent_index 0
      parentIndex = 0;
    } else {
      // Check if this is connected to a specific button in a route node
      if (sourceHandle?.startsWith('button-')) {
        const parentNode = nodes.find(n => n.id === parentId);
        
        if (parentNode?.data?.inputType === "Buttons" && parentNode?.data?.nodeType === "route") {
          // Get the button index from the handle
          const buttonIndex = parseInt(sourceHandle.split('-')[1]);
          triggerButtonIndex = buttonIndex; // Store which button triggers this node
          
          // Find the parent route node in our sorted list
          parentIndex = allNodes.findIndex(n => n.id === parentId);
        } else {
          // Normal node parent
          parentIndex = allNodes.findIndex(n => n.id === parentId);
        }
      } 
      // Check if this is connected to a list node
      else if (sourceHandle === 'list-output') {
        const parentNode = nodes.find(n => n.id === parentId);
        
        if (parentNode?.data?.inputType === "Buttons" && parentNode?.data?.nodeType === "list") {
          // For list nodes, directly use the parent node index
          parentIndex = allNodes.findIndex(n => n.id === parentId);
        } else {
          // Normal node parent
          parentIndex = allNodes.findIndex(n => n.id === parentId);
        }
      }
      else {
        // Normal node parent
        parentIndex = allNodes.findIndex(n => n.id === parentId);
      }
    }
  } else {
    // If no parent, set to 0 (attached to start)
    parentIndex = 0;
  }
  
  let nodeType = "TEXT"; // Default type
  
  if (node.data.inputType === "Buttons") {
    // Check if this is a route or list type
    nodeType = node.data.nodeType === 'route' ? "ROUTE" : "LIST";
  } else if (node.data.inputType === "Number Input") {
    nodeType = "NUMBER";
  } else if (node.data.inputType === "Text Input") {
    nodeType = "TEXT";
  }
  
  let extraData = {
    position: node.position || node.positionAbsolute
  };
  
  if (nodeType === "ROUTE") {
    extraData = {
      ...extraData,
      buttons: node.data.buttonOptions.map(btn => ({
        text: btn.label
      }))
    };
  } else if (nodeType === "LIST") {
    extraData = {
      ...extraData,
      LIST: node.data.buttonOptions.map(btn => btn.label)
    };
  } else if (nodeType === "NUMBER") {
    extraData = {
      ...extraData,
      min: node.data.numberInputOptions?.minimum,
      max: node.data.numberInputOptions?.maximum,
      variableName: node.data.numberInputOptions?.variableName
    };
  } else if (nodeType === "TEXT") {
    extraData = {
      ...extraData,
      placeholder: node.data.textInputOptions?.placeholder,
      variableName: node.data.textInputOptions?.variableName
    };
  }
  
  // Add trigger button index for nodes connected to route buttons
  if (triggerButtonIndex !== null) {
    extraData.trigger_button_index = triggerButtonIndex;
  }
  
  // Determine the node name - for route button children, ALWAYS use the button text
  let nodeName = node.data.title || "";
  
  // If this node is triggered by a route button, override with the button text
  if (triggerButtonIndex !== null) {
    const parentNode = nodes.find(n => n.id === parentId);
    if (parentNode?.data?.inputType === "Buttons" && 
        parentNode?.data?.nodeType === "route" && 
        parentNode?.data?.buttonOptions?.[triggerButtonIndex]) {
      // Always use the button label as the node name, regardless of user-edited title
      nodeName = parentNode.data.buttonOptions[triggerButtonIndex].label;
    }
  }

  return {
    backend_enabled: true,
    exit_enabled: true,
    extra_data: extraData,
    header_text_template: {
      language: "en",
      text: node.data.prompt || ""
    },
    name: nodeName,
    node_type: nodeType,
    parent_index: parentIndex !== null ? parentIndex : 0,
    created_at: timestamp,
    updated_at: timestamp,
    created_by: "",
    updated_by: ""
  };
};

  // Function to publish the flow -- to do
  const publishFlow = async () => {
    if (!flowId) {
      console.error("No flow ID available");
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    // to do the publish logic
      
  };

  // Function to test the flow
  const testFlow = () => {
    if (!flowId) {
      console.error("No flow ID available");
      return;
    }
    
    setShowTestPanel(true);
  };
  const closeTestPanel = () => {
    setShowTestPanel(false);
  };

const applyTemplate = () => {
    const { nodes: templateNodes, edges: templateEdges } = createTemplateFlow();
    
    // Update nodes with necessary handler functions
    const nodesWithHandlers = templateNodes.map(node => {
      let updatedNode = { ...node };
      
      if (node.type === "numberNode") {
        updatedNode.data = {
          ...node.data,
          handleNumberConfigChange,
          saveNumberConfig,
          cancelNumberConfig,
          openNumberConfigPanel,
          updateNodeData,
          deleteNode, 
          tempNumberConfig,
          configPanelVisibleNodeId,
          selectedNode,
          variableOptions
        };
      }
      else if (node.type === "textNode") {
        updatedNode.data = {
          ...node.data,
          handleTextConfigChange,
          saveTextConfig,
          cancelTextConfig,
          openTextConfigPanel,
          updateNodeData,
          deleteNode, 
          tempTextInputConfig,
          textConfigPanelVisibleNodeId,
          variableOptions
        };
      }
      else if (node.type === "buttonNode") {
        updatedNode.data = {
          ...node.data,
          handleButtonConfigChange,
          addButtonItem,
          saveButtonConfig,
          updateNodeData,
          deleteNode 
        };
      }
      else {
        updatedNode.data = {
          ...node.data,
          updateNodeData,
          deleteNode 
        };
      }
      
      return updatedNode;
    });
  
    setNodes(nodesWithHandlers);
    setEdges(templateEdges);
    
    setNodeIdCounter(templateNodes.length + 1);
  };

const addUserInputToNode = (inputType) => {
    if (!selectedNode || selectedNode === "start") return;
  
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode) {
          let updatedData = { ...node.data, inputType };
          let updatedNode = { ...node };
  
          if (inputType === "Buttons") {
            updatedNode.type = "buttonNode";
            updatedData = {
              ...updatedData,
              nodeType: 'route', 
              buttonOptions: [
                { label: 'Button 1' }, 
                { label: 'Button 2' }
              ],
              handleButtonConfigChange,
              addButtonItem,
              saveButtonConfig,
              updateNodeData,
              deleteNode, 
              isEndRouteNode: routeEndNodes.includes(node.id),
              id: node.id
            };
            setTempButtonConfig({ 
              buttons: [
                { label: 'Button 1' }, 
                { label: 'Button 2' }
              ],
              nodeType: 'route'
            });
          } else if (inputType === "Number Input") {
            const nodeId = node.id;
            updatedNode.type = "numberNode";
            updatedData = {
              ...updatedData,
              handleNumberConfigChange,
              saveNumberConfig,
              cancelNumberConfig,
              openNumberConfigPanel,
              updateNodeData,
              deleteNode, 
              tempNumberConfig,
              configPanelVisibleNodeId,
              selectedNode,  
              variableOptions,
              id: nodeId,
              numberInputOptions: updatedData.numberInputOptions || {}
            };
          } else if (inputType === "Text Input") {
            const nodeId = node.id;
            updatedNode.type = "textNode";
            updatedData = {
              ...updatedData,
              handleTextConfigChange,
              saveTextConfig,
              cancelTextConfig,
              openTextConfigPanel,
              updateNodeData,
              deleteNode, 
              tempTextInputConfig,
              textConfigPanelVisibleNodeId,
              variableOptions,
              id: nodeId,
              textInputOptions: updatedData.textInputOptions || {}
            };
          } else {
            // Default node handling
            updatedNode.type = "default";
            updatedData.deleteNode = deleteNode; 
            if (inputType !== "Number Input") {
              updatedData.numberInputOptions = {};
              setConfigPanelVisibleNodeId(null);
            }
            if (inputType !== "Text Input") {
              updatedData.textInputOptions = {};
              setTextConfigPanelVisibleNodeId(null);
            }
          }
  
          return { ...updatedNode, data: updatedData };
        }
        return node;
      })
    );
    setConfigPanelVisibleNodeId(null);
    setTextConfigPanelVisibleNodeId(null);
  };


  const handleNumberConfigChange = (key, value) => {
    setTempNumberConfig(prevConfig => ({
      ...prevConfig,
      [key]: value,
    }));
  };

  const saveNumberConfig = () => {
    if (selectedNode) {
      setNodes(nds =>
        nds.map(node =>
          node.id === selectedNode ? { ...node, data: { ...node.data, numberInputOptions: tempNumberConfig } } : node
        )
      );
      setConfigPanelVisibleNodeId(null);
    }
  };

  const cancelNumberConfig = () => {
    setConfigPanelVisibleNodeId(null);
    setTempNumberConfig(nodes.find(node => node.id === selectedNode)?.data.numberInputOptions || {});
  };

  const openNumberConfigPanel = (nodeId) => {
    const currentNode = nodes.find(node => node.id === nodeId);
    if (currentNode) {
      setSelectedNode(nodeId);
      setConfigPanelVisibleNodeId(nodeId);
      setTempNumberConfig(currentNode.data.numberInputOptions || {});
    }
  };

  const handleTextConfigChange = (key, value) => {
    setTempTextInputConfig(prevConfig => ({
      ...prevConfig,
      [key]: value,
    }));
  };

  const saveTextConfig = () => {
    if (selectedNode) {
      setNodes(nds =>
        nds.map(node => {
          if (node.id === selectedNode) {
            return {
              ...node,
              data: {
                ...node.data,
                textInputOptions: tempTextInputConfig
              }
            };
          }
          return node;
        })
      );
      setTextConfigPanelVisibleNodeId(null);
    }
  };

  const cancelTextConfig = () => {
    setTextConfigPanelVisibleNodeId(null);
    setTempTextInputConfig(nodes.find(node => node.id === selectedNode)?.data.textInputOptions || {});
  };
  const toggleVariablePanel = () => {
    setShowVariablesPanel(!showVariablePanel);
    if (showTestPanel) {
      setShowTestPanel(false);
    }
  };
  const closeVariablePanel = () => {
    setShowVariablesPanel(false);
  };


  const openTextConfigPanel = (nodeId) => {
    setTextConfigPanelVisibleNodeId(nodeId);
    setTempTextInputConfig(nodes.find(node => node.id === nodeId)?.data.textInputOptions || {});
  };

  // Button Input Config Panel Handlers
  const handleButtonConfigChange = (index, key, value) => {
    setTempButtonConfig(prevConfig => {
      const updatedButtons = [...prevConfig.buttons];
      if (!updatedButtons[index]) {
        updatedButtons[index] = { label: `Button ${index + 1}` };
      }
      updatedButtons[index][key] = value;
      return { ...prevConfig, buttons: updatedButtons };
    });
  
    setNodes(nds =>
      nds.map(node => {
        if (node.id === selectedNode) {
          const updatedButtonOptions = [...node.data.buttonOptions];
          if (!updatedButtonOptions[index]) {
            updatedButtonOptions[index] = { label: `Button ${index + 1}` };
          }
          updatedButtonOptions[index][key] = value;
          return {
            ...node,
            data: {
              ...node.data,
              buttonOptions: updatedButtonOptions
            }
          };
        }
        return node;
      })
    );
  };

  const addButtonItem = () => {
    const newButton = { label: `Button ${tempButtonConfig.buttons.length + 1}` };
    
    // Update temp state
    setTempButtonConfig(prevConfig => ({
      ...prevConfig,
      buttons: [...prevConfig.buttons, newButton]
    }));
  
    // Update node data
    setNodes(nds =>
      nds.map(node => {
        if (node.id === selectedNode) {
          return {
            ...node,
            data: {
              ...node.data,
              buttonOptions: [...node.data.buttonOptions, newButton]
            }
          };
        }
        return node;
      })
    );
  };

  const saveButtonConfig = () => {
    if (selectedNode) {
      setNodes(nds =>
        nds.map(node =>
          node.id === selectedNode ? {
            ...node,
            data: {
              ...node.data,
              buttonOptions: tempButtonConfig.buttons,
              nodeType: tempButtonConfig.nodeType || 'route'
            }
          } : node
        )
      );
    }
  };


  const cancelButtonItem = () => {
    if (selectedNode) {
      setTempButtonConfig({ 
        buttons: nodes.find(node => node.id === selectedNode)?.data.buttonOptions || [],
        nodeType: nodes.find(node => node.id === selectedNode)?.data.nodeType || 'route'
      });
    }
  };
const attachHandlersToNodes = (loadedNodes) => {
  return loadedNodes.map(node => {
    if (node.type === "numberNode") {
      return {
        ...node,
        data: {
          ...node.data,
          handleNumberConfigChange,
          saveNumberConfig,
          cancelNumberConfig,
          openNumberConfigPanel,
          updateNodeData,
          deleteNode, 
          tempNumberConfig,
          configPanelVisibleNodeId,
          selectedNode,
          variableOptions
        }
      };
    } else if (node.type === "textNode") {
      return {
        ...node,
        data: {
          ...node.data,
          handleTextConfigChange,
          saveTextConfig,
          cancelTextConfig,
          openTextConfigPanel,
          updateNodeData,
          deleteNode, 
          tempTextInputConfig,
          textConfigPanelVisibleNodeId,
          variableOptions
        }
      };
    } else if (node.type === "buttonNode") {
      // Create a node-specific addButtonItem function
      const nodeSpecificAddButtonItem = () => {
        const newButton = { label: `Button ${node.data.buttonOptions.length + 1}` };
        
        // Update temp state
        setTempButtonConfig(prevConfig => ({
          ...prevConfig,
          buttons: [...(node.data.buttonOptions || []), newButton]
        }));
      
        // Update node data
        setNodes(nds =>
          nds.map(n => {
            if (n.id === node.id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  buttonOptions: [...(n.data.buttonOptions || []), newButton]
                }
              };
            }
            return n;
          })
        );
      };

      return {
        ...node,
        data: {
          ...node.data,
          handleButtonConfigChange,
          addButtonItem: nodeSpecificAddButtonItem,
          saveButtonConfig,
          updateNodeData,
          deleteNode, 
          isEndRouteNode: routeEndNodes.includes(node.id), 
          id: node.id
        }
      };
    } else if (node.type === "default") {
      return {
        ...node,
        data: {
          ...node.data,
          updateNodeData,
          deleteNode 
        }
      };
    }
    
    return node;
  });
};



  // load existing flow nodes
const getFlowNodes = async () => {
  if (!flowId) {
    console.error("No flow ID available");
    return;
  }

  try {
    const response = await fetch(`https://flowbot-1048592730476.europe-west4.run.app/api/v2/flows/${flowId}/linked-nodes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to load flow nodes: ${response.statusText}`);
    }
    
    const flowData = await response.json();
    console.log("Flow nodes loaded:", flowData);
    
    if (flowData && flowData.nodes && flowData.nodes.length > 0) {
      // Convert backend nodes to our local format
      const { localNodes, localEdges } = convertBackendNodesToLocalFormat(flowData.nodes);
      
      // Attach handlers to the loaded nodes
      const nodesWithHandlers = attachHandlersToNodes(localNodes);
      
      setNodes(nodesWithHandlers);
      setEdges(localEdges);
      
      // Find the highest numerical part in existing node IDs
      const nodeIds = nodesWithHandlers
        .filter(n => n.id !== "start")
        .map(n => {
          const match = n.id.match(/node-(\d+)/);
          return match ? parseInt(match[1]) : 0;
        });
      
      const highestId = nodeIds.length > 0 ? Math.max(...nodeIds) : 0;
      setNodeIdCounter(highestId + 1);
      
      toast.success("Flow loaded successfully");
    }
  } catch (error) {
    console.error("Error loading flow nodes:", error);
    toast.error("Failed to load flow");
  }
};

const getNavigate = async () => {
  if (!flowId) {
    console.error("No flow ID available");
    return;
  }
  try {
    const response = await fetch(`https://flowbot-1048592730476.europe-west4.run.app/public/flow/navigate/14`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to load flow nodes: ${response.statusText}`);
    }
    const navigateData = await response.json();
    console.log("Flow nodes loaded:", navigateData);
  } catch (error) {
    console.error("Error loading Navigation nodes:", error);
    toast.error("Failed to load Navigation");
  }
};


// Convert backend nodes to local ReactFlow format
const convertBackendNodesToLocalFormat = (backendNodes) => {
  const localNodes = [
    {
      id: "start",
      type: "input",
      data: { label: <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}> <Flag size={16} /> Start </div> },
      position: { x: 250, y: 5 },
      style: { width: 150, height: 50, background: "#f0f0f0", padding: "10px", borderRadius: "8px", fontWeight: "bold", textAlign: "center" }
    }
  ];
  
  const localEdges = [];
  
  // Step 1: Sort backend nodes by their creation time to preserve original order
  // This is crucial because backend might reorder nodes by ID
  const sortedBackendNodes = [...backendNodes].sort((a, b) => {
    // First try to sort by creation time
    if (a.created_at && b.created_at) {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    // Fallback to ID sorting if no creation time
    return a.id - b.id;
  });
    
  // Step 2: Create a mapping from backend array index to local node ID
  const backendIndexToLocalId = {}; 
  
  // Step 3: Create all local nodes
  let localNodeCounter = 1;
  
  sortedBackendNodes.forEach((backendNode, backendIndex) => {
    const localId = `node-${localNodeCounter}`;
    backendIndexToLocalId[backendIndex] = localId;
    localNodeCounter++;
    
    // Determine position from extra_data
    const position = backendNode.extra_data?.position || { 
      x: 250 + localNodeCounter * 150, 
      y: 100 + localNodeCounter * 100 
    };
    
    // Determine node type and configuration
    let nodeType = "default";
    let inputType = null;
    let numberInputOptions = {};
    let textInputOptions = {};
    let buttonOptions = [];
    let buttonNodeType = 'route'; // Default for button nodes
    
    if (backendNode.node_type === "NUMBER") {
      nodeType = "numberNode";
      inputType = "Number Input";
      numberInputOptions = {
        minimum: backendNode.extra_data?.min,
        maximum: backendNode.extra_data?.max,
        variableName: backendNode.extra_data?.variableName
      };
    } else if (backendNode.node_type === "TEXT") {
      nodeType = "textNode";
      inputType = "Text Input";
      textInputOptions = {
        placeholder: backendNode.extra_data?.placeholder || "Enter text",
        variableName: backendNode.extra_data?.variableName
      };
    } else if (backendNode.node_type === "ROUTE") {
      nodeType = "buttonNode";
      inputType = "Buttons";
      buttonNodeType = 'route';
      
      if (backendNode.extra_data?.buttons) {
        buttonOptions = backendNode.extra_data.buttons.map(btn => ({
          label: btn.text || "Button"
        }));
      } else {
        buttonOptions = [{ label: 'Button 1' }, { label: 'Button 2' }];
      }
    } else if (backendNode.node_type === "LIST") {
      nodeType = "buttonNode";
      inputType = "Buttons";
      buttonNodeType = 'list';
      
      if (backendNode.extra_data?.LIST) {
        buttonOptions = backendNode.extra_data.LIST.map(text => ({
          label: text
        }));
      } else {
        buttonOptions = [{ label: 'Item 1' }, { label: 'Item 2' }];
      }
    }
    
    // Determine the title - for route button children, use the button name
    let nodeTitle = backendNode.name || "Click to edit title";
    
    // Check if this node is a child of a route node
    if (backendNode.parent_index !== null && backendNode.extra_data?.trigger_button_index !== undefined) {
      const parentNode = sortedBackendNodes[backendNode.parent_index];
      if (parentNode?.node_type === "ROUTE" && parentNode.extra_data?.buttons) {
        const buttonIndex = backendNode.extra_data.trigger_button_index;
        const buttonText = parentNode.extra_data.buttons[buttonIndex]?.text;
        if (buttonText) {
          nodeTitle = buttonText;
        }
      }
    }

    const localNode = {
      id: localId,
      type: nodeType,
      position: position,
      data: {
        id: localId,
        title: nodeTitle,
        prompt: backendNode.header_text_template?.text || "Click to edit question/prompt",
        inputType: inputType,
        updateNodeData,
        deleteNode, 
        numberInputOptions,
        textInputOptions,
        buttonOptions,
        nodeType: buttonNodeType
      },
      className: "min-w-[250px]"
    };
    
    localNodes.push(localNode);
  });
  
  // Step 4: Create the connections (edges) based on parent_index and trigger_button_index
  sortedBackendNodes.forEach((backendNode, backendIndex) => {
    const currentLocalId = backendIndexToLocalId[backendIndex];
    if (!currentLocalId) return;
        
    // Special case: Only the very first node (array index 0) with parent_index 0 connects to start
    if (backendIndex === 0 && backendNode.parent_index === 0) {
      localEdges.push({
        id: `edge-start-${currentLocalId}`,
        source: "start",
        target: currentLocalId
      });
    }
    // All other nodes use parent_index as array index to find their parent
    else if (backendNode.parent_index !== null && backendNode.parent_index !== undefined) {
      const parentBackendNode = sortedBackendNodes[backendNode.parent_index];
      
      if (!parentBackendNode) {
        return;
      }
            
      const parentLocalId = backendIndexToLocalId[backendNode.parent_index];
      
      if (parentLocalId) {
        // Check if this node was triggered by a specific button in a route
        const triggerButtonIndex = backendNode.extra_data?.trigger_button_index;
        
        if (parentBackendNode.node_type === "ROUTE" && triggerButtonIndex !== undefined) {
          // Connect from the specific button handle
          localEdges.push({
            id: `edge-${parentLocalId}-btn${triggerButtonIndex}-${currentLocalId}`,
            source: parentLocalId,
            target: currentLocalId,
            sourceHandle: `button-${triggerButtonIndex}`
          });
        }
        else if (parentBackendNode.node_type === "LIST") {
          // Connect from the list output handle
          localEdges.push({
            id: `edge-${parentLocalId}-list-${currentLocalId}`,
            source: parentLocalId,
            target: currentLocalId,
            sourceHandle: 'list-output'
          });
        }
        else {
          // Regular node connection
          localEdges.push({
            id: `edge-${parentLocalId}-${currentLocalId}`,
            source: parentLocalId,
            target: currentLocalId
          });
        }
      }
    }
  });
  
  return { localNodes, localEdges };
};

const deleteNode = useCallback((nodeId) => {
    // Prevent deleting the start node
    if (nodeId === "start") {
      toast.error("Cannot delete the start node");
      return;
    }

    // Show confirmation dialog
    const confirmDelete = window.confirm("Are you sure you want to delete this node? This action cannot be undone.");
    
    if (!confirmDelete) {
      return;
    }

    // Remove the node
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    
    // Remove all edges connected to this node
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    
    // Clear selection if the deleted node was selected
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }

    // Close any open config panels for this node
    if (configPanelVisibleNodeId === nodeId) {
      setConfigPanelVisibleNodeId(null);
    }
    if (textConfigPanelVisibleNodeId === nodeId) {
      setTextConfigPanelVisibleNodeId(null);
    }

    toast.success("Node deleted successfully");
  }, [selectedNode, configPanelVisibleNodeId, textConfigPanelVisibleNodeId, setNodes, setEdges]);



useEffect(() => {
  if (flowId) {
    getFlowNodes();
    // getNavigate();

  }
}, [flowId]);
;
return (
  <div className="h-screen flex flex-col">
    {/* Top Navigation Bar */}
    <div className="h-16 border-b flex items-center justify-between px-4 bg-white">
      <div className="flex items-center">
        <button 
          onClick={handleBackClick}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
        </button>
        <h1 className="text-xl font-semibold">{flowName || "Flow Builder"}</h1>
      </div>
      <div className="flex items-center space-x-4">
        {saveStatus === 'success' && (
          <span className="text-green-600 mr-2">Successfully saved</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-red-600 mr-2">Error saving</span>
        )}
        <button 
          className={`px-6 py-2 bg-[#F58426] text-white rounded-lg flex items-center space-x-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
          onClick={saveEntireFlow}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save as Draft'}
        </button>
        <button 
          className={`px-6 py-2 bg-[#090A29] text-white rounded-lg ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
          onClick={publishFlow}
          disabled={isSaving}
        >
          {isSaving ? 'Publishing...' : 'Publish'}
        </button>
        <button 
          className="px-6 py-2 border border-[#F58426] bg-[#F58426] text-white rounded-lg flex items-center space-x-1"
          onClick={toggleVariablePanel}
        >
          <span>Variables</span>
        </button>
        {/* Variables Panel - Note this is positioned here before the Test button */}
        <button 
          className="px-6 py-2 border border-[#F58426] text-[#F58426] rounded-lg flex items-center space-x-2"
          onClick={testFlow}
        >
          <PlayArrowIcon fontSize="small" />
          <span>Test</span>
        </button>
      </div>
    </div>

    <div className="flex flex-1 overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-64 border-r bg-white">
        <div className="p-4">
          <div className="space-y-4">
            <h2 className="font-medium text-gray-900">Bots Input</h2>
            <button 
              onClick={addNode} 
              className="w-full p-3 text-left bg-[#090A29] text-white rounded-lg flex items-center"
            >
              <Flag fontSize="small" className="mr-2" /> Text
            </button>
            
            <h2 className="font-medium text-gray-900 pt-4">Users Output</h2>
            <div className="space-y-2">
              <button 
                onClick={() => addUserInputToNode("Text Input")} 
                className="w-full p-3 text-left border border-[#F58426] text-[#F58426] rounded-lg flex items-center space-x-2 hover:bg-gray-50"
                disabled={!selectedNode || selectedNode === "start"}
              >
                <SortByAlphaIcon/>
                <span>Text</span>
              </button>
              <button 
                onClick={() => addUserInputToNode("Buttons")} 
                className="w-full p-3 text-left border border-[#F58426] text-[#F58426] rounded-lg flex items-center space-x-2 hover:bg-gray-50"
                disabled={!selectedNode || selectedNode === "start"}
              >
                <DocumentScannerIcon/>
                <span>Multiple Options</span>
                
              </button>
              <button 
                onClick={() => addUserInputToNode("Number Input")} 
                className="w-full p-3 text-left border border-[#F58426] text-[#F58426] rounded-lg flex items-center space-x-2 hover:bg-gray-50"
                disabled={!selectedNode || selectedNode === "start"}
              >
                <Filter1Icon/>
                <span>Number</span>
              </button>
              <button 
                className="w-full p-3 text-left border border-[#F58426] text-[#F58426] rounded-lg flex items-center space-x-2 hover:bg-gray-50"
                disabled={!selectedNode || selectedNode === "start"}
              >
                <MailOutlineIcon/>
                <span>Email</span>
              </button>
            </div>

            <h2 className="font-medium text-gray-900 pt-4">Logic</h2>
            <div className="space-y-2">
              <button 
                onClick={applyTemplate} 
                className="w-full p-3 text-left bg-[#F58426] text-white rounded-lg">
                <DocumentScannerIcon/>
                <span>Template</span>
              </button>
              <button 
                className="w-full p-3 text-left bg-[#F58426] text-white rounded-lg">
                <OfflineShareIcon/>
                <span>Redirect</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => {
            setSelectedNode(node.id);
            
            if (node.type !== "numberNode" && node.type !== "textNode") {
              setConfigPanelVisibleNodeId(null);
              setTextConfigPanelVisibleNodeId(null);
            }
          }}
          style={{ height: "100%" }}
        >
          <MiniMap />
          <Controls />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>

      {/* Right Side Test Panel when active */}
      {showTestPanel && (
        <FlowTestPanel flowId={flowId} onClose={closeTestPanel} />
      )}
      {showVariablePanel && (
        <VariablesPanel 
          onVariableAdd={handleVariableAdd} 
          onClose={closeVariablePanel}
        />
      )}
    </div>
    {showErrorModal && (
      <ErrorModal
        isOpen={showErrorModal}
        onClose={closeErrorModal}
        endRouteNodes={errorModalData}
        nodes={nodes}
      />
    )}
  </div>
);
}