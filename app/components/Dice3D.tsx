"use client";

import { useEffect, useRef, useCallback } from "react";

interface DiceProps {
  size: number;
  top: string;
  left: string;
  delay: number;
  duration: number;
  opacity: number;
  color: string;
}

function DiceFace({ dots, color, transform, size }: { dots: number; color: string; transform: string; size: number }) {
  const dotPositions: Record<number, [number, number][]> = {
    1: [[50, 50]], 2: [[25, 25], [75, 75]], 3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]], 5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
  };
  const positions = dotPositions[dots] || dotPositions[1];
  const dotSize = Math.max(size * 0.12, 3);

  return (
    <div className="absolute inset-0" style={{ transform, backfaceVisibility: "hidden" }}>
      <div className="w-full h-full rounded-[16%] relative" style={{
        background: `linear-gradient(135deg, ${color}12 0%, ${color}06 100%)`,
        border: `1px solid ${color}30`,
        boxShadow: `inset 0 0 ${size * 0.2}px ${color}10, 0 0 ${size * 0.5}px ${color}08`,
      }}>
        {positions.map(([x, y], i) => (
          <div key={i} className="absolute rounded-full" style={{
            width: dotSize, height: dotSize, left: `${x}%`, top: `${y}%`,
            transform: "translate(-50%, -50%)", backgroundColor: `${color}90`,
            boxShadow: `0 0 ${dotSize * 2}px ${color}50`,
          }} />
        ))}
      </div>
    </div>
  );
}

function SingleDice({ size, top, left, delay, duration, opacity, color }: DiceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    autoRotX: 0, autoRotY: 0, autoRotZ: 0, autoFloatY: 0,
    dragRotX: 0, dragRotY: 0, dragging: false,
    dragStartX: 0, dragStartY: 0, manualRotX: 0, manualRotY: 0,
  });

  const applyTransform = useCallback(() => {
    const el = ref.current; if (!el) return;
    const s = stateRef.current;
    el.style.transform = `translateY(${s.autoFloatY}px) rotateX(${s.autoRotX + s.manualRotX + s.dragRotX}deg) rotateY(${s.autoRotY + s.manualRotY + s.dragRotY}deg) rotateZ(${s.autoRotZ}deg)`;
  }, []);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    let frame: number, start: number | null = null;
    const animate = (time: number) => {
      if (!start) start = time;
      const elapsed = ((time - start) / 1000 + delay) % duration;
      const progress = elapsed / duration;
      const s = stateRef.current;
      s.autoRotX = progress * 360 + Math.sin(progress * Math.PI * 2) * 15;
      s.autoRotY = progress * 540 + Math.cos(progress * Math.PI * 3) * 10;
      s.autoRotZ = Math.sin(progress * Math.PI * 4) * 8;
      s.autoFloatY = Math.sin(progress * Math.PI * 2) * 30;
      if (!s.dragging) {
        s.manualRotX *= 0.97; s.manualRotY *= 0.97;
        if (Math.abs(s.manualRotX) < 0.1) s.manualRotX = 0;
        if (Math.abs(s.manualRotY) < 0.1) s.manualRotY = 0;
      }
      applyTransform();
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [delay, duration, applyTransform]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const s = stateRef.current;
    s.dragging = true; s.dragStartX = e.clientX; s.dragStartY = e.clientY;
    s.dragRotX = 0; s.dragRotY = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const s = stateRef.current; if (!s.dragging) return;
    s.dragRotY = (e.clientX - s.dragStartX) * 1.2;
    s.dragRotX = -(e.clientY - s.dragStartY) * 1.2;
  }, []);
  const handlePointerUp = useCallback(() => {
    const s = stateRef.current; if (!s.dragging) return;
    s.dragging = false; s.manualRotX += s.dragRotX; s.manualRotY += s.dragRotY;
    s.dragRotX = 0; s.dragRotY = 0;
  }, []);

  const half = size / 2;
  return (
    <div className="absolute cursor-grab active:cursor-grabbing"
      style={{ top, left, width: size, height: size, opacity, perspective: size * 4, touchAction: "none" }}
      onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
      <div ref={ref} style={{ width: size, height: size, position: "relative", transformStyle: "preserve-3d" }}>
        <DiceFace dots={1} color={color} size={size} transform={`translateZ(${half}px)`} />
        <DiceFace dots={6} color={color} size={size} transform={`rotateY(180deg) translateZ(${half}px)`} />
        <DiceFace dots={3} color={color} size={size} transform={`rotateY(90deg) translateZ(${half}px)`} />
        <DiceFace dots={4} color={color} size={size} transform={`rotateY(-90deg) translateZ(${half}px)`} />
        <DiceFace dots={2} color={color} size={size} transform={`rotateX(90deg) translateZ(${half}px)`} />
        <DiceFace dots={5} color={color} size={size} transform={`rotateX(-90deg) translateZ(${half}px)`} />
      </div>
    </div>
  );
}

export default function FloatingDice() {
  const dice: DiceProps[] = [
    { size: 62, top: "10%", left: "6%", delay: 0, duration: 18, opacity: 0.6, color: "#00d4ff" },
    { size: 55, top: "18%", left: "87%", delay: 3, duration: 22, opacity: 0.5, color: "#a855f7" },
    { size: 50, top: "60%", left: "9%", delay: 6, duration: 20, opacity: 0.4, color: "#ec4899" },
    { size: 58, top: "52%", left: "90%", delay: 2, duration: 25, opacity: 0.5, color: "#00d4ff" },
    { size: 42, top: "5%", left: "68%", delay: 5, duration: 16, opacity: 0.4, color: "#a855f7" },
    { size: 44, top: "80%", left: "78%", delay: 8, duration: 19, opacity: 0.4, color: "#00d4ff" },
    { size: 38, top: "38%", left: "3%", delay: 4, duration: 21, opacity: 0.35, color: "#ec4899" },
    { size: 40, top: "88%", left: "25%", delay: 7, duration: 17, opacity: 0.35, color: "#a855f7" },
    { size: 36, top: "12%", left: "35%", delay: 1, duration: 23, opacity: 0.3, color: "#00d4ff" },
    { size: 42, top: "72%", left: "45%", delay: 9, duration: 20, opacity: 0.35, color: "#a855f7" },
    { size: 28, top: "30%", left: "92%", delay: 2.5, duration: 15, opacity: 0.3, color: "#ec4899" },
    { size: 26, top: "48%", left: "18%", delay: 5.5, duration: 19, opacity: 0.25, color: "#00d4ff" },
    { size: 24, top: "6%", left: "52%", delay: 8.5, duration: 14, opacity: 0.2, color: "#a855f7" },
    { size: 32, top: "85%", left: "10%", delay: 4.5, duration: 17, opacity: 0.28, color: "#00d4ff" },
    { size: 25, top: "42%", left: "75%", delay: 7.5, duration: 21, opacity: 0.22, color: "#ec4899" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {dice.map((d, i) => <SingleDice key={i} {...d} />)}
    </div>
  );
}
