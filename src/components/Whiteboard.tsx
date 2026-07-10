import React, { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Rect, Circle, Line, Text, Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";
import { nanoid } from "nanoid";
import { 
  Pencil, 
  Square, 
  Circle as CircleIcon, 
  Type, 
  Image as ImageIcon, 
  Trash2, 
  Download, 
  MousePointer2, 
  Move,
  Minus,
  Plus,
  RefreshCw
} from "lucide-react";
import { CanvasElement, CanvasElementType } from "../canvas-types";

interface WhiteboardProps {
  socket: any;
  room: string;
  theme: any;
}

// Sub-component for images to handle loading
const URLImage = ({ element, isSelected, onSelect, onChange }: { 
  element: CanvasElement; 
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<CanvasElement>) => void;
}) => {
  const [img] = useImage(element.src || "");
  const shapeRef = useRef<any>(null);

  return (
    <>
      <KonvaImage
        image={img}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        id={element.id}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          });
        }}
      />
    </>
  );
};

export function Whiteboard({ socket, room, theme: t }: WhiteboardProps) {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<CanvasElementType | "select">("pencil");
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Viewport state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Handle stage resizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Sync with socket
  useEffect(() => {
    if (!socket) return;

    const handleInit = (initialElements: CanvasElement[]) => {
      setElements(initialElements);
    };

    const handleDraw = (element: CanvasElement) => {
      setElements((prev) => {
        const index = prev.findIndex((el) => el.id === element.id);
        if (index !== -1) {
          const newElements = [...prev];
          newElements[index] = element;
          return newElements;
        }
        return [...prev, element];
      });
    };

    const handleClear = () => {
      setElements([]);
      setSelectedId(null);
    };

    socket.on("canvas:init", handleInit);
    socket.on("canvas:draw", handleDraw);
    socket.on("canvas:clear", handleClear);

    return () => {
      socket.off("canvas:init", handleInit);
      socket.off("canvas:draw", handleDraw);
      socket.off("canvas:clear", handleClear);
    };
  }, [socket]);

  // Handle selection transformer
  useEffect(() => {
    if (tool === "select" && selectedId && transformerRef.current) {
      const selectedNode = stageRef.current.findOne("#" + selectedId);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        transformerRef.current.nodes([]);
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedId, tool, elements]);

  const handleMouseDown = (e: any) => {
    if (tool === "select") {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setSelectedId(null);
      }
      return;
    }

    setIsDrawing(true);
    const pos = e.target.getStage().getRelativePointerPosition();
    const id = nanoid();
    
    let newElement: CanvasElement = {
      id,
      type: tool as CanvasElementType,
      x: pos.x,
      y: pos.y,
      stroke: t.accentText.includes("indigo") ? "#818cf8" : "#94a3b8",
      strokeWidth: 2,
    };

    if (tool === "pencil") {
      newElement.points = [pos.x, pos.y];
    } else if (tool === "rect") {
      newElement.width = 0;
      newElement.height = 0;
      newElement.fill = t.accentLightBg.includes("indigo") ? "rgba(129, 140, 248, 0.1)" : "rgba(148, 163, 184, 0.1)";
    } else if (tool === "circle") {
      newElement.radius = 0;
      newElement.fill = t.accentLightBg.includes("indigo") ? "rgba(129, 140, 248, 0.1)" : "rgba(148, 163, 184, 0.1)";
    } else if (tool === "text") {
      const text = prompt("Enter text:", "Brainstorming...");
      if (!text) {
        setIsDrawing(false);
        return;
      }
      newElement.text = text;
      newElement.fill = t.isLight ? "#1e293b" : "#f8fafc";
      setIsDrawing(false);
      setElements((prev) => [...prev, newElement]);
      socket.emit("canvas:draw", newElement);
      return;
    }

    setElements((prev) => [...prev, newElement]);
    setSelectedId(id);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || tool === "select") return;

    const pos = e.target.getStage().getRelativePointerPosition();
    const lastElement = elements[elements.length - 1];
    if (!lastElement) return;

    const updatedElements = elements.slice();
    const index = updatedElements.length - 1;
    const element = { ...updatedElements[index] };

    if (tool === "pencil") {
      element.points = element.points?.concat([pos.x, pos.y]);
    } else if (tool === "rect") {
      element.width = pos.x - element.x;
      element.height = pos.y - element.y;
    } else if (tool === "circle") {
      element.radius = Math.sqrt(
        Math.pow(pos.x - element.x, 2) + Math.pow(pos.y - element.y, 2)
      );
    }

    updatedElements[index] = element;
    setElements(updatedElements);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const lastElement = elements[elements.length - 1];
    if (lastElement) {
      socket.emit("canvas:draw", lastElement);
    }
  };

  const handleElementChange = (id: string, newAttrs: Partial<CanvasElement>) => {
    setElements((prev) => {
      const index = prev.findIndex((el) => el.id === id);
      if (index === -1) return prev;
      const updated = [...prev];
      updated[index] = { ...updated[index], ...newAttrs };
      socket.emit("canvas:draw", updated[index]);
      return updated;
    });
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const newElements = elements.filter((el) => el.id !== selectedId);
    setElements(newElements);
    setSelectedId(null);
    socket.emit("canvas:sync", newElements);
  };

  const clearCanvas = () => {
    if (confirm("Clear the entire whiteboard?")) {
      socket.emit("canvas:clear");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const id = nanoid();
        const newElement: CanvasElement = {
          id,
          type: "image",
          x: 100,
          y: 100,
          src: event.target?.result as string,
          width: 200,
          height: 200,
        };
        setElements((prev) => [...prev, newElement]);
        socket.emit("canvas:draw", newElement);
      };
      reader.readAsDataURL(file);
    }
  };

  const zoomIn = () => setScale((s) => Math.min(s + 0.1, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.1, 0.5));
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div ref={containerRef} className={`flex flex-col h-full ${t.isLight ? "bg-white" : "bg-slate-950"} border-l ${t.border}`}>
      {/* Toolbar */}
      <div className={`p-2 border-b ${t.border} flex items-center justify-between gap-2 overflow-x-auto`}>
        <div className="flex items-center gap-1">
          <ToolButton 
            active={tool === "select"} 
            onClick={() => setTool("select")} 
            icon={<MousePointer2 className="w-4 h-4" />} 
            title="Select & Transform"
            theme={t}
          />
          <ToolButton 
            active={tool === "pencil"} 
            onClick={() => setTool("pencil")} 
            icon={<Pencil className="w-4 h-4" />} 
            title="Pencil"
            theme={t}
          />
          <ToolButton 
            active={tool === "rect"} 
            onClick={() => setTool("rect")} 
            icon={<Square className="w-4 h-4" />} 
            title="Rectangle"
            theme={t}
          />
          <ToolButton 
            active={tool === "circle"} 
            onClick={() => setTool("circle")} 
            icon={<CircleIcon className="w-4 h-4" />} 
            title="Circle"
            theme={t}
          />
          <ToolButton 
            active={tool === "text"} 
            onClick={() => setTool("text")} 
            icon={<Type className="w-4 h-4" />} 
            title="Text"
            theme={t}
          />
          <label className={`p-2 rounded-lg cursor-pointer transition-all hover:bg-slate-800 text-slate-400`}>
            <ImageIcon className="w-4 h-4" />
            <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center bg-slate-900/50 rounded-lg p-0.5 border border-slate-800 mr-2">
            <button onClick={zoomOut} className="p-1.5 text-slate-400 hover:text-white"><Minus className="w-3.5 h-3.5" /></button>
            <button onClick={resetZoom} className="px-2 text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-tighter min-w-[40px]">
              {Math.round(scale * 100)}%
            </button>
            <button onClick={zoomIn} className="p-1.5 text-slate-400 hover:text-white"><Plus className="w-3.5 h-3.5" /></button>
          </div>
          
          <button 
            onClick={deleteSelected}
            disabled={!selectedId}
            className={`p-2 rounded-lg transition-all ${selectedId ? "text-rose-400 hover:bg-rose-500/10" : "text-slate-600 opacity-50"} `}
            title="Delete Selected"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            onClick={clearCanvas}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-all"
            title="Clear All"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]">
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          ref={stageRef}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          draggable={tool === "select" && !selectedId}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDragEnd={(e) => {
            if (e.target === stageRef.current) {
              setPosition({ x: e.target.x(), y: e.target.y() });
            }
          }}
        >
          <Layer>
            {elements.map((el) => {
              if (el.type === "pencil") {
                return (
                  <Line
                    key={el.id}
                    id={el.id}
                    points={el.points}
                    stroke={el.stroke}
                    strokeWidth={el.strokeWidth}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    draggable={tool === "select"}
                    onClick={() => tool === "select" && setSelectedId(el.id)}
                    onDragEnd={(e) => {
                      handleElementChange(el.id, { x: e.target.x(), y: e.target.y() });
                    }}
                  />
                );
              }
              if (el.type === "rect") {
                return (
                  <Rect
                    key={el.id}
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    stroke={el.stroke}
                    strokeWidth={el.strokeWidth}
                    fill={el.fill}
                    draggable={tool === "select"}
                    onClick={() => tool === "select" && setSelectedId(el.id)}
                    onDragEnd={(e) => {
                      handleElementChange(el.id, { x: e.target.x(), y: e.target.y() });
                    }}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      handleElementChange(el.id, {
                        x: node.x(),
                        y: node.y(),
                        width: node.width() * node.scaleX(),
                        height: node.height() * node.scaleY(),
                      });
                      node.scaleX(1);
                      node.scaleY(1);
                    }}
                  />
                );
              }
              if (el.type === "circle") {
                return (
                  <Circle
                    key={el.id}
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    radius={el.radius}
                    stroke={el.stroke}
                    strokeWidth={el.strokeWidth}
                    fill={el.fill}
                    draggable={tool === "select"}
                    onClick={() => tool === "select" && setSelectedId(el.id)}
                    onDragEnd={(e) => {
                      handleElementChange(el.id, { x: e.target.x(), y: e.target.y() });
                    }}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      const scaleX = node.scaleX();
                      handleElementChange(el.id, {
                        x: node.x(),
                        y: node.y(),
                        radius: (node as any).radius() * scaleX,
                      });
                      node.scaleX(1);
                      node.scaleY(1);
                    }}
                  />
                );
              }
              if (el.type === "text") {
                return (
                  <Text
                    key={el.id}
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    text={el.text}
                    fill={el.fill}
                    fontSize={20}
                    fontFamily="Inter"
                    draggable={tool === "select"}
                    onClick={() => tool === "select" && setSelectedId(el.id)}
                    onDragEnd={(e) => {
                      handleElementChange(el.id, { x: e.target.x(), y: e.target.y() });
                    }}
                  />
                );
              }
              if (el.type === "image") {
                return (
                  <URLImage
                    key={el.id}
                    element={el}
                    isSelected={el.id === selectedId}
                    onSelect={() => tool === "select" && setSelectedId(el.id)}
                    onChange={(newAttrs) => handleElementChange(el.id, newAttrs)}
                  />
                );
              }
              return null;
            })}
            {tool === "select" && <Transformer ref={transformerRef} />}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

const ToolButton = ({ active, onClick, icon, title, theme: t }: any) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg transition-all ${
      active 
        ? `${t.accentBg} text-white shadow-lg` 
        : `text-slate-400 hover:bg-slate-800`
    }`}
    title={title}
  >
    {icon}
  </button>
);
