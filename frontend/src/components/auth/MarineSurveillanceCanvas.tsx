import React, { useEffect, useRef } from "react";
import type { UserRole } from "../../types/auth";

interface MarineSurveillanceCanvasProps {
  role: UserRole;
}

interface VesselSim {
  id: string;
  name: string;
  mmsi: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  speed: number;
  angle: number;
  pathOffset: number;
  trajectory: Array<{ x: number; y: number }>;
  isCandidate: boolean;
  highlightTimer: number;
  pulseTimer: number;
}

export const MarineSurveillanceCanvas: React.FC<MarineSurveillanceCanvasProps> = ({ role }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Simulation state
    let radarAngle = 0;
    let satelliteBeamX = width * 0.2;
    let satelliteDir = 1;
    let spillPhase = 0; // 0 to 1 for oil slick scan cycle
    let waveTime = 0;

    // Vessels
    const vessels: VesselSim[] = [
      {
        id: "v1",
        name: "MT Ocean Splendor",
        mmsi: "419001842",
        x: width * 0.25,
        y: height * 0.42,
        baseX: width * 0.25,
        baseY: height * 0.42,
        speed: 0.25,
        angle: 0.35,
        pathOffset: 0,
        trajectory: [],
        isCandidate: true,
        highlightTimer: 0,
        pulseTimer: 0,
      },
      {
        id: "v2",
        name: "MV Eastern Chemist",
        mmsi: "563098710",
        x: width * 0.72,
        y: height * 0.28,
        baseX: width * 0.72,
        baseY: height * 0.28,
        speed: 0.2,
        angle: -0.25,
        pathOffset: 0,
        trajectory: [],
        isCandidate: false,
        highlightTimer: 0,
        pulseTimer: 0,
      },
      {
        id: "v3",
        name: "Bharat Samudra",
        mmsi: "419003889",
        x: width * 0.82,
        y: height * 0.65,
        baseX: width * 0.82,
        baseY: height * 0.65,
        speed: 0.18,
        angle: -0.85,
        pathOffset: 0,
        trajectory: [],
        isCandidate: true,
        highlightTimer: 0,
        pulseTimer: 0,
      },
      {
        id: "v4",
        name: "Coastal Patrol CG-201",
        mmsi: "419000001",
        x: width * 0.18,
        y: height * 0.75,
        baseX: width * 0.18,
        baseY: height * 0.75,
        speed: 0.35,
        angle: 0.6,
        pathOffset: 0,
        trajectory: [],
        isCandidate: false,
        highlightTimer: 0,
        pulseTimer: 0,
      },
    ];

    // Initialize trajectories
    vessels.forEach((v) => {
      v.trajectory = [];
      for (let i = 20; i >= 0; i--) {
        const dist = i * 14;
        v.trajectory.push({
          x: v.x - Math.cos(v.angle) * dist + Math.sin(i * 0.2) * 5,
          y: v.y - Math.sin(v.angle) * dist + Math.cos(i * 0.2) * 5,
        });
      }
    });

    // Radar Center (anchored in top-right or center-right surveillance sector)
    const radarCenter = { x: width * 0.8, y: height * 0.4 };
    const radarRadius = Math.min(width, height) * 0.42;

    // Oil Slick polygon centroid (near center-left)
    const slickCentroid = { x: width * 0.3, y: height * 0.5 };

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // ── 1. Dark Professional Ocean Base Gradient ────────────────────────
      const oceanGrad = ctx.createLinearGradient(0, 0, width, height);
      if (role === "admin") {
        oceanGrad.addColorStop(0, "#010d1a");
        oceanGrad.addColorStop(0.5, "#021629");
        oceanGrad.addColorStop(1, "#000814");
      } else {
        oceanGrad.addColorStop(0, "#031526");
        oceanGrad.addColorStop(0.5, "#06223d");
        oceanGrad.addColorStop(1, "#020f1c");
      }
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, width, height);

      // ── 2. Subtle Moving Ocean Wave Currents ─────────────────────────────
      if (!prefersReducedMotion) {
        waveTime += dt * 0.8;
      }
      ctx.strokeStyle = role === "admin" ? "rgba(0, 243, 255, 0.04)" : "rgba(34, 197, 94, 0.04)";
      ctx.lineWidth = 1.5;
      for (let w = 0; w < 6; w++) {
        ctx.beginPath();
        const yOffset = height * (0.15 + w * 0.16);
        ctx.moveTo(0, yOffset);
        for (let x = 0; x <= width; x += 40) {
          const y = yOffset + Math.sin(x * 0.005 + waveTime + w) * 12 + Math.cos(x * 0.002 - waveTime * 0.5) * 8;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // ── 3. Faint Maritime GIS Lat/Long Grid & Coastline Contours ─────────
      ctx.strokeStyle = "rgba(0, 243, 255, 0.06)";
      ctx.lineWidth = 1;
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(0, 243, 255, 0.25)";

      const gridSpacingX = 140;
      const gridSpacingY = 120;

      for (let x = gridSpacingX; x < width; x += gridSpacingX) {
        ctx.beginPath();
        ctx.setLineDash([3, 6]);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        const lonDeg = (78 + (x / width) * 8).toFixed(1);
        ctx.fillText(`${lonDeg}°E`, x + 4, 18);
      }

      for (let y = gridSpacingY; y < height; y += gridSpacingY) {
        ctx.beginPath();
        ctx.setLineDash([3, 6]);
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        const latDeg = (18 - (y / height) * 8).toFixed(1);
        ctx.fillText(`${latDeg}°N`, 12, y - 4);
      }
      ctx.setLineDash([]); // Reset line dash

      // Shipping Fairway Corridors (curved maritime map lines)
      ctx.strokeStyle = "rgba(0, 243, 255, 0.09)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(width * 0.1, height * 0.2);
      ctx.bezierCurveTo(width * 0.4, height * 0.35, width * 0.6, height * 0.55, width * 0.95, height * 0.7);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(width * 0.05, height * 0.8);
      ctx.bezierCurveTo(width * 0.35, height * 0.75, width * 0.55, height * 0.45, width * 0.85, height * 0.15);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── 4. Maritime Radar Sweep (Subtle & Elegant) ───────────────────────
      if (!prefersReducedMotion) {
        radarAngle = (radarAngle + dt * 0.6) % (Math.PI * 2);
      }

      // Radar Concentric Range Rings
      ctx.strokeStyle = "rgba(0, 243, 255, 0.08)";
      ctx.lineWidth = 1;
      [0.33, 0.66, 1.0].forEach((ratio) => {
        ctx.beginPath();
        ctx.arc(radarCenter.x, radarCenter.y, radarRadius * ratio, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Radar sweep cone
      const sweepGradient = ctx.createConicGradient(radarAngle, radarCenter.x, radarCenter.y);
      sweepGradient.addColorStop(0, "rgba(0, 243, 255, 0.15)");
      sweepGradient.addColorStop(0.12, "rgba(0, 243, 255, 0.03)");
      sweepGradient.addColorStop(0.25, "transparent");
      sweepGradient.addColorStop(1, "transparent");

      ctx.fillStyle = sweepGradient;
      ctx.beginPath();
      ctx.arc(radarCenter.x, radarCenter.y, radarRadius, 0, Math.PI * 2);
      ctx.fill();

      // Sweep leading beam
      ctx.strokeStyle = "rgba(0, 243, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(radarCenter.x, radarCenter.y);
      ctx.lineTo(
        radarCenter.x + Math.cos(radarAngle) * radarRadius,
        radarCenter.y + Math.sin(radarAngle) * radarRadius
      );
      ctx.stroke();

      // ── 5. Satellite Scanning Beam (Admin Mode / Periodic Pass) ───────────
      if (!prefersReducedMotion) {
        satelliteBeamX += dt * 35 * satelliteDir;
        if (satelliteBeamX > width * 0.85) satelliteDir = -1;
        if (satelliteBeamX < width * 0.15) satelliteDir = 1;
      }

      if (role === "admin") {
        // Satellite Ground Trace & Overhead Sensor
        const beamWidth = 140;
        const satGrad = ctx.createLinearGradient(0, 0, 0, height);
        satGrad.addColorStop(0, "rgba(0, 243, 255, 0.3)");
        satGrad.addColorStop(0.4, "rgba(0, 243, 255, 0.07)");
        satGrad.addColorStop(1, "rgba(0, 243, 255, 0.01)");

        ctx.fillStyle = satGrad;
        ctx.beginPath();
        ctx.moveTo(satelliteBeamX - 15, 0);
        ctx.lineTo(satelliteBeamX + 15, 0);
        ctx.lineTo(satelliteBeamX + beamWidth * 0.7, height);
        ctx.lineTo(satelliteBeamX - beamWidth * 0.7, height);
        ctx.closePath();
        ctx.fill();

        // Satellite scanning line across ocean
        ctx.strokeStyle = "rgba(0, 243, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(satelliteBeamX - beamWidth * 0.7, height * 0.55);
        ctx.lineTo(satelliteBeamX + beamWidth * 0.7, height * 0.55);
        ctx.stroke();

        // Overhead satellite marker
        ctx.fillStyle = "#00f3ff";
        ctx.fillRect(satelliteBeamX - 6, 8, 12, 5);
        ctx.fillRect(satelliteBeamX - 14, 9, 6, 3);
        ctx.fillRect(satelliteBeamX + 8, 9, 6, 3);
        ctx.font = "8px 'JetBrains Mono', monospace";
        ctx.fillText("SENTINEL-1 SAR PASS [C-BAND]", satelliteBeamX - 55, 26);
      }

      // ── 6. Oil-Spill Detection Animation (Admin Mode + Citizen Spill Highlight) ──
      spillPhase = (spillPhase + dt * 0.25) % 1.0;

      // Realistic Oil Slick Polygon Coordinates
      const slickPoints = [
        { dx: -55, dy: -25 },
        { dx: -20, dy: -45 },
        { dx: 35, dy: -35 },
        { dx: 65, dy: -5 },
        { dx: 50, dy: 35 },
        { dx: 15, dy: 45 },
        { dx: -35, dy: 30 },
      ];

      // Draw dark hydrocarbon anomaly
      ctx.beginPath();
      slickPoints.forEach((p, idx) => {
        const px = slickCentroid.x + p.dx + Math.sin(waveTime + idx) * 3;
        const py = slickCentroid.y + p.dy + Math.cos(waveTime + idx) * 3;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();

      // Slick internal color (dark iridescent sheen)
      const slickGrad = ctx.createRadialGradient(
        slickCentroid.x,
        slickCentroid.y,
        5,
        slickCentroid.x,
        slickCentroid.y,
        70
      );
      slickGrad.addColorStop(0, "rgba(5, 12, 20, 0.85)");
      slickGrad.addColorStop(0.6, "rgba(10, 25, 38, 0.75)");
      slickGrad.addColorStop(1, "rgba(0, 243, 255, 0.08)");
      ctx.fillStyle = slickGrad;
      ctx.fill();

      // Detection Boundary outline
      const boundaryAlpha = 0.4 + 0.3 * Math.sin(spillPhase * Math.PI * 2);
      ctx.strokeStyle = role === "admin" ? `rgba(239, 68, 68, ${boundaryAlpha})` : `rgba(234, 179, 8, ${boundaryAlpha})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Scan Pulse Ring over spill
      const pulseRadius = 15 + spillPhase * 65;
      ctx.strokeStyle = `rgba(0, 243, 255, ${Math.max(0, 1 - spillPhase) * 0.5})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(slickCentroid.x, slickCentroid.y, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Spill Tag Indicator
      ctx.fillStyle = role === "admin" ? "#ef4444" : "#eab308";
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      const tagText = role === "admin" ? "AI DETECTED: 14.8 km² SLICK" : "INCIDENT REPORT ZONE #4";
      ctx.fillText(tagText, slickCentroid.x - 45, slickCentroid.y - 50);

      // Coordinate marker crosshair
      ctx.strokeStyle = "rgba(0, 243, 255, 0.4)";
      ctx.beginPath();
      ctx.moveTo(slickCentroid.x - 8, slickCentroid.y);
      ctx.lineTo(slickCentroid.x + 8, slickCentroid.y);
      ctx.moveTo(slickCentroid.x, slickCentroid.y - 8);
      ctx.lineTo(slickCentroid.x, slickCentroid.y + 8);
      ctx.stroke();

      // ── 7. AIS Vessel Movement & Tracking ─────────────────────────────────
      vessels.forEach((v) => {
        // Move vessel along trajectory
        if (!prefersReducedMotion) {
          v.x += Math.cos(v.angle) * v.speed;
          v.y += Math.sin(v.angle) * v.speed;

          // Wrap around edges cleanly
          if (v.x > width + 50) v.x = -30;
          if (v.x < -50) v.x = width + 30;
          if (v.y > height + 50) v.y = -30;
          if (v.y < -50) v.y = height + 30;

          // Push to history trajectory trail
          v.pathOffset += v.speed;
          if (v.pathOffset >= 10) {
            v.pathOffset = 0;
            v.trajectory.push({ x: v.x, y: v.y });
            if (v.trajectory.length > 25) v.trajectory.shift();
          }
        }

        // Draw Historical Trajectory Line
        if (v.trajectory.length > 1) {
          ctx.beginPath();
          ctx.moveTo(v.trajectory[0].x, v.trajectory[0].y);
          for (let i = 1; i < v.trajectory.length; i++) {
            ctx.lineTo(v.trajectory[i].x, v.trajectory[i].y);
          }
          ctx.strokeStyle = v.isCandidate && role === "admin" ? "rgba(239, 68, 68, 0.3)" : "rgba(0, 243, 255, 0.15)";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Distance from radar sweep for glow contact
        const dx = v.x - radarCenter.x;
        const dy = v.y - radarCenter.y;
        const distFromRadar = Math.hypot(dx, dy);
        let vesselAngle = Math.atan2(dy, dx);
        if (vesselAngle < 0) vesselAngle += Math.PI * 2;

        const angleDiff = Math.abs(radarAngle - vesselAngle);
        const isHitBySweep = distFromRadar <= radarRadius && (angleDiff < 0.15 || angleDiff > Math.PI * 2 - 0.15);

        if (isHitBySweep) {
          v.highlightTimer = 1.0;
        } else if (v.highlightTimer > 0) {
          v.highlightTimer -= dt * 1.5;
        }

        // AIS Signal Pulses ())) (((
        v.pulseTimer = (v.pulseTimer + dt * 1.2) % 1.0;
        if (v.isCandidate || v.highlightTimer > 0.3) {
          ctx.strokeStyle = v.isCandidate && role === "admin"
            ? `rgba(239, 68, 68, ${0.4 * (1 - v.pulseTimer)})`
            : `rgba(0, 243, 255, ${0.5 * (1 - v.pulseTimer)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(v.x, v.y, 8 + v.pulseTimer * 16, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Vessel Ship Icon (directional triangle)
        ctx.save();
        ctx.translate(v.x, v.y);
        ctx.rotate(v.angle);

        // Vessel glow when hit by radar
        if (v.highlightTimer > 0) {
          ctx.shadowColor = v.isCandidate && role === "admin" ? "#ef4444" : "#00f3ff";
          ctx.shadowBlur = 12 * v.highlightTimer;
        }

        ctx.fillStyle = v.isCandidate && role === "admin" ? "#ef4444" : "#00f3ff";
        ctx.beginPath();
        ctx.moveTo(8, 0); // Bow
        ctx.lineTo(-6, -4.5); // Port stern
        ctx.lineTo(-4, 0); // Transom notch
        ctx.lineTo(-6, 4.5); // Starboard stern
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Vessel telemetry label
        ctx.font = "8px 'JetBrains Mono', monospace";
        ctx.fillStyle = v.isCandidate && role === "admin" ? "rgba(239, 68, 68, 0.85)" : "rgba(0, 243, 255, 0.7)";
        ctx.fillText(v.name, v.x + 12, v.y - 4);
        ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
        ctx.fillText(`MMSI:${v.mmsi} [${(v.speed * 40).toFixed(1)}kn]`, v.x + 12, v.y + 6);
      });

      // ── 8. Mode-Specific Visual Overlays ──────────────────────────────────
      if (role === "citizen") {
        // Citizen focus: REPORT -> LOCATE -> ALERT
        // Draw coastal public alert pulses and community beacon
        const beaconX = width * 0.18;
        const beaconY = height * 0.32;

        const alertPulse = (time * 0.002) % 1;
        ctx.strokeStyle = `rgba(34, 197, 94, ${0.7 * (1 - alertPulse)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(beaconX, beaconY, 10 + alertPulse * 45, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(beaconX, beaconY, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "bold 10px 'JetBrains Mono', monospace";
        ctx.fillText("CITIZEN REPORT LOCATOR", beaconX + 12, beaconY - 2);
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.fillStyle = "rgba(203, 213, 225, 0.75)";
        ctx.fillText("REPORT • LOCATE • ALERT", beaconX + 12, beaconY + 12);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [role]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.95 }}
      aria-hidden="true"
    />
  );
};
