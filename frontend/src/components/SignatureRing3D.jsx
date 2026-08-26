import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * The hero's single 3D signature element — one thin, precise gold ring
 * (a minimal abstraction of the scale-beam), slowly rotating, tilting subtly
 * with scroll. Deliberately restrained: no particle fields, no multiple
 * objects. This is the one "this is a technology product" gesture in an
 * otherwise photographic, editorial hero.
 */
export default function SignatureRing3D({ className = "", scrollProgress = 0 }) {
  const mountRef = useRef(null);
  const scrollProgressRef = useRef(scrollProgress);
  scrollProgressRef.current = scrollProgress;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = mount.clientWidth;
    let height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.PointLight(0xd6c08c, 3, 20);
    key.position.set(3, 3, 5);
    scene.add(key);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.035, 24, 140),
      new THREE.MeshStandardMaterial({
        color: 0xb89b5e,
        emissive: 0x8a7240,
        emissiveIntensity: 0.35,
        metalness: 0.9,
        roughness: 0.25,
      })
    );
    ring.rotation.x = Math.PI / 2.6;
    scene.add(ring);

    // A slim second arc offset, for depth — still reads as "one element"
    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.012, 16, 140, Math.PI * 1.4),
      new THREE.MeshStandardMaterial({
        color: 0xd6c08c,
        metalness: 0.9,
        roughness: 0.2,
        transparent: true,
        opacity: 0.6,
      })
    );
    innerRing.rotation.x = Math.PI / 2.6;
    innerRing.rotation.z = 0.6;
    scene.add(innerRing);

    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (!prefersReducedMotion) {
        const progress = scrollProgressRef.current; // 0..1 through the hero
        ring.rotation.z = t * 0.15;
        innerRing.rotation.z = -t * 0.1;
        ring.rotation.x = Math.PI / 2.6 + Math.sin(t * 0.2) * 0.08 + progress * 0.6;
        innerRing.rotation.x = ring.rotation.x;
      }
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      mount.removeChild(renderer.domElement);
      [ring, innerRing].forEach((obj) => {
        obj.geometry?.dispose();
        obj.material?.dispose();
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`pointer-events-none [&>canvas]:block ${className}`}
      aria-hidden="true"
    />
  );
}
