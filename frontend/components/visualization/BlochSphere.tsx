'use client';

/**
 * BlochSphere.tsx
 * Interactive 3D Bloch sphere rendered with Three.js.
 * Shows per-qubit state as a point + arrow on the sphere surface.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BlochSphereProps {
  /** Bloch vector [x, y, z] — should be unit-length or close to it */
  blochVector: [number, number, number];
  /** Label shown above the canvas */
  qubitLabel: string;
  /** Canvas size in px */
  size?: number;
}

const ACCENT   = 0x4d2bbb;
const ACCENT_L = 0x8a38f5;
const RED      = 0xef4444;
const GRID     = 0xddd6fe;
const SURFACE  = 0xf5f3ff;

export default function BlochSphere({ blochVector, qubitLabel, size = 220 }: BlochSphereProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // ── Scene setup ─────────────────────────────────────────────────────
    const scene    = new THREE.Scene();
    scene.background = new THREE.Color(SURFACE);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(2.2, 1.6, 2.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(size, size);
    el.appendChild(renderer.domElement);

    // ── Lighting ────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(3, 5, 3);
    scene.add(dirLight);

    // ── Sphere (wireframe + transparent surface) ─────────────────────────
    const sphereGeo  = new THREE.SphereGeometry(1, 32, 32);
    const sphereMat  = new THREE.MeshPhongMaterial({
      color: SURFACE,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    scene.add(new THREE.Mesh(sphereGeo, sphereMat));

    // Wireframe
    const wireGeo = new THREE.SphereGeometry(1, 18, 12);
    const wireMat = new THREE.MeshBasicMaterial({ color: GRID, wireframe: true, transparent: true, opacity: 0.35 });
    scene.add(new THREE.Mesh(wireGeo, wireMat));

    // ── Axes ─────────────────────────────────────────────────────────────
    const addAxis = (dir: THREE.Vector3, color: number) => {
      const mat = new THREE.LineBasicMaterial({ color, linewidth: 1.5 });
      const pts = [dir.clone().multiplyScalar(-1.3), dir.clone().multiplyScalar(1.3)];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      scene.add(new THREE.Line(geo, mat));
    };
    addAxis(new THREE.Vector3(1, 0, 0), 0xef4444); // X — red
    addAxis(new THREE.Vector3(0, 1, 0), 0x22c55e); // Y (up = Z in Bloch) — green
    addAxis(new THREE.Vector3(0, 0, 1), 0x3b82f6); // Z — blue

    // Axis labels (sprites)
    const makeLabel = (text: string, pos: THREE.Vector3, color: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 32, 32);
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.28, 0.28, 1);
      sprite.position.copy(pos);
      scene.add(sprite);
    };
    makeLabel('|0⟩', new THREE.Vector3(0, 1.5, 0), '#15803d');
    makeLabel('|1⟩', new THREE.Vector3(0, -1.5, 0), '#15803d');
    makeLabel('X',   new THREE.Vector3(1.5, 0, 0),  '#b91c1c');
    makeLabel('Y',   new THREE.Vector3(0, 0, 1.5),  '#1d4ed8');

    // ── Equator circle ───────────────────────────────────────────────────
    const eqPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      eqPts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
    }
    const eqGeo = new THREE.BufferGeometry().setFromPoints(eqPts);
    scene.add(new THREE.Line(eqGeo, new THREE.LineBasicMaterial({ color: GRID, transparent: true, opacity: 0.5 })));

    // ── State vector arrow ───────────────────────────────────────────────
    // Bloch convention: x→X, y→Z (depth), z→Y (vertical up)
    const [bx, by, bz] = blochVector;
    const tip = new THREE.Vector3(bx, bz, by); // remap y↔z for Three.js
    const tipLen = tip.length();

    if (tipLen > 0.01) {
      // Stem line
      const stemPts = [new THREE.Vector3(0, 0, 0), tip.clone().multiplyScalar(0.88)];
      const stemGeo = new THREE.BufferGeometry().setFromPoints(stemPts);
      const stemMat = new THREE.LineBasicMaterial({ color: ACCENT, linewidth: 3 });
      scene.add(new THREE.Line(stemGeo, stemMat));

      // Arrowhead cone
      const coneLen = 0.18;
      const coneGeo = new THREE.ConeGeometry(0.045, coneLen, 12);
      const coneMat = new THREE.MeshPhongMaterial({ color: ACCENT_L });
      const cone    = new THREE.Mesh(coneGeo, coneMat);
      // Position at tip, orient along arrow direction
      const dir = tip.clone().normalize();
      cone.position.copy(dir.clone().multiplyScalar(0.88 + coneLen / 2));
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      scene.add(cone);

      // Tip sphere
      const dotGeo = new THREE.SphereGeometry(0.07, 16, 16);
      const dotMat = new THREE.MeshPhongMaterial({ color: RED });
      const dot    = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(tip);
      scene.add(dot);
    } else {
      // Maximally mixed state at the origin of the Bloch sphere
      const dotGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const dotMat = new THREE.MeshPhongMaterial({ color: RED });
      const dot    = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(0, 0, 0);
      scene.add(dot);
    }

    // ── Auto-rotate ──────────────────────────────────────────────────────
    let animId: number;
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    const pivot = new THREE.Object3D();
    scene.add(pivot);

    const onMouseDown = (e: MouseEvent) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; };
    const onMouseUp   = () => { isDragging = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -dx * 0.01);
      camera.lookAt(0, 0, 0);
      prevMouse = { x: e.clientX, y: e.clientY };
      void dy;
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDragging) {
        camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.004);
        camera.lookAt(0, 0, 0);
      }
      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ──────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [blochVector, size]);

  const [bx, by, bz] = blochVector;
  const purity = Math.sqrt(bx * bx + by * by + bz * bz);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700,
        color: 'var(--color-accent)',
        background: 'var(--color-accent-subtle)',
        border: '1px solid var(--color-accent-light)',
        borderRadius: 6, padding: '2px 10px',
      }}>
        {qubitLabel}
      </div>

      <div
        ref={mountRef}
        style={{ width: size, height: size, borderRadius: 12, overflow: 'hidden',
          border: '1px solid var(--color-border)', cursor: 'grab', boxShadow: 'var(--shadow-sm)' }}
        title="Drag to rotate"
      />

      {/* Coordinates */}
      <div style={{ display: 'flex', gap: 8, fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
        {[['x', bx, '#b91c1c'], ['y', by, '#1d4ed8'], ['z', bz, '#15803d']].map(([l, v, c]) => (
          <span key={l as string} style={{ color: c as string }}>
            {l}={Number(v).toFixed(3)}
          </span>
        ))}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-subtle)', fontFamily: 'var(--font-sans)' }}>
        |v| = {purity.toFixed(3)} {purity > 0.99 ? '(pure state)' : purity < 0.01 ? '(maximally mixed)' : '(mixed state)'}
      </div>
    </div>
  );
}
