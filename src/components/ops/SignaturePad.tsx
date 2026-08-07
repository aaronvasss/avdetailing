import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

interface Props {
  value?: string | null;
  onSave: (dataUrl: string) => void | Promise<void>;
  disabled?: boolean;
}

/** Finger/stylus signature pad sized for iPads and phones. */
export function SignaturePad({ value, onSave, disabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = getComputedStyle(canvas).color;
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawingRef.current = true;
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  };

  const end = () => {
    drawingRef.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      await onSave(canvas.toDataURL("image/png"));
    } finally {
      setSaving(false);
    }
  };

  if (value) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border bg-card p-3">
          <img src={value} alt="Technician signature" className="h-24 object-contain" />
        </div>
        {!disabled && (
          <Button type="button" variant="outline" size="sm" onClick={() => onSave("")}>
            <Eraser className="mr-2 h-4 w-4" />
            Sign again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="h-36 w-full touch-none rounded-lg border-2 border-dashed bg-card text-foreground"
      />
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={clear}>
          Clear
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          disabled={!hasInk || saving || disabled}
          onClick={save}
        >
          {saving ? "Saving..." : "Save signature"}
        </Button>
      </div>
    </div>
  );
}
