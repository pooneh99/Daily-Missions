import { useState, useEffect, useRef, useCallback } from 'react';

const CELL = 16;
const COLS = 20;
const ROWS = 20;
const W = CELL * COLS;
const H = CELL * ROWS;

const SNAKE_COLOR = '#D85A30';
const SNAKE_HEAD = '#B84020';
const FOOD_COLOR = '#F97316';
const BG = '#1A1228';

function randomFood(snake) {
  let p;
  do {
    p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => s.x === p.x && s.y === p.y));
  return p;
}

function freshState() {
  const head = { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) };
  const snake = [head, { x: head.x - 1, y: head.y }, { x: head.x - 2, y: head.y }];
  return { snake, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, food: randomFood(snake), score: 0, over: false, started: false };
}

export default function SnakeGame({ highScore, todayScore, onFinish, onScore }) {
  const canvasRef = useRef(null);
  const gRef = useRef(freshState());
  const rafRef = useRef(null);
  const lastTickRef = useRef(0);
  const touchRef = useRef(null);
  const justTouchedRef = useRef(false);

  const [display, setDisplay] = useState({ score: 0, best: highScore, over: false, started: false });
  const [timeLeft, setTimeLeft] = useState(300);

  // 5-minute countdown
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { clearInterval(id); onFinish(); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [onFinish]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { snake, food, over, started } = gRef.current;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let x = 0; x < COLS; x++)
      for (let y = 0; y < ROWS; y++)
        ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2);

    // Food with glow
    const fx = food.x * CELL + CELL / 2, fy = food.y * CELL + CELL / 2;
    ctx.shadowColor = FOOD_COLOR;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(fx, fy, CELL * 0.36, 0, Math.PI * 2);
    ctx.fillStyle = FOOD_COLOR;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake
    snake.forEach((seg, i) => {
      const isHead = i === 0;
      const x = seg.x * CELL + 1, y = seg.y * CELL + 1, s = CELL - 2;
      ctx.fillStyle = isHead ? SNAKE_HEAD : SNAKE_COLOR;
      ctx.beginPath();
      ctx.roundRect(x, y, s, s, isHead ? 5 : 3);
      ctx.fill();
      if (isHead) {
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, s - 4, (s - 4) / 2, 2);
        ctx.fill();
      }
    });

    // Overlays
    if (!started || over) {
      ctx.fillStyle = 'rgba(26,18,40,0.78)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      if (over) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 26px -apple-system,sans-serif';
        ctx.fillText('Game Over', W / 2, H / 2 - 18);
        ctx.font = '15px -apple-system,sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillText('Tap to play again', W / 2, H / 2 + 14);
      } else {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px -apple-system,sans-serif';
        ctx.fillText('Tap to start', W / 2, H / 2 - 8);
        ctx.font = '13px -apple-system,sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('or use the d-pad below', W / 2, H / 2 + 14);
      }
    }
  }, []);

  const gameLoop = useCallback((ts) => {
    const g = gRef.current;
    if (!g.started || g.over) { draw(); rafRef.current = requestAnimationFrame(gameLoop); return; }

    const speed = Math.max(80, 150 - g.score * 1.5);
    if (ts - lastTickRef.current >= speed) {
      lastTickRef.current = ts;
      g.dir = g.nextDir;
      const head = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y };

      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
          g.snake.slice(1).some(s => s.x === head.x && s.y === head.y)) {
        g.over = true;
        setDisplay(d => ({ ...d, over: true }));
        onScore(g.score);
      } else {
        const ate = head.x === g.food.x && head.y === g.food.y;
        g.snake = [head, ...g.snake];
        if (!ate) g.snake.pop();
        else {
          g.score += 10;
          g.food = randomFood(g.snake);
          setDisplay(d => ({ ...d, score: g.score, best: Math.max(d.best, g.score) }));
        }
      }
    }
    draw();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [draw, onScore]);

  useEffect(() => {
    draw();
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [gameLoop, draw]);

  const setDir = useCallback((dx, dy) => {
    const g = gRef.current;
    if (dx !== 0 && g.dir.x !== 0) return;
    if (dy !== 0 && g.dir.y !== 0) return;
    g.nextDir = { x: dx, y: dy };
  }, []);

  const startOrRestart = useCallback((dx = 1, dy = 0) => {
    const g = gRef.current;
    if (g.over) {
      gRef.current = freshState();
      gRef.current.started = true;
      gRef.current.dir = { x: dx, y: dy };
      gRef.current.nextDir = { x: dx, y: dy };
      setDisplay(d => ({ ...d, score: 0, over: false, started: true }));
    } else if (!g.started) {
      g.started = true;
      g.dir = { x: dx, y: dy };
      g.nextDir = { x: dx, y: dy };
      setDisplay(d => ({ ...d, started: true }));
    }
  }, []);

  const handleDpad = useCallback((dx, dy) => {
    if (!gRef.current.started || gRef.current.over) startOrRestart(dx, dy);
    else setDir(dx, dy);
  }, [startOrRestart, setDir]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      const map = { ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0],
                    w: [0,-1], s: [0,1], a: [-1,0], d: [1,0] };
      if (map[e.key]) { e.preventDefault(); handleDpad(...map[e.key]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleDpad]);

  // Touch swipe on canvas
  const onTouchStart = (e) => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e) => {
    justTouchedRef.current = true;
    setTimeout(() => { justTouchedRef.current = false; }, 300);
    const start = touchRef.current;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    const dist = Math.hypot(dx, dy);
    touchRef.current = null;
    if (dist < 12) { startOrRestart(); return; }
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (ax > ay) handleDpad(dx > 0 ? 1 : -1, 0);
    else handleDpad(0, dy > 0 ? 1 : -1);
  };
  const onClick = () => { if (!justTouchedRef.current) startOrRestart(); };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="snake-overlay">
      <div className="snake-modal">

        <div className="snake-header">
          <div className="snake-timer" style={{ color: timeLeft <= 30 ? '#EF4444' : '#fff' }}>
            {fmt(timeLeft)}
          </div>
          <div className="snake-scores">
            <span className="snake-score-item">Today <strong>{display.score}</strong></span>
            <span className="snake-score-divider">·</span>
            <span className="snake-score-item">Best <strong>{display.best}</strong></span>
          </div>
          <button className="snake-skip" onClick={onFinish}>Skip →</button>
        </div>

        <div className="snake-title">Warm-up time, Razi joon 🐍</div>

        <div className="snake-canvas-wrap"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={onClick}
        >
          <canvas ref={canvasRef} width={W} height={H} className="snake-canvas" />
        </div>

        <div className="snake-dpad">
          <button className="dpad-btn" onClick={() => handleDpad(0, -1)}>▲</button>
          <div className="dpad-row">
            <button className="dpad-btn" onClick={() => handleDpad(-1, 0)}>◀</button>
            <div className="dpad-center" />
            <button className="dpad-btn" onClick={() => handleDpad(1, 0)}>▶</button>
          </div>
          <button className="dpad-btn" onClick={() => handleDpad(0, 1)}>▼</button>
        </div>

      </div>
    </div>
  );
}
