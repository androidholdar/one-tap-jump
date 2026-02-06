import { useEffect, useRef, useState } from "react";
import useSound from "use-sound";

// Constants for game physics and rendering
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const PLATFORM_WIDTH = 80;
const PLATFORM_HEIGHT = 20;
const PLAYER_SIZE = 25; // Radius
const PLATFORM_GAP_Y = 120; // Vertical distance between platforms

interface GameCanvasProps {
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  isPlaying: boolean;
}

export function GameCanvas({ onGameOver, onScoreUpdate, isPlaying }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playJump] = useSound("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3", { volume: 0.5 });
  const [playLand] = useSound("https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3", { volume: 0.3 });
  
  // Game State Refs (using refs for game loop performance to avoid re-renders)
  const gameState = useRef({
    player: { x: 0, y: 0, vx: 0, vy: 0 },
    platforms: [] as { x: number; y: number; vx: number; type: 'static' | 'moving' }[],
    cameraY: 0,
    score: 0,
    width: 0,
    height: 0,
    isDead: false,
    frames: 0,
  });

  const requestRef = useRef<number>();

  // Initialize Game
  const initGame = (canvas: HTMLCanvasElement) => {
    const width = canvas.width;
    const height = canvas.height;
    
    gameState.current = {
      player: { 
        x: width / 2, 
        y: height - 150, 
        vx: 0, 
        vy: 0 
      },
      platforms: [
        // Starting platform
        { x: width / 2 - PLATFORM_WIDTH / 2, y: height - 50, vx: 0, type: 'static' }
      ],
      cameraY: 0,
      score: 0,
      width,
      height,
      isDead: false,
      frames: 0
    };

    // Generate initial platforms
    for (let i = 1; i < 10; i++) {
      spawnPlatform(height - 50 - (i * PLATFORM_GAP_Y));
    }
  };

  const spawnPlatform = (y: number) => {
    const width = gameState.current.width;
    const isMoving = Math.random() > 0.7; // 30% chance of moving platform
    
    gameState.current.platforms.push({
      x: Math.random() * (width - PLATFORM_WIDTH),
      y: y,
      vx: isMoving ? (Math.random() > 0.5 ? 2 : -2) : 0,
      type: isMoving ? 'moving' : 'static'
    });
  };

  const jump = () => {
    if (gameState.current.isDead) return;
    gameState.current.player.vy = JUMP_FORCE;
    playJump();
  };

  // The Main Game Loop
  const update = () => {
    if (!isPlaying || gameState.current.isDead) return;

    const state = gameState.current;
    
    // 1. Physics
    state.player.vy += GRAVITY;
    state.player.y += state.player.vy;

    // 2. Camera Follow (Only goes UP)
    // If player is in the top half of the screen
    const targetY = state.player.y;
    const screenCenter = state.cameraY + state.height / 2;
    
    if (targetY < screenCenter) {
      const diff = screenCenter - targetY;
      state.cameraY -= diff; // Move camera up
      state.score += Math.floor(diff / 10); // Score based on height
      onScoreUpdate(Math.floor(state.cameraY * -0.1)); // Send normalized score to UI
    }

    // 3. Platform Logic
    state.platforms.forEach(p => {
      // Movement
      if (p.type === 'moving') {
        p.x += p.vx;
        // Bounce off walls
        if (p.x <= 0 || p.x + PLATFORM_WIDTH >= state.width) {
          p.vx *= -1;
        }
      }
    });

    // 4. Collision Detection (Only when falling)
    if (state.player.vy > 0) {
      state.platforms.forEach(p => {
        // Simple AABB collision
        // Player bottom touches Platform top
        // Player X is within Platform X range
        const playerBottom = state.player.y + PLAYER_SIZE;
        const platformTop = p.y;
        const platformBottom = p.y + PLATFORM_HEIGHT;
        
        // Check vertical overlap (allow some margin for "landing")
        if (
          playerBottom >= platformTop &&
          playerBottom <= platformBottom + 10 && // tolerance
          state.player.y < platformTop // Must be coming from above
        ) {
          // Check horizontal overlap
          if (
            state.player.x + PLAYER_SIZE > p.x &&
            state.player.x - PLAYER_SIZE < p.x + PLATFORM_WIDTH
          ) {
            // Landed!
            state.player.vy = JUMP_FORCE; // Auto bounce
            state.player.y = platformTop - PLAYER_SIZE;
            playLand();
          }
        }
      });
    }

    // 5. Cleanup & Spawning
    // Remove platforms below viewport
    state.platforms = state.platforms.filter(p => p.y < state.cameraY + state.height + 100);
    
    // Add new platforms above
    const highestPlatformY = Math.min(...state.platforms.map(p => p.y));
    if (highestPlatformY > state.cameraY - 100) {
      spawnPlatform(highestPlatformY - PLATFORM_GAP_Y);
    }

    // 6. Game Over Condition
    // If player falls below the bottom of the screen
    if (state.player.y > state.cameraY + state.height + 100) {
      state.isDead = true;
      onGameOver(Math.floor(state.cameraY * -0.1));
    }

    state.frames++;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const state = gameState.current;
    
    // Clear Screen
    ctx.clearRect(0, 0, state.width, state.height);
    
    ctx.save();
    
    // Apply Camera Transform
    // We want cameraY to be 0 at the top. 
    // Canvas 0,0 is top-left.
    // So we translate everything up by cameraY relative to initial position.
    // Actually, we want to simulate the world moving DOWN as player goes UP.
    // So we subtract cameraY.
    ctx.translate(0, -state.cameraY);

    // Draw Platforms
    state.platforms.forEach(p => {
      ctx.fillStyle = p.type === 'moving' ? '#4ADE80' : '#475569'; // Green (moving) or Slate (static)
      // Rounded rect effect
      roundRect(ctx, p.x, p.y, PLATFORM_WIDTH, PLATFORM_HEIGHT, 5);
      ctx.fill();
      
      // Add subtle top highlight
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(p.x, p.y, PLATFORM_WIDTH, 4);
    });

    // Draw Player
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, PLAYER_SIZE, 0, Math.PI * 2);
    // Gradient fill for player
    const gradient = ctx.createRadialGradient(
      state.player.x - 5, state.player.y - 5, 2,
      state.player.x, state.player.y, PLAYER_SIZE
    );
    gradient.addColorStop(0, '#FCD34D'); // Light yellow
    gradient.addColorStop(1, '#F59E0B'); // Orange
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Player Eyes (Cute factor)
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(state.player.x - 8, state.player.y - 5, 4, 0, Math.PI * 2); // Left Eye
    ctx.arc(state.player.x + 8, state.player.y - 5, 4, 0, Math.PI * 2); // Right Eye
    ctx.fill();

    ctx.restore();
  };

  // Helper for rounded rectangles
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Animation Loop Wrapper
  const tick = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    update();
    draw(ctx);
    requestRef.current = requestAnimationFrame(tick);
  };

  // Handle Input
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default to stop double-tap zoom etc
    // e.preventDefault(); 
    if (isPlaying) {
      // In this specific game logic:
      // Player auto-bounces. Tap could be a "boost" or lateral movement?
      // Wait, prompt said "One Tap Jump". 
      // Doodle Jump style usually is auto-bounce. 
      // Let's make "Tap" move the player towards the tap X position horizontally?
      // OR: Tap to perform a mid-air jump (double jump)?
      
      // Let's implement: Tap left side -> Move Left, Tap right side -> Move Right
      // Actually, simple "One Tap" games usually mean timing.
      // Let's try: Player moves left/right automatically (bouncing off walls), Tap to Jump?
      // No, vertical climbers usually require horizontal control.
      
      // Implementation: Follow Mouse/Touch X position for horizontal control.
      // Tap is unused for movement, just maybe for "Start".
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPlaying || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    gameState.current.player.x = x;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPlaying || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const x = (e.touches[0].clientX - rect.left) * scaleX;
    gameState.current.player.x = x;
  };

  // Lifecycle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set resolution match
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    if (isPlaying) {
      initGame(canvas);
      // Start Loop
      requestRef.current = requestAnimationFrame(tick);
    } else {
      // Just draw static frame
      const ctx = canvas.getContext('2d');
      if (ctx) {
         // Maybe draw a title screen background?
         ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block touch-none cursor-crosshair"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onClick={handleTap}
    />
  );
}
