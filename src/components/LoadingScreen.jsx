import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Edges, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const THEME = {
  bg: '#0f0a07',
  brown: '#2a1a11',
  amber: '#d97706',
  glowAmber: '#f59e0b',
  brightAmber: '#fbbf24',
};

function AnimatedText() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => (p + 1) % 11);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const totalBlocks = 10;
  const blocks = Array.from({ length: totalBlocks }, (_, i) => 
    i < progress ? '📅' : '⬜'
  ).join('');

  return (
    <div style={{
      position: 'absolute',
      bottom: '15%',
      left: '50%',
      transform: 'translateX(-50%)',
      textAlign: 'center',
      color: THEME.brightAmber,
      fontFamily: "'VT323', 'DotGothic16', monospace",
      textShadow: `0 0 10px ${THEME.amber}`,
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: '24px', letterSpacing: '4px', marginBottom: '10px' }}>INITIALIZING...</div>
      <div style={{ fontSize: '18px', letterSpacing: '2px', opacity: 0.8 }}>{blocks}</div>
    </div>
  );
}

function RubiksCube({ hovered, setHovered }) {
  const group = useRef();
  const pointLightRef = useRef();
  
  const boxes = useMemo(() => {
    const coords = [];
    const gap = 1.05;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          coords.push([x * gap, y * gap, z * gap]);
        }
      }
    }
    return coords;
  }, []);

  useFrame((state, delta) => {
    group.current.rotation.x += delta * 0.2;
    group.current.rotation.y += delta * 0.3;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.2;
    
    const targetScale = hovered ? 1.05 : 1;
    group.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    if (pointLightRef.current) {
      const targetIntensity = hovered ? 3 : 1;
      pointLightRef.current.intensity = THREE.MathUtils.lerp(pointLightRef.current.intensity, targetIntensity, 0.1);
    }
  });

  return (
    <group 
      ref={group}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={() => setHovered(true)}
      onPointerUp={() => setHovered(false)}
    >
      <pointLight ref={pointLightRef} color={THEME.glowAmber} distance={10} intensity={1} />
      {boxes.map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={THEME.brown} roughness={0.8} metalness={0.2} />
          <Edges 
            linewidth={2} 
            threshold={15} 
            color={hovered ? THEME.brightAmber : THEME.amber} 
          />
        </mesh>
      ))}
    </group>
  );
}

export default function LoadingScreen({ onComplete }) {
  const [hovered, setHovered] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 800); // 800ms fade transition
    }, 2500); // 2.5s minimum load time

    return () => {
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: THEME.bg,
      zIndex: 9999,
      opacity: isFading ? 0 : 1,
      transition: 'opacity 800ms ease-in-out',
      overflow: 'hidden'
    }}>
      {/* Background radial glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60vw',
        height: '60vw',
        background: `radial-gradient(circle, ${THEME.amber}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Subtle vignette */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        boxShadow: 'inset 0 0 150px rgba(0,0,0,0.8)',
        pointerEvents: 'none',
        zIndex: 10
      }} />

      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={hovered ? 1.5 : 0.8} 
          color={THEME.glowAmber} 
        />
        <Sparkles count={50} scale={12} size={2} speed={0.4} opacity={0.3} color={THEME.amber} />
        <RubiksCube hovered={hovered} setHovered={setHovered} />
      </Canvas>

      <AnimatedText />
    </div>
  );
}
