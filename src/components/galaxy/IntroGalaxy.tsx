"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 200_000;
const BRANCHES = 3;
const RADIUS = 5;
const RANDOMNESS = 0.2;
const RANDOMNESS_POWER = 3;
const INSIDE_COLOR = "#5B9DFF";
const OUTSIDE_COLOR = "#0032A0";

const GALAXY_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uSize;

  attribute vec3 aRandomness;
  attribute float aScale;

  varying vec3 vColor;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    float angle = atan(modelPosition.x, modelPosition.z);
    float distanceToCenter = length(modelPosition.xz);
    float angleOffset = (1.0 / distanceToCenter) * uTime;
    angle += angleOffset;
    modelPosition.x = cos(angle) * distanceToCenter;
    modelPosition.z = sin(angle) * distanceToCenter;

    modelPosition.xyz += aRandomness;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    gl_PointSize = uSize * aScale;
    gl_PointSize *= (1.0 / -viewPosition.z);

    vColor = color;
  }
`;

const GALAXY_FRAGMENT = /* glsl */ `
  uniform float uOpacity;

  varying vec3 vColor;

  void main() {
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 10.0);

    vec3 col = mix(vec3(0.0), vColor, strength);
    gl_FragColor = vec4(col, strength * uOpacity);
  }
`;

interface IntroGalaxyProps {
  opacity: number;
}

export function IntroGalaxy({ opacity }: IntroGalaxyProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const randomness = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const scales = new Float32Array(PARTICLE_COUNT);

    const insideColor = new THREE.Color(INSIDE_COLOR);
    const outsideColor = new THREE.Color(OUTSIDE_COLOR);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      const radius = Math.random() * RADIUS;
      const branchAngle =
        ((i % BRANCHES) / BRANCHES) * Math.PI * 2;

      const rX =
        Math.pow(Math.random(), RANDOMNESS_POWER) *
        (Math.random() < 0.5 ? 1 : -1) *
        RANDOMNESS *
        radius;
      const rY =
        Math.pow(Math.random(), RANDOMNESS_POWER) *
        (Math.random() < 0.5 ? 1 : -1) *
        RANDOMNESS *
        radius;
      const rZ =
        Math.pow(Math.random(), RANDOMNESS_POWER) *
        (Math.random() < 0.5 ? 1 : -1) *
        RANDOMNESS *
        radius;

      positions[i3] = Math.cos(branchAngle) * radius;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = Math.sin(branchAngle) * radius;

      randomness[i3] = rX;
      randomness[i3 + 1] = rY;
      randomness[i3 + 2] = rZ;

      const mixedColor = insideColor.clone();
      mixedColor.lerp(outsideColor, radius / RADIUS);
      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;

      scales[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    return geo;
  }, []);

  const uniforms = useRef({
    uTime: { value: 0 },
    uSize: { value: 30 * Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2) },
    uOpacity: { value: 1 },
  }).current;

  useFrame((_state, delta) => {
    uniforms.uTime.value += delta;
    uniforms.uOpacity.value = opacity;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        vertexShader={GALAXY_VERTEX}
        fragmentShader={GALAXY_FRAGMENT}
        uniforms={uniforms}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        transparent
      />
    </points>
  );
}
