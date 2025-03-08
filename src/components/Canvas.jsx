import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketProvider";

const Canvas = ({ roomId }) => {
  const socket = useSocket();
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false); // Eraser mode state
  const lastXRef = useRef(null);
  const lastYRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctxRef.current = ctx;

    // Listen for drawing events from the server
    socket.on("drawing", ({ x, y, prevX, prevY, erase }) => {
      if (!ctxRef.current) return;
      const ctx = ctxRef.current;

      ctx.strokeStyle = erase ? "white" : "black"; // Erase by drawing white
      ctx.lineWidth = erase ? 20 : 3;

      if (prevX !== null && prevY !== null) {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    });

    return () => {
      socket.off("drawing");
    };
  }, [socket]);

  const getCursorPosition = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    const { x, y } = getCursorPosition(e);
    lastXRef.current = x;
    lastYRef.current = y;
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;
    const { x, y } = getCursorPosition(e);
    const ctx = ctxRef.current;

    // Emit "drawing" event with erase flag
    socket.emit("drawing", { roomId, x, y, prevX: lastXRef.current, prevY: lastYRef.current, erase: isErasing });

    // Draw locally
    ctx.strokeStyle = isErasing ? "white" : "black";
    ctx.lineWidth = isErasing ? 20 : 3;

    if (lastXRef.current !== null && lastYRef.current !== null) {
      ctx.beginPath();
      ctx.moveTo(lastXRef.current, lastYRef.current);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    lastXRef.current = x;
    lastYRef.current = y;
  };

  const stopDrawing = () => {
    setDrawing(false);
    lastXRef.current = null;
    lastYRef.current = null;
  };

  // Toggle eraser
  const toggleEraser = () => setIsErasing(!isErasing);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "e" || e.key === "E") setIsErasing(true);
      if (e.key === "d" || e.key === "D") setIsErasing(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col items-center border-2 w-full h-full overflow-hidden">
      <button
        onClick={toggleEraser}
        className={`px-4 py-2 mb-2 text-white ${isErasing ? "bg-red-600" : "bg-blue-600"} rounded`}
      >
        {isErasing ? "Switch to Draw Mode" : "Switch to Erase Mode"}
      </button>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onContextMenu={(e) => {
          e.preventDefault();
          toggleEraser();
        }}
        className="border-2 border-black cursor-crosshair bg-white"
      />
    </div>
  );
};

export default Canvas;
