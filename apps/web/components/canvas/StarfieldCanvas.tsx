"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface StarfieldCanvasProps {
  /** Number of star particles */
  count?: number;
  /** className applied to the wrapper div */
  className?: string;
}

export default function StarfieldCanvas({
  count = 2500,
  className = "fixed inset-0 w-full h-full pointer-events-none",
}: StarfieldCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Scene setup ────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.z = 600;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // ── Star geometry ───────────────────────────────────────────────
    const positions = new Float32Array(count * 3);
    const sizes     = new Float32Array(count);
    const colors    = new Float32Array(count * 3);

    // Brand palette: mostly white/silver, occasional warm gold, rare cool
    const palette = [
      [1.00, 1.00, 1.00], // white
      [0.95, 0.95, 0.98], // cool white
      [0.83, 0.66, 0.33], // brand gold  (#d4a853)
      [0.92, 0.90, 0.80], // warm cream
      [0.70, 0.80, 0.95], // very faint blue
    ];
    const weights = [0.55, 0.25, 0.10, 0.07, 0.03]; // probability weights

    const spread = 900;

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1200;

      sizes[i] = Math.random() < 0.06
        ? Math.random() * 2.5 + 1.5   // occasional bright star
        : Math.random() * 1.2 + 0.3;  // regular tiny star

      // Pick color from palette
      const r = Math.random();
      let acc = 0, ci = 0;
      for (let w = 0; w < weights.length; w++) {
        acc += weights[w];
        if (r < acc) { ci = w; break; }
      }
      const [pr, pg, pb] = palette[ci];
      // Slight random variance per star
      colors[i * 3]     = pr * (0.85 + Math.random() * 0.15);
      colors[i * 3 + 1] = pg * (0.85 + Math.random() * 0.15);
      colors[i * 3 + 2] = pb * (0.85 + Math.random() * 0.15);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("size",     new THREE.BufferAttribute(sizes,     1));
    geo.setAttribute("color",    new THREE.BufferAttribute(colors,    3));

    const mat = new THREE.PointsMaterial({
      size: 1.4,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });

    const stars = new THREE.Points(geo, mat);
    scene.add(stars);

    // ── Scroll-driven zoom state ────────────────────────────────────
    let scrollVelocity = 0;  // current zoom speed (units / frame)
    let targetVelocity = 0;  // what we want to reach
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const delta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      // Map scroll delta → target velocity (clamped)
      targetVelocity = Math.min(Math.max(delta * 0.8, -6), 6);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // ── Resize ─────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // ── Animate ────────────────────────────────────────────────────
    let frameId: number;
    let time = 0;

    const NEAR = -200;   // wrap threshold (camera z - near)
    const FAR  = 1000;   // spawn z when wrapping

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.002;

      // Ease velocity toward target, then decay target back to ambient
      scrollVelocity += (targetVelocity - scrollVelocity) * 0.12;
      targetVelocity *= 0.88; // decay to 0 so it eases out

      // Ambient slow drift when no scrolling
      const ambientSpeed = 0.18;
      const speed = ambientSpeed + scrollVelocity;

      // Move each star toward camera (positive z)
      const pos = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 2] += speed;

        // Wrap: if star passes camera, reset to far back
        if (pos[i * 3 + 2] > camera.position.z + NEAR) {
          pos[i * 3 + 2] = camera.position.z - FAR;
          // Re-randomise XY so it feels like new stars
          pos[i * 3]     = (Math.random() - 0.5) * spread;
          pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
        }
      }
      geo.attributes.position.needsUpdate = true;

      // Subtle slow rotation for depth
      stars.rotation.x = Math.sin(time * 0.3) * 0.012;
      stars.rotation.y = Math.cos(time * 0.2) * 0.008;

      // Opacity pulse: slightly dim during fast scroll so it reads naturally
      mat.opacity = Math.max(0.4, 0.75 - Math.abs(scrollVelocity) * 0.025);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [count]);

  return <div ref={containerRef} className={className} style={{ zIndex: 0 }} />;
}
