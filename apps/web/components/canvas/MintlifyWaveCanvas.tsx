"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface MintlifyWaveProps {
  className?: string;
  particleColor?: string;
}

export default function MintlifyWaveCanvas({
  className = "w-full h-full",
  particleColor = "#18e299",
}: MintlifyWaveProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 700;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 3000);
    camera.position.set(0, 180, 520);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particle Grid Ribbon (Mintlify sinuous wave)
    const countX = 90;
    const countY = 45;
    const numParticles = countX * countY;

    const positions = new Float32Array(numParticles * 3);
    const scales = new Float32Array(numParticles);
    const colors = new Float32Array(numParticles * 3);

    const baseColor = new THREE.Color(particleColor);
    const highlightColor = new THREE.Color("#44aeff");
    const accentColor = new THREE.Color("#baff24");

    let i = 0;
    let j = 0;
    for (let ix = 0; ix < countX; ix++) {
      for (let iy = 0; iy < countY; iy++) {
        // Position in grid with ribbon curvature
        const x = (ix - countX / 2) * 22;
        const z = (iy - countY / 2) * 22;
        const y = 0;

        positions[i] = x;
        positions[i + 1] = y;
        positions[i + 2] = z;

        // Color gradient along the wave (Mintlify signature: emerald -> cyan -> lime)
        const t = ix / countX;
        const col = baseColor.clone();
        if (t < 0.5) {
          col.lerp(highlightColor, t * 1.5);
        } else {
          col.lerp(accentColor, (t - 0.5) * 1.5);
        }

        colors[i] = col.r;
        colors[i + 1] = col.g;
        colors[i + 2] = col.b;

        // Size modulation for depth
        const distFromCenter = Math.sqrt((x * x) / 1000 + (z * z) / 800);
        scales[j] = Math.max(1.8, 5.0 - distFromCenter * 0.08);

        i += 3;
        j++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Custom Shader for glowing soft circular particles
    const material = new THREE.ShaderMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float scale;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;

        void main() {
          vColor = color;
          
          vec3 pos = position;
          // Dual sine wave creating Mintlify's elegant double-curved ribbon
          float wave1 = sin(pos.x * 0.005 + uTime * 0.6) * 55.0;
          float wave2 = cos(pos.z * 0.007 + uTime * 0.4) * 45.0;
          float wave3 = sin((pos.x + pos.z) * 0.004 + uTime * 0.8) * 30.0;
          pos.y = wave1 + wave2 + wave3;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Point size with perspective attenuation
          gl_PointSize = scale * (260.0 / -mvPosition.z);
          
          // Fade edges
          float dist = length(pos.xz) / 900.0;
          vAlpha = clamp(1.0 - dist, 0.1, 0.95);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Circular particle shape with soft outer glow
          float r = length(gl_PointCoord - vec2(0.5));
          if (r > 0.5) discard;
          float softEdge = smoothstep(0.5, 0.1, r);
          gl_FragColor = vec4(vColor, vAlpha * softEdge * 0.85);
        }
      `,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Subtle ambient tilt
    particles.rotation.x = -0.35;
    particles.rotation.z = -0.15;

    // Responsive resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Mouse parallax
    let targetRotY = 0;
    let targetRotX = -0.35;
    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) - 0.5;
      const normY = (e.clientY / window.innerHeight) - 0.5;
      targetRotY = normX * 0.12;
      targetRotX = -0.35 + normY * 0.08;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    let clock = 0;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      clock += 0.018;
      material.uniforms.uTime.value = clock;

      // Smooth camera / rotation interpolation
      particles.rotation.y += (targetRotY - particles.rotation.y) * 0.05;
      particles.rotation.x += (targetRotX - particles.rotation.x) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [particleColor]);

  return <div ref={containerRef} className={className} />;
}
