"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import * as THREE from "three";

// ----------------------------------------------------------------------------
// 1. Earth Globe Mesh (Atmosphere Glow, Geodetic Wireframe & Particulate Field)
// ----------------------------------------------------------------------------
function EarthGlobe() {
  const globeRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.08;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.12;
    }
  });

  // Generate urban monitoring mesh points across the globe
  const particlePoints = useMemo(() => {
    const coords: number[] = [];
    const count = 350;
    const radius = 1.42;

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      coords.push(x, y, z);
    }
    return new Float32Array(coords);
  }, []);

  return (
    <group ref={globeRef}>
      {/* Deep Space Core Planet Sphere */}
      <mesh>
        <sphereGeometry args={[1.4, 48, 48]} />
        <meshStandardMaterial
          color="#060c18"
          roughness={0.7}
          metalness={0.3}
          emissive="#031024"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Geodetic Latitude/Longitude Spatial Wireframe Grid */}
      <mesh>
        <sphereGeometry args={[1.41, 32, 24]} />
        <meshBasicMaterial
          color="#06b6d4"
          wireframe
          transparent
          opacity={0.16}
        />
      </mesh>

      {/* Urban Ground Mesh Monitoring Nodes (Glowing Green & Amber Beads) */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePoints, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#10b981"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Rotating Atmospheric Trace Aerosol Cloud */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[1.45, 32, 32]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.08}
          wireframe
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer Atmospheric Radiant Glow Shell */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[1.56, 32, 32]} />
        <meshBasicMaterial
          color="#0284c7"
          transparent
          opacity={0.14}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------------------------------
// 2. ESA Sentinel-5P Satellite Model & Orbit Mechanics
// ----------------------------------------------------------------------------
function SentinelSatellite() {
  const satelliteGroupRef = useRef<THREE.Group>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const dataBeamRef = useRef<THREE.Mesh>(null);

  const orbitRadius = 2.25;
  const inclinationAngle = Math.PI / 4.2; // ~42 degree polar sun-synchronous orbit

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.45;

    // Calculate 3D Keplerian inclined orbit position
    const x = Math.cos(t) * orbitRadius;
    const y = Math.sin(t) * Math.sin(inclinationAngle) * orbitRadius;
    const z = Math.sin(t) * Math.cos(inclinationAngle) * orbitRadius;

    if (satelliteGroupRef.current) {
      satelliteGroupRef.current.position.set(x, y, z);
      satelliteGroupRef.current.lookAt(0, 0, 0); // Point TROPOMI sensor toward Earth center
    }

    // Telemetry emission pulse ring animation
    if (pulseRingRef.current) {
      const pulseScale = 1.0 + (t % 1.5) * 1.8;
      pulseRingRef.current.scale.set(pulseScale, pulseScale, pulseScale);
      const pulseMat = pulseRingRef.current.material as THREE.MeshBasicMaterial;
      if (pulseMat) {
        pulseMat.opacity = Math.max(0, 0.9 - (t % 1.5) * 0.6);
      }
    }

    // TROPOMI scanning beam shimmer
    if (dataBeamRef.current) {
      const beamMat = dataBeamRef.current.material as THREE.MeshBasicMaterial;
      if (beamMat) {
        beamMat.opacity = 0.12 + Math.sin(t * 8) * 0.06;
      }
    }
  });

  return (
    <>
      {/* Orbital Elliptical Path Guide Ring */}
      <mesh rotation={[inclinationAngle, 0, 0]}>
        <ringGeometry args={[orbitRadius - 0.005, orbitRadius + 0.005, 96]} />
        <meshBasicMaterial
          color="#06b6d4"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Orbiting Satellite Body */}
      <group ref={satelliteGroupRef}>
        {/* Main Bus Chassis (Gold Multi-Layer Insulation Foil) */}
        <mesh>
          <boxGeometry args={[0.14, 0.1, 0.1]} />
          <meshStandardMaterial
            color="#f59e0b"
            metalness={0.9}
            roughness={0.2}
            emissive="#b45309"
            emissiveIntensity={0.4}
          />
        </mesh>

        {/* TROPOMI Atmospheric Sensor Aperture */}
        <mesh position={[0, 0, -0.06]}>
          <cylinderGeometry args={[0.03, 0.04, 0.04, 16]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.8}
          />
        </mesh>

        {/* Solar Array Wing - Left */}
        <mesh position={[-0.22, 0, 0]}>
          <boxGeometry args={[0.26, 0.08, 0.01]} />
          <meshStandardMaterial
            color="#0369a1"
            roughness={0.1}
            metalness={0.8}
            emissive="#0284c7"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Solar Array Wing - Right */}
        <mesh position={[0.22, 0, 0]}>
          <boxGeometry args={[0.26, 0.08, 0.01]} />
          <meshStandardMaterial
            color="#0369a1"
            roughness={0.1}
            metalness={0.8}
            emissive="#0284c7"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* TROPOMI Earth-Directed Scanning Laser Conic Beam */}
        <mesh ref={dataBeamRef} position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.35, 1.2, 16, 1, true]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Radio Telemetry Emission Pulse Ring */}
        <mesh ref={pulseRingRef}>
          <ringGeometry args={[0.12, 0.16, 24]} />
          <meshBasicMaterial
            color="#10b981"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Beacon Omnidirectional Point Light */}
        <pointLight color="#38bdf8" intensity={1.5} distance={1.8} />
      </group>
    </>
  );
}

// ----------------------------------------------------------------------------
// 3. Main Exported 3D Canvas Container
// ----------------------------------------------------------------------------
export interface SatelliteGlobe3DProps {
  className?: string;
  enableInteraction?: boolean;
}

export default function SatelliteGlobe3D({
  className = "w-full h-[450px]",
  enableInteraction = true,
}: SatelliteGlobe3DProps) {
  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [0, 0.5, 4.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        {/* Cinematic Ambient & Key Space Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 4, 3]} intensity={1.8} color="#e0f2fe" />
        <pointLight position={[-4, -3, -2]} intensity={0.6} color="#0284c7" />

        {/* Floating 3D Scene */}
        <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
          <EarthGlobe />
          <SentinelSatellite />
        </Float>

        {/* Orbit Camera Controls */}
        {enableInteraction && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            rotateSpeed={0.5}
            maxPolarAngle={Math.PI / 1.7}
            minPolarAngle={Math.PI / 2.6}
          />
        )}
      </Canvas>

      {/* Overlay Status Tag */}
      <div className="absolute bottom-3 left-3 pointer-events-none flex items-center space-x-2 text-[10px] font-mono text-cyan-400/90 bg-slate-950/80 px-2.5 py-1 rounded-full border border-cyan-800/50 backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
        <span>ESA SENTINEL-5P TROPOMI &times; MESH TELEMETRY (42° POLAR ORBIT)</span>
      </div>
    </div>
  );
}
