import "./DiamondNode.css";
import React, { memo } from "react";
import { Handle, Position, NodeToolbar, NodeProps } from "reactflow";
import useStore, { NodeData } from "../../stores/store";
import DeleteIcon from "@mui/icons-material/Delete";
import { TextareaAutosize } from "@mui/base";
const DiamondNode: React.FC<NodeProps<NodeData>> = ({
  data,
  isConnectable,
  id,
}: NodeProps<NodeData>) => {
  const onChange = useStore((state) => state.updateNodeLabel);
  const onDelete = useStore((state) => state.deleteNode);
  const onConnect = useStore((state) => state.onConnect);
  // const onAdd = useStore((state) => state.addNode);

  return (
    <>
      <NodeToolbar>
        <button className="icon-button" onClick={() => onDelete(id)}>
          <DeleteIcon />
        </button>
      </NodeToolbar>
      <div className="diamond">
        <div className="unskew-diamond">
          <div className="form__group">
            <label className="form__label" htmlFor={id}>
              Boolean Statement
            </label>
            <TextareaAutosize
              id={id}
              style={{ width: "160px" }}
              maxRows={2}
              className="form__field nodrag"
              value={data.label}
              placeholder="Insert Text Here"
              onChange={(evt: React.ChangeEvent<HTMLTextAreaElement>) =>
                onChange(id, evt.target.value)
              }
            />
          </div>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#555" }}
        onConnect={onConnect}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#555" }}
        onConnect={onConnect}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="a"
        onConnect={onConnect}
        style={{ background: "#555" }}
        isConnectable={isConnectable}
      />
    </>
  );
};

export default memo(DiamondNode);
