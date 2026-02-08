import { useEffect, useRef, useCallback } from "react";
import useSound from "use-sound";

// Constants for game physics and rendering
const GRAVITY = 0.4;
const JUMP_FORCE = -11;
const PLATFORM_WIDTH = 100;
const PLATFORM_HEIGHT = 20;
const PLAYER_SIZE = 22; // Radius
const BASE_PLATFORM_GAP_Y = 130;
const BASE_PLATFORM_SPEED = 2;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface Cloud {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

interface GameCanvasProps {
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  isPlaying: boolean;
  reviveTrigger?: number;
}

export function GameCanvas({ onGameOver, onScoreUpdate, isPlaying, reviveTrigger }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playJump] = useSound("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3", { volume: 0.5 });
  const [playLand] = useSound("https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3", { volume: 0.3 });
  
  // Game State Refs
  const gameState = useRef({
    player: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      visualScaleX: 1,
      visualScaleY: 1
    },
    platforms: [] as { id: number; x: number; y: number; vx: number; type: 'static' | 'moving' }[],
    particles: [] as Particle[],
    clouds: [] as Cloud[],
    cameraY: 0,
    score: 0,
    width: 0,
    height: 0,
    isDead: false,
    frames: 0,
    canJump: false,
    lastPlatformId: -1,
    platformIdCounter: 0,
    difficulty: 1,
  });

  const requestRef = useRef<number>();

  // Initialize Game
  const initGame = (canvas: HTMLCanvasElement) => {
    const width = canvas.width;
    const height = canvas.height;
    
    // Generate static clouds for parallax
    const clouds: Cloud[] = [];
    for (let i = 0; i < 15; i++) {
      clouds.push({
        x: Math.random() * width,
        y: Math.random() * height * 5 - (height * 2), // Spread over large vertical range
        size: 40 + Math.random() * 80,
        opacity: 0.1 + Math.random() * 0.3
      });
    }

    gameState.current = {
      player: { 
        x: width / 2, 
        y: height - 150, 
        vx: 0, 
        vy: 0,
        visualScaleX: 1,
        visualScaleY: 1
      },
      platforms: [
        { id: 0, x: width / 2 - PLATFORM_WIDTH / 2, y: height - 50, vx: 0, type: 'static' }
      ],
      particles: [],
      clouds,
      cameraY: 0,
      score: 0,
      width,
      height,
      isDead: false,
      frames: 0,
      canJump: true,
      lastPlatformId: 0,
      platformIdCounter: 1,
      difficulty: 1,
    };

    // Generate initial platforms
    for (let i = 1; i < 8; i++) {
      spawnPlatform(height - 50 - (i * BASE_PLATFORM_GAP_Y));
    }
  };

  const spawnPlatform = (y: number) => {
    const state = gameState.current;
    const level = Math.floor(state.score / 10);
    const speed = BASE_PLATFORM_SPEED + level * 0.5;
    
    state.platforms.push({
      id: state.platformIdCounter++,
      x: Math.random() * (state.width - PLATFORM_WIDTH),
      y: y,
      vx: Math.random() > 0.5 ? speed : -speed,
      type: 'moving'
    });
  };

  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    const state = gameState.current;
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 2 + Math.random() * 4,
        color
      });
    }
  };

  const jump = () => {
    const state = gameState.current;
    if (state.isDead || !state.canJump) return;

    state.player.vy = JUMP_FORCE;
    state.canJump = false;
    state.player.visualScaleX = 0.7;
    state.player.visualScaleY = 1.3;
    createParticles(state.player.x, state.player.y + PLAYER_SIZE, '#ffffff', 5);
    playJump();
  };

  // The Main Game Loop
  const update = () => {
    if (!isPlaying || gameState.current.isDead) return;

    const state = gameState.current;
    
    // 1. Physics
    state.player.vy += GRAVITY;
    state.player.y += state.player.vy;
    state.player.x += state.player.vx;

    // Visual Scaling Recovery
    state.player.visualScaleX += (1 - state.player.visualScaleX) * 0.2;
    state.player.visualScaleY += (1 - state.player.visualScaleY) * 0.2;

    // Bounce off walls horizontally
    if (state.player.x < PLAYER_SIZE) {
      state.player.x = PLAYER_SIZE;
      state.player.vx *= -1;
    } else if (state.player.x > state.width - PLAYER_SIZE) {
      state.player.x = state.width - PLAYER_SIZE;
      state.player.vx *= -1;
    }

    // 2. Camera Follow
    const targetY = state.player.y;
    const screenCenter = state.cameraY + state.height * 0.6;
    if (targetY < screenCenter) {
      const diff = screenCenter - targetY;
      state.cameraY -= diff;
    }

    // 3. Platform Logic
    state.platforms.forEach(p => {
      p.x += p.vx;
      if (p.x <= 0 || p.x + PLATFORM_WIDTH >= state.width) {
        p.vx *= -1;
      }
    });

    // 4. Collision Detection
    if (state.player.vy > 0) {
      state.platforms.forEach(p => {
        // Only collide with platforms that are visible on screen
        if (p.y > state.cameraY + state.height) return;

        const playerBottom = state.player.y + PLAYER_SIZE;
        const platformTop = p.y;
        const platformBottom = p.y + PLATFORM_HEIGHT;
        
        if (
          playerBottom >= platformTop &&
          playerBottom <= platformBottom + 15 &&
          state.player.y < platformTop
        ) {
          if (
            state.player.x + PLAYER_SIZE * 0.5 > p.x &&
            state.player.x - PLAYER_SIZE * 0.5 < p.x + PLATFORM_WIDTH
          ) {
            // Landed!
            state.player.y = platformTop - PLAYER_SIZE;
            state.player.vy = 0;
            state.player.vx = p.vx;
            state.canJump = true;

            // Visual Effect
            state.player.visualScaleX = 1.4;
            state.player.visualScaleY = 0.6;
            createParticles(state.player.x, platformTop, '#fbbf24', 10);

            if (state.lastPlatformId !== p.id) {
              state.lastPlatformId = p.id;
              state.score += 1;
              onScoreUpdate(state.score);
              playLand();
            }
          }
        }
      });
    }

    // 5. Particles Update
    state.particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
    });
    state.particles = state.particles.filter(p => p.life > 0);

    // 6. Cleanup & Spawning
    // Remove platforms strictly when they go off screen
    state.platforms = state.platforms.filter(p => p.y < state.cameraY + state.height);
    const highestPlatformY = state.platforms.length > 0
      ? Math.min(...state.platforms.map(p => p.y))
      : state.cameraY + state.height;

    if (highestPlatformY > state.cameraY - 100) {
      const level = Math.floor(state.score / 10);
      const gap = BASE_PLATFORM_GAP_Y + level * 5;
      spawnPlatform(highestPlatformY - gap);
    }

    // 7. Game Over
    // Trigger game over as soon as player's center passes the bottom edge
    if (state.player.y > state.cameraY + state.height) {
      state.isDead = true;
      onGameOver(state.score);
    }

    state.frames++;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const state = gameState.current;
    ctx.clearRect(0, 0, state.width, state.height);
    
    // Draw Background Parallax Clouds
    ctx.save();
    ctx.translate(0, -state.cameraY * 0.3);
    state.clouds.forEach(c => {
      ctx.globalAlpha = c.opacity;
      ctx.fillStyle = '#ffffff';
      drawCloud(ctx, c.x, c.y, c.size);
    });
    ctx.restore();
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(0, -state.cameraY);

    // Draw Particles
    state.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Platforms
    state.platforms.forEach(p => {
      const level = Math.floor(state.score / 10);
      ctx.fillStyle = level > 2 ? '#ef4444' : (level > 0 ? '#10b981' : '#475569');
      roundRect(ctx, p.x, p.y, PLATFORM_WIDTH, PLATFORM_HEIGHT, 8);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(p.x + 5, p.y + 2, PLATFORM_WIDTH - 10, 4);
    });

    // Draw Player
    ctx.save();
    ctx.translate(state.player.x, state.player.y);
    ctx.scale(state.player.visualScaleX, state.player.visualScaleY);

    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_SIZE, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(-5, -5, 2, 0, 0, PLAYER_SIZE);
    gradient.addColorStop(0, '#fbbf24');
    gradient.addColorStop(1, '#f59e0b');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#1e293b';
    const eyeOffset = state.player.vx > 0 ? 5 : (state.player.vx < 0 ? -5 : 0);
    ctx.beginPath();
    ctx.arc(-7 + eyeOffset, -4, 3, 0, Math.PI * 2);
    ctx.arc(7 + eyeOffset, -4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  };

  function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.3, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y + size * 0.1, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  const tick = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    update();
    draw(ctx);
    requestRef.current = requestAnimationFrame(tick);
  };

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (isPlaying) {
      jump();
    }
  };

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    gameState.current.width = canvas.width;
    gameState.current.height = canvas.height;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    handleResize();
    window.addEventListener('resize', handleResize);

    if (isPlaying) {
      initGame(canvas);
      requestRef.current = requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, handleResize]);

  useEffect(() => {
    if (reviveTrigger && gameState.current.isDead) {
      const state = gameState.current;
      state.isDead = false;
      state.canJump = true;
      const highest = state.platforms.reduce((prev, curr) => (prev.y < curr.y) ? prev : curr);
      state.player.y = highest.y - PLAYER_SIZE;
      state.player.x = highest.x + PLATFORM_WIDTH / 2;
      state.player.vy = 0;
      state.player.vx = highest.vx;
      state.lastPlatformId = highest.id;
      createParticles(state.player.x, state.player.y, '#ffffff', 20);
    }
  }, [reviveTrigger]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block touch-none"
      onClick={handleTap}
      onTouchStart={handleTap}
    />
  );
}
