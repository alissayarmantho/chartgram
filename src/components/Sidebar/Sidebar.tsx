import "../RectangleNode/RectangleNode.css";
import "../ParallelogramNode/ParallelogramNode.css";
import "../DiamondNode/DiamondNode.css";
import "../HexagonNode/HexagonNode.css";
import "../RoundedRectangleNode/RoundedRectangleNode.css";
import "../CircleNode/CircleNode.css";
import "./Sidebar.css";

const Sidebar = ({ nodes, setNodes }: any) => {
  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: string
  ) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside
      style={{
        background: "#d2e0ff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div className="description">
        You can drag these nodes into the canvas
      </div>
      <div
        style={{ margin: "10px" }}
        onDragStart={(event: React.DragEvent<HTMLDivElement>) =>
          onDragStart(event, "rectangle")
        }
        draggable
      >
        <div className="node text-updater-node">
          <div
            className="form__group"
            style={{
              margin: "0px",
              padding: "0px",
              color: "black",
              marginTop: "0px",
            }}
          >
            <div className="form__field">Statement</div>
          </div>
        </div>
      </div>
      <div
        onDragStart={(event: React.DragEvent<HTMLDivElement>) =>
          onDragStart(event, "parallelogram")
        }
        draggable
      >
        <div className="node parallelogram">
          <div className="unskew-parallelogram">
            <div
              className="form__group"
              style={{
                margin: "0px",
                padding: "0px",
                color: "black",
                marginTop: "0px",
              }}
            >
              <div className="form__field">Input / Output</div>
            </div>
          </div>
        </div>
      </div>
      <div
        onDragStart={(event: React.DragEvent<HTMLDivElement>) =>
          onDragStart(event, "diamond")
        }
        draggable
      >
        <div
          className="node diamond"
          style={{ width: "120px", height: "120px", margin: "30px" }}
        >
          <div className="unskew-diamond">
            <div
              className="form__group"
              style={{
                margin: "0px",
                padding: "0px",
                color: "black",
                marginTop: "0px",
              }}
            >
              <div className="form__field">If-Else</div>
            </div>
          </div>
        </div>
      </div>
      <div
        onDragStart={(event: React.DragEvent<HTMLDivElement>) =>
          onDragStart(event, "diamond_end")
        }
        draggable
      >
        <div
          className="node diamond"
          style={{ width: "120px", height: "120px", margin: "30px" }}
        >
          <div className="unskew-diamond">
            <div
              className="form__group"
              style={{
                margin: "0px",
                padding: "0px",
                color: "black",
                marginTop: "0px",
              }}
            >
              <div className="form__field">If-Else End</div>
            </div>
          </div>
        </div>
      </div>
      {/* <div
        style={{ margin: "10px" }}
        onDragStart={(event: React.DragEvent<HTMLDivElement>) =>
          onDragStart(event, "hexagon")
        }
        draggable
      >
        <div className="node hexagon-sidebar">
          <div
            className="form__group"
            style={{
              margin: "0px",
              padding: "0px",
              color: "black",
              marginTop: "0px",
            }}
          >
            <div className="form__field" style={{ zIndex: 1 }}>
              Loops
            </div>
          </div>
        </div>
      </div> */}
      <div
        style={{ margin: "10px" }}
        onDragStart={(event: React.DragEvent<HTMLDivElement>) =>
          onDragStart(event, "roundedrectangle")
        }
        draggable
      >
        <div className="node rounded-rectangle-node">
          <div
            className="form__group"
            style={{
              margin: "0px",
              padding: "0px",
              color: "black",
              marginTop: "0px",
            }}
          >
            <div className="form__field" style={{ width: "120px" }}>
              Loops
            </div>
          </div>
        </div>
      </div>
      <div
        style={{ margin: "10px" }}
        onDragStart={(event: React.DragEvent<HTMLDivElement>) =>
          onDragStart(event, "circle")
        }
        draggable
      >
        <div
          className="node circle-node"
          style={{ width: "120px", height: "120px" }}
        >
          <div
            className="form__group"
            style={{
              margin: "0px",
              padding: "0px",
              color: "black",
              marginTop: "0px",
            }}
          >
            <div className="form__field" style={{ width: "80px" }}>
              Function
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
