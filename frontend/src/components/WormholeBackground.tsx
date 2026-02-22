"use client";

import React, { useEffect, useRef } from "react";

export function WormholeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let w: number, h: number;
    
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);
    resize();

    // Wormhole properties
    const lines: { angle: number; speed: number; offset: number }[] = [];
    const lineCount = 120; // Increased density
    for (let i = 0; i < lineCount; i++) {
      lines.push({
        angle: (i / lineCount) * Math.PI * 2,
        speed: 0.002 + Math.random() * 0.004,
        offset: Math.random() * 100
      });
    }

    // Perspective Rings
    const rings: { r: number; opacity: number }[] = [];
    for (let i = 0; i < 15; i++) {
        rings.push({ r: Math.pow(1.5, i) * 10, opacity: 0 });
    }

    let time = 0;
    const render = () => {
      time += 0.01;
      
      // Clear with slight alpha for motion blur
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, w, h);

      // CENTER SWAY LOGIC
      const swayX = Math.sin(time * 0.5) * 40;
      const swayY = Math.cos(time * 0.3) * 30;
      const cx = w / 2 + swayX;
      const cy = h / 2 + swayY;
      
      const maxRadius = Math.max(w, h);

      // 1. Draw ZOOMING Rings
      rings.forEach((ring, i) => {
        // Grow rings to simulate forward movement
        ring.r *= 1.02; 
        if (ring.r > maxRadius) {
            ring.r = 10; // Reset to center
        }

        // Fade in/out based on distance from center
        const opacity = Math.min(0.2, (ring.r / maxRadius) * 0.5);
        
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 194, 255, ${opacity})`;
        ctx.lineWidth = 1 + (ring.r / maxRadius) * 2;
        ctx.stroke();
      });

      // 2. Draw Perspective Rays (Wormhole Walls)
      lines.forEach((line) => {
        line.offset += line.speed * 50;
        if (line.offset > 100) line.offset = 0;

        const x1 = cx + Math.cos(line.angle) * 5;
        const y1 = cy + Math.sin(line.angle) * 5;
        const x2 = cx + Math.cos(line.angle) * maxRadius;
        const y2 = cy + Math.sin(line.angle) * maxRadius;

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, "rgba(0, 194, 255, 0)");
        gradient.addColorStop(0.2, "rgba(0, 194, 255, 0.1)");
        gradient.addColorStop(1, "rgba(0, 194, 255, 0)");

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // 3. Center Glow (The "Mouth" of the wormhole)
      const radialGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
      radialGradient.addColorStop(0, "rgba(0, 0, 0, 1)");
      radialGradient.addColorStop(1, "rgba(0, 194, 255, 0)");
      ctx.fillStyle = radialGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 100, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none opacity-50"
      style={{ filter: "blur(0.5px)" }}
    />
  );
}
