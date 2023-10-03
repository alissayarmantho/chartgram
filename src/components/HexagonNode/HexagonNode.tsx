import "./HexagonNode.css";
import { Handle, Position, NodeToolbar, NodeProps } from "reactflow";
import DeleteIcon from "@mui/icons-material/Delete";
import React, { memo } from "react";
import useStore, { NodeData } from "../../stores/store";
export const HexagonNode: React.FC<NodeProps<NodeData>> = ({
  data,
  id,
  isConnectable,
}: NodeProps<NodeData>) => {
  const onChange = useStore((state) => state.updateNodeLabel);
  const onConnect = useStore((state) => state.onConnect);
  const onAdd = useStore((state) => state.addNode);
  const onDelete = useStore((state) => state.deleteNode);
  return (
    <>
      <NodeToolbar>
        <button className="icon-button" onClick={() => onDelete(id)}>
          <DeleteIcon />
        </button>
        <button>add</button>
        <button>edit</button>
        <button onClick={() => onAdd("hexagon")}>add input</button>
      </NodeToolbar>
      <Handle
        type="target"
        position={Position.Top}
        id="a"
        style={{ background: "#555" }}
        onConnect={onConnect}
        isConnectable={isConnectable}
      />

      <div className="hexagon-shape">
        <div className="unskew-hexagon">
          <input
            id={id}
            value={data.label}
            onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
              onChange(id, evt.target.value)
            }
          ></input>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        style={{ background: "#555" }}
        onConnect={onConnect}
        isConnectable={isConnectable}
      />
    </>
  );
};

export default memo(HexagonNode);
