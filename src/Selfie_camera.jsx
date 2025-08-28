import React, { useRef, useState, useEffect } from "react";

const SelfieCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [streaming, setStreaming] = useState(false);
  const [flash, setFlash] = useState(false);
  const [shutterPulse, setShutterPulse] = useState(false);
  const [capturedData, setCapturedData] = useState(null);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStreaming(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const playShutterSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = 1000;
      g.gain.value = 0.12;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 90);
    } catch (e) {}
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);

    const data = canvas.toDataURL("image/png");
    setCapturedData(data);

    setFlash(true);
    setShutterPulse(true);
    playShutterSound();
    setTimeout(() => setFlash(false), 220);
    setTimeout(() => setShutterPulse(false), 300);
  };

  const downloadPhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "retro-selfie.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-back via-gray-900 to-black-900 p-6">
      <style>{`
        .camera-card { width: 680px; max-width: 95%; border-radius: 18px; }
        @keyframes lens-reflect {
          0% { transform: translateX(-120%) rotate(15deg); opacity: 0; }
          50% { transform: translateX(20%) rotate(15deg); opacity: 0.35; }
          100% { transform: translateX(120%) rotate(15deg); opacity: 0; }
        }
        @keyframes shutter-pulse {
          0% { transform: scale(1); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          50% { transform: scale(0.96); box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
          100% { transform: scale(1); }
        }
        .reflect-anim::after {
          content: ''; position: absolute; left: -40%; top: -30%;
          width: 60%; height: 160%; background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0) 100%);
          transform: rotate(15deg);
          animation: lens-reflect 3.5s linear infinite;
          pointer-events: none;
        }
        .shutter-animate { animation: shutter-pulse 220ms ease-in-out; }
        .flash { position: fixed; inset:0; background: white; opacity: 0; pointer-events: none; z-index: 60; transition: opacity 220ms ease-out; }
        .flash.show { opacity: 0.92; }
      `}</style>

      <div className={`flash ${flash ? "show" : ""}`} aria-hidden />

      <div className="camera-card relative grid grid-cols-[80px_1fr_80px] bg-gradient-to-r from-gray-900 via-white to-gray-100 shadow-[0_10px_40px_rgba(2,6,23,0.8)] p-5 border-2 border-black">
        {/* Left pastel knob */}
        <div className="flex flex-col gap-4 items-center justify-start">
          <div className="w-12 h-12 rounded-full bg-white border-2 border-black shadow-inner flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-red-700 border ring-1 ring-black" />
          </div>
          <div className="w-4 h-28 rounded-lg bg-gray-200 border border-black/20" />
        </div>

        {/* Lens & controls */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-full flex justify-between items-center">
            <div className="text-lg tracking-widest text-black/70 font-semibold">KODAK</div>
            <div className="text-xs text-black/70">v1.0</div>
          </div>

          <div className={`relative w-[320px] h-[320px] rounded-full bg-black flex items-center justify-center ${shutterPulse ? "shutter-animate" : ""}`}>
            <div className="absolute inset-0 rounded-full border-8 border-gray-800 shadow-[inset_0_8px_18px_rgba(0,0,0,0.6)]" />
            <div className="absolute inset-[10px] rounded-full bg-gradient-to-b from-gray-900 via-black to-gray-800" />
            <div className="absolute w-[86%] h-[86%] rounded-full overflow-hidden border-4 border-black bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 rounded-full mix-blend-screen opacity-30 reflect-anim" />
            </div>
            <div className="absolute -top-3 left-6 w-3 h-3 rounded-full bg-mint-300 shadow-sm ring-1 ring-black" />
          </div>

          <div className="text-sm text-black/80 font-medium tracking-wide">Pastel Retro Selfie</div>

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={openCamera}
              className="px-4 py-2 rounded-full bg-black text-white font-medium shadow-md hover:bg-gray-800 transition"
            >
              {streaming ? "Camera On" : "Open"}
            </button>

            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition"
            >
              <div className="w-12 h-12 rounded-full bg-red-700 border-2 border-black flex items-center justify-center" />
            </button>

            <button
              onClick={downloadPhoto}
              className="px-4 py-2 rounded-full bg-black text-white font-medium shadow-md hover:bg-gray-800 transition"
            >
              Save
            </button>

            <button
              onClick={stopCamera}
              className="px-3 py-2 rounded-full border border-black bg-white text-black hover:bg-gray-100 transition"
            >
              Stop
            </button>
          </div>
        </div>

        {/* Right pastel knob */}
        <div className="flex flex-col gap-4 items-center justify-start">
          <div className="w-14 h-14 rounded-full bg-black ring-2 ring-black flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-mint-200 ring-1 ring-black" />
          </div>
          <div className="w-4 h-20 rounded-lg bg-gray-200 border border-black/20" />
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {capturedData && (
        <div className="mt-6 ml-6 max-w-xs p-3 bg-white/10 rounded-xl border border-black/20">
          <div className="text-xs text-gray-200 mb-2">Captured</div>
          <img src={capturedData} alt="captured" className="rounded-md w-56 h-auto object-cover border border-black/30 shadow-sm" />
        </div>
      )}
    </div>
  );
};

export default SelfieCamera;
