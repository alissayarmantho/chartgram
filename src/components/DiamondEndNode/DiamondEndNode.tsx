import "./DiamondEndNode.css";
import "../../FormField.css";
import React, { memo } from "react";
import { Handle, Position, NodeToolbar, NodeProps } from "reactflow";
import useStore, { NodeData } from "../../stores/store";
import DeleteIcon from "@mui/icons-material/Delete";
const DiamondEndNode: React.FC<NodeProps<NodeData>> = ({
  data,
  isConnectable,
  id,
}: NodeProps<NodeData>) => {
  const onDelete = useStore((state) => state.deleteNode);
  const onConnect = useStore((state) => state.onConnect);
  const isValidConnection = useStore((state) => state.isValidConnection);
  // const onAdd = useStore((state) => state.addNode);

  return (
    <>
      <NodeToolbar>
        <button className="icon-button" onClick={() => onDelete(id)}>
          <DeleteIcon />
        </button>
      </NodeToolbar>
      <div className="diamond-end">
        <div className="unskew-diamond-end">
          <div className="form__group">
            <label
              className="form__label"
              style={{ color: "white" }}
              htmlFor={id}
            >
              End
            </label>
          </div>
        </div>
      </div>
      <Handle
        type="source"
        id={id + "-next"}
        position={Position.Bottom}
        style={{ bottom: 3 }}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        id={id + "-else-end"}
        position={Position.Right}
        style={{ right: 3 }}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id={id + "-if-end"}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        style={{ left: 3 }}
        isConnectable={isConnectable}
      />
    </>
  );
};

export default memo(DiamondEndNode);
