import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Colors
    const colors = {
      cyan: new THREE.Color('#00F0FF'),
      green: new THREE.Color('#00F0A0'),
      purple: new THREE.Color('#8B5CF6'),
    };

    // Particle system
    const particleCount = 800;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorArray = [colors.cyan, colors.green, colors.purple];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

      const color = colorArray[Math.floor(Math.random() * colorArray.length)];
      particleColors[i * 3] = color.r;
      particleColors[i * 3 + 1] = color.g;
      particleColors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 2 + 0.5;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for particles
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float time;
        uniform float pixelRatio;
        
        void main() {
          vColor = color;
          vec3 pos = position;
          
          // Floating animation
          pos.y += sin(time * 0.5 + position.x * 0.1) * 2.0;
          pos.x += cos(time * 0.3 + position.y * 0.1) * 1.5;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * 0.8);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(particles);

    // Wave mesh
    const waveGeometry = new THREE.PlaneGeometry(120, 80, 64, 64);
    const waveMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        colorCyan: { value: colors.cyan },
        colorGreen: { value: colors.green },
        colorPurple: { value: colors.purple },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vElevation;
        uniform float time;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          float elevation = sin(pos.x * 0.1 + time * 0.5) * 3.0;
          elevation += sin(pos.y * 0.15 + time * 0.3) * 2.0;
          elevation += sin((pos.x + pos.y) * 0.05 + time * 0.4) * 2.5;
          
          pos.z = elevation;
          vElevation = elevation;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vElevation;
        uniform vec3 colorCyan;
        uniform vec3 colorGreen;
        uniform vec3 colorPurple;
        
        void main() {
          vec3 color = mix(colorPurple, colorCyan, vUv.x);
          color = mix(color, colorGreen, vUv.y * 0.5);
          
          float brightness = (vElevation + 5.0) / 10.0;
          color *= brightness * 0.5 + 0.5;
          
          float alpha = 0.15 + brightness * 0.1;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const wave = new THREE.Mesh(waveGeometry, waveMaterial);
    wave.rotation.x = -Math.PI / 3;
    wave.position.y = -15;
    wave.position.z = -20;
    scene.add(wave);

    // Connecting lines (constellation effect)
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(300 * 6); // 300 lines, 2 points each
    const lineColors = new Float32Array(300 * 6);

    for (let i = 0; i < 300; i++) {
      const x1 = (Math.random() - 0.5) * 80;
      const y1 = (Math.random() - 0.5) * 60;
      const z1 = (Math.random() - 0.5) * 30;
      const x2 = x1 + (Math.random() - 0.5) * 15;
      const y2 = y1 + (Math.random() - 0.5) * 15;
      const z2 = z1 + (Math.random() - 0.5) * 10;

      linePositions[i * 6] = x1;
      linePositions[i * 6 + 1] = y1;
      linePositions[i * 6 + 2] = z1;
      linePositions[i * 6 + 3] = x2;
      linePositions[i * 6 + 4] = y2;
      linePositions[i * 6 + 5] = z2;

      const color = colorArray[Math.floor(Math.random() * colorArray.length)];
      lineColors[i * 6] = color.r;
      lineColors[i * 6 + 1] = color.g;
      lineColors[i * 6 + 2] = color.b;
      lineColors[i * 6 + 3] = color.r;
      lineColors[i * 6 + 4] = color.g;
      lineColors[i * 6 + 5] = color.b;
    }

    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    const targetRotation = { x: 0, y: 0 };

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Update uniforms
      particleMaterial.uniforms.time.value = elapsedTime;
      waveMaterial.uniforms.time.value = elapsedTime;

      // Rotate based on mouse
      targetRotation.x = mouseY * 0.1;
      targetRotation.y = mouseX * 0.1;
      
      particles.rotation.x += (targetRotation.x - particles.rotation.x) * 0.02;
      particles.rotation.y += (targetRotation.y - particles.rotation.y) * 0.02;
      
      lines.rotation.x = particles.rotation.x * 0.5;
      lines.rotation.y = particles.rotation.y * 0.5;

      // Slow auto rotation
      particles.rotation.z = elapsedTime * 0.02;

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      renderer.dispose();
      particlesGeometry.dispose();
      particleMaterial.dispose();
      waveGeometry.dispose();
      waveMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0"
      style={{ background: 'linear-gradient(135deg, hsl(222 47% 6%) 0%, hsl(222 47% 4%) 100%)' }}
    />
  );
};

export default ThreeBackground;
