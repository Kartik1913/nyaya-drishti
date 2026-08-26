import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";

/**
 * The 6-Layer Triage Engine, rendered literally: six gold-edged slabs stacked
 * in depth that fan apart into an exploded diagram as you scroll past, with a
 * glowing "case bead" traveling up through every layer so the picture reads as
 * a pipeline — a raw case entering at the bottom and emerging ranked at the
 * top — not as abstract geometry.
 *
 * Each slab is labelled with an HTML overlay (rendered outside the WebGL
 * canvas but positioned per-frame from projected 3D coordinates) so the
 * picture stays legible without asking the reader to guess what the shapes
 * mean.
 *
 * Exposes an imperative `focusLayer(i | null)` handle so the layer-list on the
 * page can highlight the corresponding slab on hover.
 *
 * Discipline: low-power renderer, capped DPR, ResizeObserver sizing, hard
 * disposal on unmount, and a single-frame render for prefers-reduced-motion.
 */

const LAYERS = [
  { title: "Cohort Builder", short: "Cohort" },
  { title: "Stall Detector", short: "Stall" },
  { title: "Bottleneck Classifier", short: "Classify" },
  { title: "Priority Scorer", short: "Score" },
  { title: "Evidence Bundler", short: "Evidence" },
  { title: "Priority Queue", short: "Queue" },
];

const LayerStack3D = forwardRef(function LayerStack3D(
  { className = "" },
  ref
) {
  const mountRef = useRef(null);
  const focusRef = useRef(-1);
  const focusApiRef = useRef({ set: (_v) => {} });

  useImperativeHandle(ref, () => ({
    focusLayer: (i) => focusApiRef.current.set(typeof i === "number" ? i : -1),
  }));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Fall back to a sane size if the box measures 0 on first paint (an
    // aspect-ratio container can report 0 before layout settles). The
    // ResizeObserver below corrects it as soon as real dimensions land —
    // bailing here would leave the canvas permanently blank.
    let width = mount.clientWidth || 480;
    let height = mount.clientHeight || 480;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 2.4, 8.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const keyLight = new THREE.PointLight(0xd6c08c, 4.2, 30); // warm gold key
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0x5fa8a2, 1.6, 30); // cool teal rim
    fillLight.position.set(-5, -2, 4);
    scene.add(fillLight);

    const group = new THREE.Group();
    scene.add(group);

    const slabGeo = new THREE.BoxGeometry(3.4, 0.07, 2.3);
    const edgeGeo = new THREE.EdgesGeometry(slabGeo);
    const disposables = [slabGeo, edgeGeo];

    // A tiny "processing grid" plate that sits on top of each slab, so each
    // layer looks like it has *contents* rather than being a smooth box.
    const plateGeo = new THREE.PlaneGeometry(2.9, 1.85, 8, 5);
    const plateWireMat = new THREE.LineBasicMaterial({
      color: 0xd6c08c,
      transparent: true,
      opacity: 0.22,
    });
    const plateWireGeo = new THREE.WireframeGeometry(plateGeo);
    disposables.push(plateGeo, plateWireGeo, plateWireMat);

    const slabs = [];
    const slabBaseColors = [];
    const slabEmissiveBase = [];
    for (let i = 0; i < LAYERS.length; i++) {
      // Deepest layer (raw cohort data) is dim navy; the top layer (the
      // queue the user actually reads) is bright bronze.
      const t = i / (LAYERS.length - 1);
      const color = new THREE.Color().lerpColors(
        new THREE.Color(0x13243a),
        new THREE.Color(0xb89b5e),
        t
      );
      const slabMat = new THREE.MeshStandardMaterial({
        color,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0.85,
        roughness: 0.32,
        transparent: true,
        opacity: 0.55 + t * 0.4,
      });
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0xd6c08c,
        transparent: true,
        opacity: 0.35 + t * 0.5,
      });
      disposables.push(slabMat, edgeMat);

      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.add(new THREE.LineSegments(edgeGeo, edgeMat));

      // Wireframe grid plate sits just on top of the slab surface.
      const plate = new THREE.LineSegments(plateWireGeo, plateWireMat);
      plate.rotation.x = -Math.PI / 2;
      plate.position.y = 0.045;
      slab.add(plate);

      group.add(slab);
      slabs.push(slab);
      slabBaseColors.push(color.clone());
      slabEmissiveBase.push(new THREE.Color(0x000000));
    }

    // ---- The travelling "case bead" ---------------------------------------
    // A gold ember that rises up through the stack. It's the raw case
    // entering the pipeline (bottom) and coming out ranked (top), on a slow
    // 3.8s loop that gives the diagram a heartbeat without becoming noisy.
    const beadGeo = new THREE.SphereGeometry(0.075, 24, 24);
    const beadMat = new THREE.MeshStandardMaterial({
      color: 0xffe6a6,
      emissive: 0xd6c08c,
      emissiveIntensity: 2.2,
      metalness: 0.4,
      roughness: 0.2,
    });
    const bead = new THREE.Mesh(beadGeo, beadMat);
    scene.add(bead);
    disposables.push(beadGeo, beadMat);

    // Faint trail behind the bead — a thin gold line drawn from the bottom
    // slab up to the bead's current height, so you *see* the trajectory
    // rather than just a point moving.
    const trailMat = new THREE.LineBasicMaterial({
      color: 0xd6c08c,
      transparent: true,
      opacity: 0.35,
    });
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(6); // two points, xyz each
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
    const trail = new THREE.Line(trailGeo, trailMat);
    scene.add(trail);
    disposables.push(trailGeo, trailMat);

    // ---- Scroll-driven "exploded" spread ---------------------------------
    let progress = 0;
    let ticking = false;
    const updateProgress = () => {
      const rect = mount.getBoundingClientRect();
      const travel = window.innerHeight + rect.height;
      const p = (window.innerHeight - rect.top) / travel;
      progress = Math.min(1, Math.max(0, p));
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateProgress);
    };
    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });

    // ---- Layer focus (exposed via imperative handle) ---------------------
    focusApiRef.current.set = (v) => {
      focusRef.current = v;
    };

    // Positioning helper.
    const layoutSlabs = (spread) => {
      slabs.forEach((slab, i) => {
        const centered = i - (slabs.length - 1) / 2;
        slab.position.y = centered * spread;
        slab.position.x = centered * (spread - 0.16) * 1.1;
        slab.rotation.y = centered * 0.14 * (spread - 0.16) * 3.2;
      });
    };

    // Project a 3D world point into `mount`-local pixel space, for the HTML
    // label overlay. Returns null if the point is behind the camera.
    const project = new THREE.Vector3();
    const projectTo2D = (obj) => {
      obj.getWorldPosition(project);
      project.project(camera);
      if (project.z > 1) return null;
      return {
        x: (project.x * 0.5 + 0.5) * width,
        y: (-project.y * 0.5 + 0.5) * height,
      };
    };

    // Build the HTML label DOM (owned by this effect so it lifecycles cleanly)
    const labelHost = document.createElement("div");
    labelHost.style.cssText =
      "position:absolute;inset:0;pointer-events:none;overflow:hidden;";
    mount.appendChild(labelHost);
    const labelNodes = LAYERS.map((layer, i) => {
      const el = document.createElement("div");
      el.style.cssText = [
        "position:absolute",
        "transform:translate(-50%,-50%)",
        "left:0;top:0",
        "font-family:Lato,sans-serif",
        "font-size:10px",
        "font-weight:700",
        "letter-spacing:0.14em",
        "text-transform:uppercase",
        "color:#F1EDE3",
        "background:rgba(11,22,40,0.72)",
        "border:1px solid rgba(214,192,140,0.35)",
        "border-radius:999px",
        "padding:3px 10px",
        "backdrop-filter:blur(6px)",
        "-webkit-backdrop-filter:blur(6px)",
        "white-space:nowrap",
        "transition:opacity 240ms ease,transform 240ms ease,background 240ms ease,border-color 240ms ease",
        "will-change:transform,opacity",
      ].join(";");
      el.innerHTML =
        `<span style="color:#D6C08C;margin-right:6px;font-family:ui-monospace,monospace">${String(
          i + 1
        ).padStart(2, "0")}</span>${layer.short}`;
      labelHost.appendChild(el);
      return el;
    });

    if (prefersReducedMotion) {
      // One static, legible frame.
      group.rotation.y = -0.5;
      group.rotation.x = 0.16;
      layoutSlabs(0.36);
      bead.position.set(0, 0, 0);
      renderer.render(scene, camera);
      slabs.forEach((slab, i) => {
        const p = projectTo2D(slab);
        const el = labelNodes[i];
        if (!p) {
          el.style.opacity = "0";
          return;
        }
        el.style.opacity = "1";
        // Push the label to the left of each slab so it doesn't overlap it.
        el.style.transform = `translate(-115%,-50%) translate(${p.x}px,${p.y}px)`;
      });
    }

    let frameId;
    const clock = new THREE.Clock();
    let beadOpacity = 0;
    let beadTargetY = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Bell-curve spread: stacked when the section enters, fully exploded
      // mid-view, stacked again as it exits.
      const bell = Math.sin(Math.PI * progress);
      const spread = 0.16 + bell * 0.5;

      group.rotation.y = -0.55 + t * 0.1;
      group.rotation.x = 0.14 + Math.sin(t * 0.35) * 0.05;
      layoutSlabs(spread);
      slabs.forEach((slab, i) => {
        slab.position.y += Math.sin(t * 0.8 + i * 0.55) * 0.02;
      });

      // Layer focus (hover from the list): brighten the target slab's
      // emissive, mute the others.
      const focus = focusRef.current;
      slabs.forEach((slab, i) => {
        const active = focus === i;
        const target = active ? 0.55 : focus === -1 ? 0 : -0.35;
        // Interpolate emissive intensity smoothly (~200ms)
        const cur = slab.material.emissiveIntensity;
        slab.material.emissiveIntensity = cur + (Math.max(target, 0) - cur) * 0.12;
        // When "muted" (something else is focused), dim opacity too
        const baseOpacity = 0.55 + (i / (slabs.length - 1)) * 0.4;
        const opTarget = focus === -1 ? baseOpacity : active ? 1 : baseOpacity * 0.55;
        slab.material.opacity += (opTarget - slab.material.opacity) * 0.14;
        slab.material.emissive.copy(active ? new THREE.Color(0xd6c08c) : slabEmissiveBase[i]);
      });

      // Case bead — travels up through the layers on a slow loop, resting a
      // beat at the top before restarting.
      const cycle = 4.0;
      const raw = (t % cycle) / cycle; // 0..1
      // Pause at the top for the last 18% of the cycle so the "output" beat
      // registers.
      const travelT = Math.min(1, raw / 0.82);
      const yMin = -((slabs.length - 1) / 2) * spread - 0.08;
      const yMax = ((slabs.length - 1) / 2) * spread + 0.4; // slightly above the top slab
      beadTargetY = yMin + (yMax - yMin) * travelT;
      bead.position.set(
        Math.sin(t * 0.6) * 0.12,
        beadTargetY,
        Math.cos(t * 0.6) * 0.12
      );
      // Fade in on entry, hold, fade to zero when the cycle restarts.
      const fadeIn = Math.min(1, raw / 0.06);
      const fadeOut = raw > 0.94 ? Math.max(0, 1 - (raw - 0.94) / 0.06) : 1;
      beadOpacity = fadeIn * fadeOut;
      beadMat.opacity = beadOpacity;
      beadMat.transparent = true;
      beadMat.emissiveIntensity = 2.2 * beadOpacity;

      // Trail — a short line from just below the bead up to the bead itself.
      trailPositions[0] = bead.position.x;
      trailPositions[1] = yMin;
      trailPositions[2] = bead.position.z;
      trailPositions[3] = bead.position.x;
      trailPositions[4] = bead.position.y;
      trailPositions[5] = bead.position.z;
      trailGeo.attributes.position.needsUpdate = true;
      trailMat.opacity = 0.35 * beadOpacity;

      renderer.render(scene, camera);

      // Update HTML label positions to follow their slab in screen space.
      slabs.forEach((slab, i) => {
        const p = projectTo2D(slab);
        const el = labelNodes[i];
        if (!p) {
          el.style.opacity = "0";
          return;
        }
        // Only show labels when the stack is at least partially exploded,
        // otherwise they'd all pile onto each other.
        const revealed = Math.max(0, Math.min(1, (spread - 0.22) / 0.28));
        const active = focus === i;
        el.style.opacity = String(revealed * (active ? 1 : 0.85));
        if (active) {
          el.style.background = "rgba(184,155,94,0.95)";
          el.style.borderColor = "rgba(214,192,140,0.9)";
          el.style.color = "#0B1628";
        } else {
          el.style.background = "rgba(11,22,40,0.72)";
          el.style.borderColor = "rgba(214,192,140,0.35)";
          el.style.color = "#F1EDE3";
        }
        // Push the label out to the right of the fanned stack so it does
        // not overlap the slab itself.
        el.style.transform = `translate(6%,-50%) translate(${p.x}px,${p.y}px)`;
      });
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
      if (prefersReducedMotion) renderer.render(scene, camera);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      if (labelHost.parentNode === mount) {
        mount.removeChild(labelHost);
      }
      disposables.forEach((d) => d.dispose?.());
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`relative pointer-events-none [&>canvas]:block ${className}`}
      aria-hidden="true"
    />
  );
});

export default LayerStack3D;
