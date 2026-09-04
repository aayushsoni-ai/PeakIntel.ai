"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface PortfolioGlobeProps {
  className?: string;
}

// Real major private equity / financial hub cities
const PORTFOLIO_NODES = [
  { lat: 40.7128,  lon: -74.006,   label: "New York, USA",      flag: "🇺🇸", color: 0x38bdf8, status: "active"  },
  { lat: 51.5074,  lon: -0.1278,   label: "London, UK",         flag: "🇬🇧", color: 0x38bdf8, status: "active"  },
  { lat: 48.8566,  lon: 2.3522,    label: "Paris, France",      flag: "🇫🇷", color: 0x38bdf8, status: "active"  },
  { lat: 35.6762,  lon: 139.6503,  label: "Tokyo, Japan",       flag: "🇯🇵", color: 0xfbbf24, status: "watch"   },
  { lat: 1.3521,   lon: 103.8198,  label: "Singapore",          flag: "🇸🇬", color: 0x38bdf8, status: "active"  },
  { lat: 22.3193,  lon: 114.1694,  label: "Hong Kong",          flag: "🇭🇰", color: 0xfbbf24, status: "watch"   },
  { lat: 19.076,   lon: 72.8777,   label: "Mumbai, India",      flag: "🇮🇳", color: 0x38bdf8, status: "active"  },
  { lat: 25.2048,  lon: 55.2708,   label: "Dubai, UAE",         flag: "🇦🇪", color: 0xfbbf24, status: "watch"   },
  { lat: 37.7749,  lon: -122.4194, label: "San Francisco, USA", flag: "🇺🇸", color: 0x38bdf8, status: "active"  },
  { lat: -33.8688, lon: 151.2093,  label: "Sydney, Australia",  flag: "🇦🇺", color: 0xf87171, status: "alert"   },
];

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export default function PortfolioGlobe({ className = "w-full h-full" }: PortfolioGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 0, 320);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // ── Globe wireframe sphere ──────────────────────────────
    const radius = 110;
    const sphereGeo = new THREE.SphereGeometry(radius, 48, 28);
    const sphereWire = new THREE.LineSegments(
      new THREE.WireframeGeometry(sphereGeo),
      new THREE.LineBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.3 })
    );
    globeGroup.add(sphereWire);

    // ── Inner solid sphere ──────────────────────────────
    const innerGeo = new THREE.SphereGeometry(radius - 1, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x080a0c,
      transparent: true,
      opacity: 0.9,
    });
    globeGroup.add(new THREE.Mesh(innerGeo, innerMat));

    // ── Atmospheric glow halo ──────────────────────────────
    const glowGeo = new THREE.SphereGeometry(radius + 10, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.035,
      side: THREE.FrontSide,
    });
    globeGroup.add(new THREE.Mesh(glowGeo, glowMat));

    // ── Portfolio city nodes ──────────────────────────────
    const nodeMeshes: { ring: THREE.Mesh; dot: THREE.Mesh; pos: THREE.Vector3 }[] = [];
    const nodePositions: THREE.Vector3[] = [];

    PORTFOLIO_NODES.forEach((node) => {
      const pos = latLonToVec3(node.lat, node.lon, radius + 2);
      nodePositions.push(pos);

      // Outer pulse ring
      const ringGeo = new THREE.SphereGeometry(4.2, 16, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.18,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      globeGroup.add(ring);

      // Inner solid dot
      const dotGeo = new THREE.SphereGeometry(2.0, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: node.color });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      globeGroup.add(dot);

      nodeMeshes.push({ ring, dot, pos });
    });

    // ── Arc connections between major hubs ──────────────────────────────
    const arcPairs: [number, number][] = [
      [0, 1], // NY – London
      [1, 2], // London – Paris
      [0, 8], // NY – San Francisco
      [1, 3], // London – Tokyo
      [3, 4], // Tokyo – Singapore
      [4, 5], // Singapore – HK
      [4, 6], // Singapore – Mumbai
      [6, 7], // Mumbai – Dubai
      [7, 1], // Dubai – London
      [5, 9], // HK – Sydney
    ];

    arcPairs.forEach(([a, b]) => {
      const start = nodePositions[a];
      const end = nodePositions[b];

      if (!start || !end) return;

      const mid = new THREE.Vector3()
        .addVectors(start, end)
        .normalize()
        .multiplyScalar(radius + 30);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(50);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0x1e3a5f,
        transparent: true,
        opacity: 0.55,
      });
      globeGroup.add(new THREE.Line(geo, mat));
    });

    // ── Equatorial orbit ring ──────────────────────────────
    const torusGeo = new THREE.TorusGeometry(radius + 16, 0.5, 8, 100);
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
    });
    const equator = new THREE.Mesh(torusGeo, torusMat);
    equator.rotation.x = Math.PI / 2;
    globeGroup.add(equator);

    // ── Secondary tilted ring ──────────────────────────────
    const ring2Geo = new THREE.TorusGeometry(radius + 22, 0.25, 8, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.07,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 4;
    ring2.rotation.z = Math.PI / 6;
    globeGroup.add(ring2);

    // ── Animate ──────────────────────────────
    let frameId: number;
    let time = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.004;

      globeGroup.rotation.y = time * 0.16;
      globeGroup.rotation.x = Math.sin(time * 0.07) * 0.07;

      // Staggered pulsing rings per node
      nodeMeshes.forEach(({ ring }, i) => {
        const t = time * 2.0 + i * 0.65;
        const scale = 1 + 0.45 * Math.abs(Math.sin(t));
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.08 + 0.22 * Math.abs(Math.sin(t));
        ring.scale.setScalar(scale);
      });

      equator.rotation.z = time * 0.06;
      ring2.rotation.y = time * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    // ── Handle resize ──────────────────────────────
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className={className} />;
}
