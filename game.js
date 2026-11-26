(() => {
  "use strict";

  const W = 480;
  const H = 720;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const BEST_KEY = "chorizoRunBest";

  const VERSION = "v2.0";
  const LEVEL_STEP = 100;
  const BOSS_EVERY = 3;
  const BOSS_TIME = 12;
  const BOSS_REWARD = 150;

  const GOOD = [
    { emoji: "🪙", points: 10, weight: 5 },
    { emoji: "🫒", points: 5, weight: 4 },
    { emoji: "🍞", points: 20, weight: 2 },
    { emoji: "🍷", points: 30, weight: 1 },
    { emoji: "⭐", points: 50, weight: 1 },
  ];
  const BAD = ["🔥", "🗡", "🪰", "🧨"];

  let state = "menu";
  let score = 0;
  let best = Number(localStorage.getItem(BEST_KEY) || 0);
  let lives = 3;
  let elapsed = 0;
  let spawnTimer = 0;
  let invuln = 0;
  let shakeTime = 0;
  let newRecord = false;
  let combo = 0;
  let level = 1;
  let boss = null;
  let banner = null;
  let intro = 0;
  let audioCtx = null;
  let musicOn = true;
  let musicStep = 0;
  const BASSLINE = [220, 0, 220, 261.63, 0, 196, 220, 0, 220, 0, 293.66, 0, 261.63, 0, 196, 0];

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

  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === "suspended" && musicOn) audioCtx.resume();
  }

  function beep(freq, dur, type, gain, when = 0) {
    if (!audioCtx) return;
    const t = audioCtx.currentTime + when;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function sfx(name) {
    if (!audioCtx) return;
    if (name === "catch") {
      beep(660, 0.08, "square", 0.06);
      beep(880, 0.1, "square", 0.05, 0.06);
    } else if (name === "hit") {
      beep(160, 0.25, "sawtooth", 0.1);
      beep(90, 0.3, "sawtooth", 0.08, 0.05);
    } else if (name === "over") {
      beep(400, 0.15, "triangle", 0.09);
      beep(300, 0.15, "triangle", 0.09, 0.15);
      beep(180, 0.35, "triangle", 0.09, 0.3);
    } else if (name === "record") {
      [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.12, "square", 0.06, i * 0.09));
    } else if (name === "level") {
      beep(520, 0.1, "square", 0.06);
      beep(780, 0.14, "square", 0.06, 0.08);
    } else if (name === "boss") {
      beep(120, 0.4, "sawtooth", 0.12);
      beep(80, 0.5, "sawtooth", 0.1, 0.1);
    } else if (name === "start") {
      beep(440, 0.08, "square", 0.06);
      beep(660, 0.1, "square", 0.06, 0.07);
    }
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
    combo = 0;
    level = 1;
    boss = null;
    banner = null;
    intro = 4;
    player.x = W / 2;
    player.tilt = 0;
    items = [];
    particles = [];
    initClouds();
  }

  function startGame() {
    reset();
    state = "playing";
    sfx("start");
  }

  function gameOver() {
    state = "over";
    sfx("over");
    if (score > best) {
      best = Math.floor(score);
      localStorage.setItem(BEST_KEY, String(best));
      newRecord = true;
      sfx("record");
    }
  }

  function startMiniboss() {
    boss = {
      x: W / 2,
      y: H * 0.3,
      r: 44,
      dir: Math.random() < 0.5 ? -1 : 1,
      speed: 150 + level * 20,
      timeLeft: BOSS_TIME,
    };
    banner = { text: `🐕 ¡MINIBOSS! ¡Sobrevive ${BOSS_TIME} s!`, time: 2.4, color: "#e63946" };
    sfx("boss");
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
    const badChance = Math.min(0.5, 0.22 + elapsed * 0.005 + (boss ? 0.12 : 0));
    const isBad = Math.random() < badChance;
    const good = isBad ? null : pickGood();
    const emoji = isBad ? BAD[Math.floor(Math.random() * BAD.length)] : good.emoji;
    items.push({
      x: 30 + Math.random() * (W - 60),
      y: -30,
      vy: 160 + elapsed * 6 + (level - 1) * 20 + Math.random() * 60,
      r: isBad ? (emoji === "🧨" ? 25 : 20) : 18,
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
    intro = Math.max(0, intro - dt);
    if (banner) {
      banner.time -= dt;
      if (banner.time <= 0) banner = null;
    }

    const newLevel = Math.floor(score / LEVEL_STEP) + 1;
    if (newLevel > level) {
      level = newLevel;
      banner = { text: `¡NIVEL ${level}!`, time: 1.6, color: "#1e8e5a" };
      sfx("level");
      if (level % BOSS_EVERY === 0 && !boss) startMiniboss();
    }

    if (boss) {
      boss.x += boss.dir * boss.speed * dt;
      if (boss.x < boss.r + 10) {
        boss.x = boss.r + 10;
        boss.dir = 1;
      }
      if (boss.x > W - boss.r - 10) {
        boss.x = W - boss.r - 10;
        boss.dir = -1;
      }
      boss.y = H * 0.3 + Math.sin(elapsed * 3) * 34;
      boss.timeLeft -= dt;
      if (boss.timeLeft <= 0) {
        score += BOSS_REWARD;
        lives = Math.min(3, lives + 1);
        banner = { text: `¡Miniboss derrotado! +${BOSS_REWARD} y +1 ❤️`, time: 2.2, color: "#ffd166" };
        burst(boss.x, boss.y, "#ffd166", 30);
        sfx("record");
        boss = null;
      } else {
        const dxb = boss.x - player.x;
        const dyb = boss.y - player.y;
        if (dxb * dxb + dyb * dyb < (boss.r + player.r * 0.85) ** 2 && invuln <= 0) {
          lives -= 1;
          invuln = 1.6;
          shakeTime = 0.35;
          combo = 0;
          burst(player.x, player.y, "#e63946", 22);
          sfx("hit");
          if (lives <= 0) {
            gameOver();
            return;
          }
        }
      }
    }

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
      const base = Math.max(0.34, 1.0 - elapsed * 0.01 - (level - 1) * 0.03);
      spawnTimer = base * (boss ? 0.55 : 1) * (0.7 + Math.random() * 0.6);
    }

    const fallBoost = Math.min(340, elapsed * 6);
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
          combo += 1;
          score += it.points + Math.min(combo, 10);
          burst(it.x, it.y, "#ffd166", 12);
          sfx("catch");
        } else if (invuln <= 0) {
          lives -= 1;
          invuln = 1.6;
          shakeTime = 0.35;
          combo = 0;
          burst(player.x, player.y, "#e63946", 22);
          sfx("hit");
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
    for (let ty = 0; ty < H - 46; ty += 44) {
      for (let tx = 0; tx < W; tx += 44) {
        ctx.fillStyle = ((tx + ty) / 44) % 2 === 0 ? "#f6e7cf" : "#efdcbc";
        ctx.fillRect(tx, ty, 44, 44);
      }
    }
    const shade = ctx.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, "rgba(120, 72, 40, 0.14)");
    shade.addColorStop(1, "rgba(120, 72, 40, 0)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H - 46);

    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    for (const c of clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 24 * c.s, 0, Math.PI * 2);
      ctx.arc(c.x + 20 * c.s, c.y + 6 * c.s, 18 * c.s, 0, Math.PI * 2);
      ctx.arc(c.x - 22 * c.s, c.y + 7 * c.s, 16 * c.s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#8a5a3b";
    ctx.fillRect(0, 96, W, 10);
    const jars = [
      { x: 80, color: "#c0392b" },
      { x: W / 2, color: "#7d9b3a" },
      { x: W - 80, color: "#e67e22" },
    ];
    for (const j of jars) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      roundRect(j.x - 20, 52, 40, 44, 8);
      ctx.fill();
      ctx.fillStyle = j.color;
      roundRect(j.x - 16, 68, 32, 24, 5);
      ctx.fill();
      ctx.fillStyle = "#8a5a3b";
      ctx.fillRect(j.x - 22, 46, 44, 8);
    }

    ctx.fillStyle = "#8a5a3b";
    ctx.fillRect(0, H - 46, W, 46);
    ctx.fillStyle = "#a9714b";
    ctx.fillRect(0, H - 46, W, 6);
  }

  function drawChorizo() {
    const blink = invuln > 0 && Math.floor(invuln * 12) % 2 === 0;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.tilt);
    if (blink) ctx.globalAlpha = 0.35;

    const grad = ctx.createLinearGradient(0, -22, 0, 22);
    grad.addColorStop(0, "#e0694a");
    grad.addColorStop(0.5, "#b03a2e");
    grad.addColorStop(1, "#7e241b");
    ctx.fillStyle = grad;
    roundRect(-40, -16, 80, 32, 16);
    ctx.fill();
    ctx.strokeStyle = "#7e241b";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#8e2f24";
    ctx.beginPath();
    ctx.ellipse(-40, 0, 7, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(40, 0, 7, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f2c1a8";
    const specks = [[-24, -6], [-10, 5], [4, -7], [18, 6], [28, -4], [-4, 8], [12, -2]];
    for (const [sx, sy] of specks) {
      ctx.beginPath();
      ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#f5e6d3";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-44, -5);
    ctx.lineTo(-44, 5);
    ctx.moveTo(44, -5);
    ctx.lineTo(44, 5);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 224, 196, 0.5)";
    roundRect(-28, -12, 34, 6, 3);
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
      const glow = ctx.createRadialGradient(it.x, it.y, 2, it.x, it.y, it.r * 1.7);
      glow.addColorStop(0, it.good ? "rgba(255, 209, 102, 0.45)" : "rgba(230, 57, 70, 0.35)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(it.x, it.y, it.r * 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot * 0.4);
      ctx.font = `${it.r * 2}px serif`;
      ctx.fillText(it.emoji, 0, 0);
      ctx.restore();
    }
  }

  function drawBoss() {
    if (!boss) return;
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${boss.r * 2}px serif`;
    ctx.fillText("🐕", 0, 0);
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#e63946";
    ctx.fillText(`${Math.ceil(boss.timeLeft)}s`, 0, -boss.r - 12);
    ctx.restore();
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
    ctx.fillStyle = "#5a2d22";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(`Puntos: ${Math.floor(score)}`, 14, 12);
    ctx.font = "bold 15px sans-serif";
    ctx.fillStyle = "#1e8e5a";
    ctx.fillText(`Nivel ${level}`, 14, 40);
    if (combo >= 3) {
      ctx.fillStyle = "#d35400";
      ctx.fillText(`🔥 Combo x${combo}`, 14, 60);
    }
    const prog = (score % LEVEL_STEP) / LEVEL_STEP;
    ctx.fillStyle = "rgba(90, 45, 34, 0.22)";
    roundRect(W / 2 - 70, 16, 140, 9, 4.5);
    ctx.fill();
    if (prog > 0) {
      ctx.fillStyle = "#b03a2e";
      roundRect(W / 2 - 70, 16, 140 * prog, 9, 4.5);
      ctx.fill();
    }
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
    ctx.fillStyle = "rgba(255, 252, 245, 0.85)";
    roundRect(W / 2 - 210, H / 2 - 165, 420, 330, 16);
    ctx.fill();
    centerText(`🌭 CHORIZO RUN ${VERSION} 🌭`, H / 2 - 120, 34, "#b03a2e");
    centerText("Recoge 🪙 🫒 🍞 🍷 ⭐ y esquiva 🔥 🗡 🪰 🧨.", W / 2, H / 2 - 48, 16, "#5a2d22", false);
    centerText(`Nivel cada ${LEVEL_STEP} puntos · 🐕 miniboss cada ${BOSS_EVERY} niveles.`, W / 2, H / 2 - 20, 16, "#5a2d22", false);
    centerText(`Récord: ${best}`, W / 2, H / 2 + 30, 20, "#8a5a3b");
    const pulse = 1 + Math.sin(performance.now() / 300) * 0.05;
    ctx.save();
    ctx.translate(W / 2, H / 2 + 110);
    ctx.scale(pulse, pulse);
    centerText("Pulsa ESPACIO o toca para jugar", 0, 20, "#b03a2e");
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
    drawBoss();
    drawParticles();
    if (state !== "menu") drawChorizo();
    if (state === "playing") drawHUD();
    ctx.restore();

    if (banner && state === "playing") {
      ctx.globalAlpha = Math.min(1, banner.time);
      centerText(banner.text, H * 0.22, 24, banner.color);
      ctx.globalAlpha = 1;
    }
    if (state === "playing" && intro > 0) {
      ctx.globalAlpha = Math.min(0.92, intro);
      ctx.fillStyle = "rgba(20, 8, 12, 0.78)";
      roundRect(W / 2 - 205, H / 2 - 82, 410, 158, 12);
      ctx.fill();
      centerText("🎯 Recoge 🪙 🫒 🍞 🍷 para sumar puntos", H / 2 - 46, 16, "#ffd166", false);
      centerText("☠️ Esquiva 🔥 🗡 🪰 🧨 y al miniboss 🐕", H / 2 - 10, 16, "#f5e6d3", false);
      centerText("👆 Muévete con ◀ ▶, ← →, el ratón o el dedo", H / 2 + 26, 16, "#f5e6d3", false);
      centerText(`Nivel cada ${LEVEL_STEP} puntos · Miniboss cada ${BOSS_EVERY} niveles`, H / 2 + 58, 13, "#ffb4a2", false);
      ctx.globalAlpha = 1;
    }
    if (state === "paused") {
      ctx.fillStyle = "rgba(20, 8, 12, 0.7)";
      ctx.fillRect(0, 0, W, H);
      centerText("⏸ PAUSA", W / 2, H / 2 - 20, 34, "#ffd166");
      centerText("Toca la pantalla o pulsa ESPACIO para continuar", W / 2, H / 2 + 30, 17, "#ffffff", false);
    }

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

  function primaryAction() {
    ensureAudio();
    if (state === "playing") return;
    if (state === "paused") {
      state = "playing";
      return;
    }
    startGame();
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      primaryAction();
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
    primaryAction();
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
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") state = "paused";
  });

  canvas.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

  const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (isTouch) document.body.classList.add("touch");

  function bindHoldButton(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    const on = (e) => {
      e.preventDefault();
      keys[key] = true;
    };
    const off = (e) => {
      e.preventDefault();
      keys[key] = false;
    };
    el.addEventListener("pointerdown", on);
    el.addEventListener("pointerup", off);
    el.addEventListener("pointercancel", off);
    el.addEventListener("pointerleave", off);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  bindHoldButton("btn-left", "left");
  bindHoldButton("btn-right", "right");

  const btnSound = document.getElementById("btn-sound");
  const updateSoundBtn = () => {
    btnSound.textContent = musicOn ? "🔊" : "🔇";
  };
  btnSound.addEventListener("click", (e) => {
    e.preventDefault();
    ensureAudio();
    musicOn = !musicOn;
    if (audioCtx) {
      if (musicOn) audioCtx.resume();
      else audioCtx.suspend();
    }
    updateSoundBtn();
  });
  updateSoundBtn();

  setInterval(() => {
    if (!audioCtx || !musicOn || state !== "playing") return;
    const f = BASSLINE[musicStep % BASSLINE.length];
    if (f) beep(f, 0.14, "triangle", 0.045);
    musicStep += 1;
  }, 160);

  resize();
  window.addEventListener("resize", resize);
  initClouds();
  requestAnimationFrame(loop);
})();
