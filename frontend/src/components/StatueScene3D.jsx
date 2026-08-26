import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * The hero statue, rendered as a real three.js scene instead of a flat DOM
 * `<img>` under CSS `rotate3d`.
 *
 * Why this replaced the CSS version: a flat plane rotated with CSS
 * `rotateX`/`rotateY` has no actual depth for a "camera" to reveal — there is
 * nothing to parallax against, so the only term that reads as motion is
 * whatever changes the image's on-screen size, which looks like *zooming*,
 * not *moving*. Here the statue is mapped onto a photo plane with a shallow
 * cylindrical bulge (`bulge` uniform below), and as the scroll progresses the
 * CAMERA physically arcs around it — like walking a slow semicircle around a
 * statue in a gallery — while a warm point light sweeps independently across
 * the surface. Both of those only look convincing with real geometry and a
 * real camera, which is why this needed WebGL rather than a CSS transform.
 *
 * `progress` is 0..1 scroll progress through the hero (drives the camera
 * arc + light sweep). `tilt` is -1..1 pointer position (adds a small live
 * parallax on top, desktop only — the caller already gates this to
 * non-touch). Scale is intentionally near-constant; depth comes from the
 * orbit + bulge + light, not from resizing the image.
 */
export default function StatueScene3D({
  src,
  progress = 0,
  tilt = { x: 0, y: 0 },
  className = "",
}) {
  const mountRef = useRef(null);
  const progressRef = useRef(progress);
  const tiltRef = useRef(tilt);
  progressRef.current = progress;
  tiltRef.current = tilt;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = mount.clientWidth || 800;
    let height = mount.clientHeight || 900;

    const scene = new THREE.Scene();
    const CAMERA_Z = 6.4;
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(0, 0, CAMERA_Z);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // ---- Statue plane, gently bulged toward the camera ---------------------
    // Unlit base material (MeshBasicMaterial) so the photograph's own
    // exposure/colour is always shown exactly as authored — no risk of a
    // physically-lit material washing it out. The 3D "read" comes from the
    // camera's motion across the bulge, not from lighting the material.
    const SEG = 40;
    const geometry = new THREE.PlaneGeometry(1, 1, SEG, SEG);
    const posAttr = geometry.attributes.position;
    const BULGE = 0.34; // world units of forward displacement at center
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i); // -0.5..0.5
      const y = posAttr.getY(i);
      // Cylindrical bulge around the vertical axis, tapered vertically so the
      // top/bottom edges stay flat (reads as a rounded figure, not a lens).
      const vertTaper = 1 - Math.min(1, Math.abs(y) * 1.15) ** 1.4;
      const z = Math.cos(x * Math.PI * 0.9) * BULGE * (0.35 + 0.65 * vertTaper);
      posAttr.setZ(i, z);
    }
    posAttr.needsUpdate = true;
    geometry.computeVertexNormals();

    const texLoader = new THREE.TextureLoader();
    const material = new THREE.MeshBasicMaterial({ transparent: true });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    const disposables = [geometry, material];

    let texAspect = 3000 / 2000; // sane fallback until the real image loads
    let loaded = false;

    const fitPlaneToCover = () => {
      // Cover-fit the plane to the viewport at the mesh's Z depth, the same
      // math as CSS `object-fit: cover`, done in camera space instead of DOM
      // layout space. A ~14% oversize buffer keeps the edges covered through
      // the small camera arc so no background ever peeks through.
      const vFov = (camera.fov * Math.PI) / 180;
      const visibleH = 2 * Math.tan(vFov / 2) * CAMERA_Z;
      const visibleW = visibleH * camera.aspect;
      const containerAspect = width / height;
      let planeW;
      let planeH;
      // Oversize buffer: generous vertically because the camera's own Y
      // drift (see the lift term in the animate loop) tilts the view enough
      // to need real headroom margin, not just cover the horizontal orbit.
      if (texAspect > containerAspect) {
        planeH = visibleH * 1.32;
        planeW = planeH * texAspect;
      } else {
        planeW = visibleW * 1.2;
        planeH = planeW / texAspect;
      }
      mesh.scale.set(planeW, planeH, 1);
    };

    fitPlaneToCover();

    texLoader.load(
      src,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        // Nudge the framing toward the face/scales (upper-right of frame),
        // mirroring the original object-position: 58% 40% crop.
        tex.repeat.set(0.86, 0.86);
        tex.offset.set(0.07, 0.1);
        material.map = tex;
        material.needsUpdate = true;
        texAspect = tex.image.width / tex.image.height;
        loaded = true;
        fitPlaneToCover();
        if (prefersReducedMotion) renderer.render(scene, camera);
      },
      undefined,
      () => {
        // Load failure: leave the plane transparent. The DOM scrims behind
        // this canvas (rendered by JusticeHero) still hold the layout intact.
      }
    );

    // ---- Warm sweeping key light (visual only — material is unlit, so this
    // drives a soft screen-blended highlight sprite rather than real
    // lighting, which keeps exposure predictable). ---------------------------
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const gctx = glowCanvas.getContext("2d");
    const grad = gctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(255,232,178,0.9)");
    grad.addColorStop(0.5, "rgba(214,192,140,0.35)");
    grad.addColorStop(1, "rgba(214,192,140,0)");
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 256, 256);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.55,
    });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(2.6, 2.6, 1);
    glow.position.z = 0.5;
    scene.add(glow);
    disposables.push(glowTex, glowMat);

    // ---- Reduced motion: static, centered frame, no rAF loop at all -------
    if (prefersReducedMotion) {
      camera.position.set(0, 0, CAMERA_Z);
      camera.lookAt(0, 0, 0);
      glow.position.set(0.6, 0.5, 0.5);
      renderer.render(scene, camera);
    }

    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const p = progressRef.current;
      const tl = tiltRef.current;

      // Camera arcs on a shallow circle around the statue — an actual orbit,
      // not a flat-plane tilt. Small idle sway keeps it alive even mid-stage.
      const orbitAngle =
        (p - 0.5) * 0.62 + Math.sin(t * 0.12) * 0.02 + tl.x * 0.05;
      // Vertical drift kept small and biased toward the "high camera, good
      // headroom" end of the range — a wider swing here was what pushed the
      // statue's head into the top edge mid-scroll (confirmed by frame
      // comparison: p≈0 sits at camY≈0.50 with clean headroom, and headroom
      // was lost as camY dropped toward/below the ~0.15 baseline).
      const liftAngle = (p - 0.5) * -0.1 + tl.y * -0.015;
      camera.position.x = Math.sin(orbitAngle) * CAMERA_Z;
      camera.position.z = Math.cos(orbitAngle) * CAMERA_Z;
      camera.position.y = Math.sin(liftAngle) * CAMERA_Z * 0.16 + 0.32;
      camera.lookAt(0, 0.05, 0);

      // Independent slow light sweep, left-to-right and back, tied loosely to
      // scroll so it feels responsive but keeps moving even when the user
      // pauses mid-scroll.
      const sweep = Math.sin(t * 0.18 + p * 2.4);
      glow.position.set(sweep * 1.4, 0.3 + Math.cos(t * 0.15) * 0.25, 0.6);
      glow.material.opacity = 0.45 + Math.max(0, sweep) * 0.25;

      // Extremely subtle breathing scale — nowhere near the old 28% "zoom."
      const breathe = 1 + Math.sin(t * 0.35) * 0.006;
      mesh.scale.z = breathe;

      if (loaded) renderer.render(scene, camera);
    };
    if (!prefersReducedMotion) animate();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      width = w;
      height = h;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      fitPlaneToCover();
      if (prefersReducedMotion) renderer.render(scene, camera);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      disposables.forEach((d) => d.dispose?.());
      material.map?.dispose?.();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- progress/tilt read via refs, intentionally not re-running the WebGL setup on every scroll tick
  }, [src]);

  return (
    <div
      ref={mountRef}
      className={`[&>canvas]:block ${className}`}
      aria-hidden="true"
    />
  );
}
