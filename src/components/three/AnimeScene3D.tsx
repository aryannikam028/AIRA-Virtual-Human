import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { AnimeGirlModel } from './AnimeGirlModel.ts';
import { ConnectionState, ReactionData, VisualAesthetic } from '../../types/index.ts';
import { THEMES } from '../AestheticThemes.ts';
import { AudioStreamer } from '../../services/AudioStreamer.ts';

interface AnimeScene3DProps {
  connectionState: ConnectionState;
  aesthetic: VisualAesthetic;
  reaction: ReactionData | null;
  audioStreamer: AudioStreamer | null;
}

export const AnimeScene3D: React.FC<AnimeScene3DProps> = ({
  connectionState,
  aesthetic,
  reaction,
  audioStreamer,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const animeGirlRef = useRef<AnimeGirlModel | null>(null);
  const stateRef = useRef({ connectionState, reaction, aesthetic, audioStreamer });

  // Keep latest mutable references for the animation loop
  useEffect(() => {
    stateRef.current = { connectionState, reaction, aesthetic, audioStreamer };
    if (animeGirlRef.current) {
      const theme = THEMES[aesthetic] || THEMES['cyber-magenta'];
      animeGirlRef.current.updateTheme(theme.primaryColor);
    }
  }, [connectionState, reaction, aesthetic, audioStreamer]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL detection per directives
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;

    // 2. Scene & Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06060c, 0.12);

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.25, 2.85);

    // 4. Renderer with ACESFilmicToneMapping
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 5. Studio Environment Reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 6. Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xe0e7ff, 0x1e1b4b, 1.2);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1f2, 2.0);
    keyLight.position.set(1.8, 3.2, 2.2);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xec4899, 1.8);
    rimLight.position.set(-2, 2.5, -2);
    scene.add(rimLight);

    // 7. Instantiate Anime Girl Model
    const currentTheme = THEMES[aesthetic] || THEMES['cyber-magenta'];
    const animeGirl = new AnimeGirlModel(currentTheme.primaryColor);
    animeGirlRef.current = animeGirl;
    scene.add(animeGirl.group);

    // 8. Interactive Pointer Dragging for Smooth Orbital Rotation
    let isDragging = false;
    let prevPointerX = 0;
    let targetRotationY = 0;
    let currentRotationY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevPointerX = e.clientX;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevPointerX;
      prevPointerX = e.clientX;
      targetRotationY += deltaX * 0.008;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 9. Resize Observer
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    // 10. Animation Loop with Software-WebGL Pacing
    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Smooth camera / model damping (1 - Math.exp(-k * dt))
      currentRotationY += (targetRotationY - currentRotationY) * (1 - Math.exp(-8 * delta));
      animeGirl.group.rotation.y = currentRotationY;

      // Extract current audio volume
      let audioVol = 0;
      const curStreamer = stateRef.current.audioStreamer;
      const curState = stateRef.current.connectionState;

      if (curStreamer) {
        if (curState === 'speaking') {
          audioVol = curStreamer.getOutputVolume();
        } else if (curState === 'listening') {
          audioVol = curStreamer.getInputVolume();
        }
      }

      // Update model animations
      animeGirl.update(
        delta,
        elapsed,
        audioVol,
        stateRef.current.connectionState,
        stateRef.current.reaction
      );

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      animeGirl.dispose();
      renderer.dispose();
      if (domElem.parentElement) {
        domElem.parentElement.removeChild(domElem);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full min-h-[360px] sm:min-h-[460px] md:min-h-[520px] flex items-center justify-center select-none cursor-grab active:cursor-grabbing touch-none"
    />
  );
};
