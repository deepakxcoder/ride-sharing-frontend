import { useState, useRef, useEffect } from "react";

export default function SlideToComplete({ canCompleteRide = true, onComplete }) {
  const [sliderX, setSliderX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const trackRef = useRef(null);
  const startXRef = useRef(null);
  const currentXRef = useRef(0);

  const THUMB_SIZE = 56;
  const PADDING = 4;

  const getTrackWidth = () =>
    trackRef.current ? trackRef.current.clientWidth : 300;

  const getMaxSlide = () => getTrackWidth() - THUMB_SIZE - PADDING * 2;

  // Mouse events
  const handleMouseDown = (e) => {
    if (!canCompleteRide || completed) return;
    setIsDragging(true);
    startXRef.current = e.clientX - currentXRef.current;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = Math.max(0, Math.min(e.clientX - startXRef.current, getMaxSlide()));
    currentXRef.current = newX;
    setSliderX(newX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const max = getMaxSlide();
    if (currentXRef.current >= max * 0.88) {
      triggerComplete();
    } else {
      snapBack();
    }
  };

  // Touch events
  const handleTouchStart = (e) => {
    if (!canCompleteRide || completed) return;
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX - currentXRef.current;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const newX = Math.max(0, Math.min(e.touches[0].clientX - startXRef.current, getMaxSlide()));
    currentXRef.current = newX;
    setSliderX(newX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const max = getMaxSlide();
    if (currentXRef.current >= max * 0.88) {
      triggerComplete();
    } else {
      snapBack();
    }
  };

  const snapBack = () => {
    setIsAnimating(true);
    setSliderX(0);
    currentXRef.current = 0;
    setTimeout(() => setIsAnimating(false), 350);
  };

  const triggerComplete = () => {
    const max = getMaxSlide();
    setSliderX(max);
    currentXRef.current = max;
    setIsAnimating(true);
    setTimeout(() => {
      setCompleted(true);
      setIsAnimating(false);
      onComplete?.();
    }, 300);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const progress = getTrackWidth() > 0 ? sliderX / getMaxSlide() : 0;

  return (
    <div className="mt-3">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');

        .slide-track {
          font-family: 'DM Sans', sans-serif;
          position: relative;
          height: 68px;
          border-radius: 999px;
          overflow: hidden;
          user-select: none;
          -webkit-user-select: none;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.6);
        }

        .slide-track-bg {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          transition: background 0.4s ease;
        }

        .slide-progress-fill {
          position: absolute;
          top: 0; left: 0; bottom: 0;
          border-radius: 999px;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .slide-label {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.01em;
          pointer-events: none;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .slide-thumb {
          position: absolute;
          top: 6px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          z-index: 10;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.15);
          transition: box-shadow 0.2s ease;
        }

        .slide-thumb:active { cursor: grabbing; }

        .slide-thumb.snapping {
          transition: left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease, box-shadow 0.2s ease;
        }

        .slide-thumb.completing {
          transition: left 0.3s ease, background 0.3s ease, box-shadow 0.2s ease;
        }

        .slide-thumb.completed-pos {
          box-shadow: 0 4px 20px rgba(34, 197, 94, 0.45), 0 1px 4px rgba(0,0,0,0.15);
        }

        .thumb-icon {
          font-size: 20px;
          line-height: 1;
          transition: transform 0.3s ease, opacity 0.2s ease;
        }

        .completed-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          animation: popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .check-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .shimmer-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%);
          border-radius: 999px;
          animation: shimmer 2s ease-in-out infinite;
          pointer-events: none;
        }

        .disabled-lock {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 2px;
        }
      `}</style>

      {!canCompleteRide ? (
        /* DISABLED STATE */
        <div
          className="slide-track"
          style={{ background: "#e5e7eb" }}
        >
          <div className="disabled-lock">
            <span style={{ fontSize: 22 }}>📍</span>
            <span style={{
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              color: "#9ca3af",
              letterSpacing: "0.01em"
            }}>
              Move within 200m of destination
            </span>
          </div>
        </div>
      ) : completed ? (
        /* COMPLETED STATE */
        <div
          className="slide-track"
          style={{ background: "linear-gradient(135deg, #16a34a 0%, #22c55e 60%, #4ade80 100%)" }}
        >
          <div className="slide-label" style={{ color: "#fff" }}>
            <div className="completed-badge">
              <div className="check-circle">✓</div>
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.02em" }}>
                Ride Completed!
              </span>
              <span style={{ fontSize: 20 }}>🎉</span>
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVE SLIDE STATE */
        <div
          ref={trackRef}
          className="slide-track"
          style={{ background: "#1f2937" }}
          onTouchMove={(e) => e.preventDefault()}
        >
          {/* Progress fill */}
          <div
            className="slide-progress-fill"
            style={{
              width: `${PADDING + THUMB_SIZE + sliderX}px`,
              background: `linear-gradient(90deg, #16a34a, #22c55e)`,
              opacity: progress > 0.05 ? 1 : 0,
            }}
          />

          {/* Shimmer on track */}
          {!isDragging && <div className="shimmer-overlay" />}

          {/* Label */}
          <div
            className="slide-label"
            style={{
              color: progress > 0.5 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)",
              opacity: 1 - progress * 0.7,
              transform: `translateX(${progress * 16}px)`,
            }}
          >
            <span style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Slide to Complete Ride &nbsp;→
            </span>
          </div>

          {/* Thumb */}
          <div
            className={`slide-thumb ${isAnimating && !completed ? (currentXRef.current === 0 ? "snapping" : "completing") : ""} ${completed ? "completed-pos" : ""}`}
            style={{
              left: `${PADDING + sliderX}px`,
              background: progress > 0.5
                ? `linear-gradient(135deg, #16a34a, #22c55e)`
                : "#fff",
              color: progress > 0.5 ? "#fff" : "#111",
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <span
              className="thumb-icon"
              style={{
                transform: isDragging ? "scale(1.15)" : "scale(1)",
                opacity: isDragging ? 0.85 : 1,
              }}
            >
              {progress > 0.7 ? "✓" : "›"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
