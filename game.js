(() => {
  "use strict";

  const W = 480;
  const H = 720;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const BEST_KEY = "chorizoRunBest";

  const GOOD = [
    { emoji: "🪙", points: 10, weight: 5 },
    { emoji: "🫒", points: 5, weight: 4 },
    { emoji: "🍞", points: 20, weight: 2 },
  ];
  const BAD = ["🔥", "🗡", "🪰"];

  let state = "menu";
  let score = 0;
  let best = Number(localStorage.getItem(BEST_KEY) || 0);
  let lives = 3;
  let elapsed = 0;
  let spawnTimer = 0;
  let invuln = 0;
  let shakeTime = 0;
  let newRecord = false;

  const player = { x: W / 2, y: H - 100, r: 26, tilt: 0 };
  let items = [];
  let particles = [];
  let clouds = [];

  const keys = { left: false, right: false };
  let pointerX = null;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initClouds() {
    clouds = [];
    for (let i = 0; i < 6; i++) {
      clouds.push({
        x: Math.random() * W,
        y: 40 + Math.random() * 320,
        s: 0.6 + Math.random() * 0.9,
        v: 6 + Math.random() * 14,
      });
    }
  }

  function reset() {
    score = 0;
    lives = 3;
    elapsed = 0;
    spawnTimer = 0.6;
    invuln = 0;
    shakeTime = 0;
    newRecord = false;
    player.x = W / 2;
    player.tilt = 0;
    items = [];
    particles = [];
    initClouds();
  }

  function startGame() {
    reset();
    state = "playing";
  }

  function gameOver() {
    state = "over";
    if (score > best) {
      best = Math.floor(score);
      localStorage.setItem(BEST_KEY, String(best));
      newRecord = true;
    }
  }

  function pickGood() {
    const total = GOOD.reduce((a, g) => a + g.weight, 0);
    let roll = Math.random() * total;
    for (const g of GOOD) {
      roll -= g.weight;
      if (roll <= 0) return g;
    }
    return GOOD[0];
  }

  function spawnItem() {
    const badChance = Math.min(0.5, 0.28 + elapsed * 0.006);
    const isBad = Math.random() < badChance;
    const good = isBad ? null : pickGood();
    const emoji = isBad ? BAD[Math.floor(Math.random() * BAD.length)] : good.emoji;
    items.push({
      x: 30 + Math.random() * (W - 60),
      y: -30,
      vy: 180 + elapsed * 7 + Math.random() * 60,
      r: isBad ? 20 : 18,
      emoji,
      good: !isBad,
      points: good ? good.points : 0,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 3,
    });
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 160;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 60,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        size: 2 + Math.random() * 4,
        color,
      });
    }
  }

  function update(dt) {
    for (const c of clouds) {
      c.x += c.v * dt;
      if (c.x > W + 80) c.x = -80;
    }

    if (state !== "playing") {
      updateParticles(dt);
      return;
    }

    elapsed += dt;
    score += dt * 2;
    invuln = Math.max(0, invuln - dt);
    shakeTime = Math.max(0, shakeTime - dt);

    const speed = 430;
    let vx = 0;
    if (keys.left) vx -= speed;
    if (keys.right) vx += speed;
    player.x += vx * dt;
    if (pointerX !== null) {
      player.x += (pointerX - player.x) * Math.min(1, dt * 14);
    }
    player.x = Math.max(player.r + 8, Math.min(W - player.r - 8, player.x));
    player.tilt += ((vx / speed) * 0.25 - player.tilt) * Math.min(1, dt * 10);

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnItem();
      spawnTimer = Math.max(0.32, 0.85 - elapsed * 0.012) * (0.7 + Math.random() * 0.6);
    }

    const fallBoost = Math.min(380, elapsed * 7);
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += (it.vy + fallBoost * 0.4) * dt;
      it.rot += it.vr * dt;
      if (it.y > H + 40) {
        items.splice(i, 1);
        continue;
      }
      const dx = it.x - player.x;
      const dy = it.y - player.y;
      if (dx * dx + dy * dy < (it.r + player.r * 0.85) ** 2) {
        if (it.good) {
          score += it.points;
          burst(it.x, it.y, "#ffd166", 12);
        } else if (invuln <= 0) {
          lives -= 1;
          invuln = 1.6;
          shakeTime = 0.35;
          burst(player.x, player.y, "#e63946", 22);
          if (lives <= 0) {
            items.splice(i, 1);
            updateParticles(dt);
            gameOver();
            return;
          }
        }
        items.splice(i, 1);
      }
    }

    updateParticles(dt);
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#2b1a2e");
    g.addColorStop(0.6, "#4a2436");
    g.addColorStop(1, "#6b3030");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255, 235, 210, 0.10)";
    for (const c of clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 26 * c.s, 0, Math.PI * 2);
      ctx.arc(c.x + 22 * c.s, c.y + 6 * c.s, 20 * c.s, 0, Math.PI * 2);
      ctx.arc(c.x - 24 * c.s, c.y + 8 * c.s, 18 * c.s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#3d1f1a";
    ctx.fillRect(0, H - 46, W, 46);
    ctx.fillStyle = "#5a2d22";
    ctx.fillRect(0, H - 46, W, 6);
  }

  function drawChorizo() {
    const blink = invuln > 0 && Math.floor(invuln * 12) % 2 === 0;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.tilt);
    if (blink) ctx.globalAlpha = 0.35;

    const grad = ctx.createLinearGradient(0, -22, 0, 22);
    grad.addColorStop(0, "#d95f43");
    grad.addColorStop(0.5, "#b03a2e");
    grad.addColorStop(1, "#7e241b");
    ctx.fillStyle = grad;
    roundRect(-40, -16, 80, 32, 16);
    ctx.fill();

    ctx.fillStyle = "#8e2f24";
    ctx.beginPath();
    ctx.ellipse(-40, 0, 7, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(40, 0, 7, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#f5e6d3";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-44, -4);
    ctx.lineTo(-44, 4);
    ctx.moveTo(44, -4);
    ctx.lineTo(44, 4);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 220, 190, 0.35)";
    roundRect(-28, -11, 34, 7, 3.5);
    ctx.fill();

    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawItems() {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const it of items) {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot * 0.4);
      ctx.font = `${it.r * 2}px serif`;
      ctx.fillText(it.emoji, 0, 0);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawHUD() {
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#f5e6d3";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(`Puntos: ${Math.floor(score)}`, 14, 12);
    ctx.textAlign = "right";
    ctx.font = "22px serif";
    ctx.fillText("❤️".repeat(Math.max(0, lives)), W - 14, 12);
  }

  function centerText(text, y, size, color, bold = true) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.font = `${bold ? "bold " : ""}${size}px sans-serif`;
    ctx.fillText(text, W / 2, y);
  }

  function drawMenu() {
    centerText("🌭 CHORIZO RUN 🌭", H / 2 - 120, 38, "#ffd166");
    centerText("Esquiva el fuego, los cuchillos y las moscas.", W / 2, H / 2 - 40, 17, "#f5e6d3", false);
    centerText("Recoge 🪙 🫒 🍞 para sumar puntos.", W / 2, H / 2 - 12, 17, "#f5e6d3", false);
    centerText(`Récord: ${best}`, W / 2, H / 2 + 30, 20, "#ffb4a2");
    const pulse = 1 + Math.sin(performance.now() / 300) * 0.05;
    ctx.save();
    ctx.translate(W / 2, H / 2 + 110);
    ctx.scale(pulse, pulse);
    centerText("Pulsa ESPACIO o toca para jugar", 0, 20, "#ffffff");
    ctx.restore();
  }

  function drawGameOver() {
    ctx.fillStyle = "rgba(20, 8, 12, 0.72)";
    ctx.fillRect(0, 0, W, H);
    centerText("¡TE HAN ATRAPADO! 💥", W / 2, H / 2 - 90, 30, "#e63946");
    centerText(`Puntos: ${Math.floor(score)}`, W / 2, H / 2 - 20, 26, "#ffd166");
    centerText(`Récord: ${best}`, W / 2, H / 2 + 16, 20, "#f5e6d3", false);
    if (newRecord) centerText("¡NUEVO RÉCORD! 🏆", W / 2, H / 2 + 52, 20, "#06d6a0");
    centerText("Pulsa ESPACIO o toca para reintentar", W / 2, H / 2 + 110, 18, "#ffffff", false);
  }

  function render() {
    ctx.save();
    if (shakeTime > 0) {
      const m = shakeTime * 22;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    drawBackground();
    drawItems();
    drawParticles();
    if (state !== "menu") drawChorizo();
    if (state === "playing") drawHUD();
    ctx.restore();

    if (state === "menu") drawMenu();
    if (state === "over") drawGameOver();
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
    if ((e.key === " " || e.key === "Enter") && state !== "playing") {
      e.preventDefault();
      startGame();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
  });

  function pointerToX(e) {
    const rect = canvas.getBoundingClientRect();
    return ((e.clientX - rect.left) / rect.width) * W;
  }
  canvas.addEventListener("pointerdown", (e) => {
    pointerX = pointerToX(e);
    if (state !== "playing") startGame();
  });
  canvas.addEventListener("pointermove", (e) => {
    pointerX = pointerToX(e);
  });
  window.addEventListener("pointerup", () => {
    pointerX = null;
  });
  window.addEventListener("blur", () => {
    keys.left = false;
    keys.right = false;
    pointerX = null;
  });

  resize();
  window.addEventListener("resize", resize);
  initClouds();
  requestAnimationFrame(loop);
})();
