import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketProvider";

const Canvas = ({ roomId }) => {
  const socket = useSocket();
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const lastXRef = useRef(null);
  const lastYRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.8; // Ensure proper width
    canvas.height = window.innerHeight * 0.8; // Ensure proper height
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "black"; // Line color
    ctx.lineWidth = 3; // Line width
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctxRef.current = ctx;

    console.log(socket)
    // ✅ Listen for drawing events from the server
    socket.on("drawing", ({ x, y, prevX, prevY }) => {
      console.log("Received drawing data:", { x, y, prevX, prevY });
      if (!ctxRef.current) return;

      const ctx = ctxRef.current;
      if (prevX !== null && prevY !== null) {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    });

    return () => {
      socket.off("drawing"); // Ensure clean up on unmount
    };
  }, [socket]);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    lastXRef.current = offsetX;
    lastYRef.current = offsetY;
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;
    const { offsetX: x, offsetY: y } = e.nativeEvent;
    const ctx = ctxRef.current;

    // ✅ Emit "drawing" event (Fixed event name)
    socket.emit("drawing", { roomId, x, y, prevX: lastXRef.current, prevY: lastYRef.current });

    // ✅ Draw locally
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

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      className="border-2 border-black cursor-crosshair bg-white w-full h-full"
    />
  );
};

export default Canvas;
