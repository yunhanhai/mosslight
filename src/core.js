export const WORLD = { width: 2000, height: 1500 };
export const MAX_ENEMIES = 145;
export const KEEPERS = {
  lantern: {
    name: "提灯",
    desc: "均衡的萤火，适合初次守夜。",
    icon: "spark",
    stats: {},
    summary: "生命 100 · 伤害 16 · 移速 175",
    detail: "均衡起步 · 冲刺冷却 3.8 秒",
  },
  leaf: {
    name: "护叶",
    desc: "带着叶环出发，近身更从容。",
    icon: "leaf",
    stats: { maxHp: 110, damage: 13, speed: 165, orbit: 6, dashCooldown: 4.2 },
    summary: "生命 110 · 叶环 6 · 移速 165",
    detail: "萤火伤害 13 · 冲刺冷却 4.2 秒",
  },
  wind: {
    name: "逐风",
    desc: "脚步轻快，冲刺更频繁。",
    icon: "bolt",
    stats: { maxHp: 85, damage: 14, speed: 200, dashCooldown: 2.9 },
    summary: "生命 85 · 移速 200 · 冲刺 2.9 秒",
    detail: "萤火伤害 14 · 无初始叶环",
  },
};
export const ENEMY_NAMES = {
  mite: "苔螨",
  beetle: "甲虫",
  wisp: "游光",
  boss: "噬光巨蛾",
};
export const MODES = {
  night: {
    label: "守夜",
    duration: 180,
    spawnScale: 1,
    damageScale: 1,
    bossAt: 140,
  },
  practice: {
    label: "练习",
    duration: 90,
    spawnScale: 0.65,
    damageScale: 0.55,
    bossAt: 65,
  },
  daily: {
    label: "每日守望",
    duration: 180,
    spawnScale: 1,
    damageScale: 1,
    bossAt: 140,
  },
};
export const UPGRADES = [
  {
    id: "power",
    name: "炽热萤火",
    desc: "萤火伤害增加 30%。",
    max: 5,
    icon: "spark",
    apply: (s) => {
      s.damage *= 1.3;
    },
  },
  {
    id: "haste",
    name: "风铃草",
    desc: "萤火发射速度增加 22%。",
    max: 5,
    icon: "bolt",
    apply: (s) => {
      s.interval *= 0.82;
    },
  },
  {
    id: "multi",
    name: "双生花",
    desc: "每次多发射一枚萤火。",
    max: 3,
    icon: "leaf",
    apply: (s) => {
      s.bolts++;
    },
  },
  {
    id: "speed",
    name: "轻叶步",
    desc: "移动速度增加 16%。",
    max: 3,
    icon: "leaf",
    apply: (s) => {
      s.speed *= 1.16;
    },
  },
  {
    id: "magnet",
    name: "引光苔",
    desc: "微光吸引范围增加 50%。",
    max: 3,
    icon: "spark",
    apply: (s) => {
      s.magnet *= 1.5;
    },
  },
  {
    id: "vitality",
    name: "晨露",
    desc: "生命上限 +20，并恢复 40 生命。",
    max: 4,
    icon: "heart",
    apply: (s, g) => {
      s.maxHp += 20;
      g.heal(40);
    },
  },
  {
    id: "orbit",
    name: "护身叶",
    desc: "身旁长出叶环，持续伤害靠近的敌人。",
    max: 4,
    icon: "leaf",
    apply: (s) => {
      s.orbit += 10;
    },
  },
  {
    id: "dash",
    name: "夜行风",
    desc: "冲刺冷却缩短 20%，并恢复 15 生命。",
    max: 3,
    icon: "bolt",
    apply: (s, g) => {
      s.dashCooldown *= 0.8;
      g.heal(15);
    },
  },
];
export function rng(seed = Date.now()) {
  let n = seed >>> 0;
  const random = () => {
    n = (n + 0x6d2b79f5) >>> 0;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  random.getState = () => n;
  return random;
}
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const timeText = (n) =>
  `${Math.floor(Math.max(0, n) / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(Math.max(0, n) % 60)
    .toString()
    .padStart(2, "0")}`;
export const scoreFor = (g) =>
  Math.round(
    g.kills * 12 +
      g.collected * 5 +
      g.elapsed * 2 +
      (g.status === "won" ? 1200 : 0),
  );
export const xpFor = (level) => 8 + level * 5;
export function chinaDay(now = Date.now()) {
  return new Date(now + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
export function dailyChallenge(day = chinaDay()) {
  if (typeof day !== "string" || !/^20\d{2}-\d{2}-\d{2}$/.test(day))
    return null;
  const date = new Date(`${day}T00:00:00Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== day
  )
    return null;
  let seed = 2166136261;
  for (const char of `mosslight:daily:v1:${day}`)
    seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  const keeper =
    Object.keys(KEEPERS)[Math.floor(rng(seed)() * Object.keys(KEEPERS).length)];
  return { day, seed, keeper };
}
// Earliest swept-circle entry on a segment. Also works in relative coordinates
// for two moving objects, avoiding endpoint misses and array-order hits.
export function sweepCircle(from, to, center, radius) {
  const x = from.x - center.x,
    y = from.y - center.y,
    dx = to.x - from.x,
    dy = to.y - from.y,
    c = x * x + y * y - radius * radius;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  if (a <= 1e-12) return null;
  const b = x * dx + y * dy,
    discriminant = b * b - a * c;
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / a;
  return t >= 0 && t <= 1 ? t : null;
}
export function upgradePreview(id, game) {
  const s = game.stats;
  const number = (n) => Number(n.toFixed(1));
  return (
    {
      power: `伤害 ${number(s.damage)} → ${number(s.damage * 1.3)}`,
      haste: `每秒 ${number(1 / s.interval)} → ${number(1 / (s.interval * 0.82))} 发`,
      multi: `每次 ${s.bolts} → ${s.bolts + 1} 枚`,
      speed: `移速 ${Math.round(s.speed)} → ${Math.round(s.speed * 1.16)}`,
      magnet: `吸引 ${Math.round(s.magnet)} → ${Math.round(s.magnet * 1.5)}`,
      vitality: `生命上限 ${s.maxHp} → ${s.maxHp + 20}`,
      orbit: `叶环伤害 ${s.orbit} → ${s.orbit + 10}`,
      dash: `冷却 ${number(s.dashCooldown)} → ${number(s.dashCooldown * 0.8)} 秒`,
    }[id] || ""
  );
}
export function upgradeHint(id, game) {
  const s = game.stats,
    p = game.player;
  const healed = (amount, max = s.maxHp) =>
    Math.max(0, Math.min(amount, max - p.hp));
  const hints = {
    power:
      s.bolts > 1
        ? `让每次的 ${s.bolts} 枚萤火都更有力`
        : "让单枚萤火更容易驱散虫影",
    haste:
      s.bolts > 1 ? "与多发萤火配合，覆盖更多虫影" : "缩短两次发射之间的空隙",
    multi: "虫影较多时可同时照亮多个目标",
    speed: "更快绕开虫群，也更容易追上微光",
    magnet: "扩大拾取范围，减少贴近虫群取光",
    vitality: `此刻可恢复 ${Math.round(healed(40, s.maxHp + 20))} 生命`,
    orbit:
      s.orbit > 0
        ? "加强已有叶环，每 0.55 秒触发"
        : "建立近身叶环，每 0.55 秒触发",
    dash:
      healed(15) > 0
        ? `此刻可恢复 ${Math.round(healed(15))} 生命`
        : "更频繁冲刺，保持脱身余地",
  };
  return hints[id] || "";
}

export class Game {
  constructor({
    mode = "night",
    seed = Date.now(),
    keeper = "lantern",
    challengeDate = null,
  } = {}) {
    this.mode = Object.hasOwn(MODES, mode) ? mode : "night";
    this.rules = MODES[this.mode];
    const challenge =
      this.mode === "daily"
        ? dailyChallenge(challengeDate) || dailyChallenge()
        : null;
    this.challengeDate = challenge?.day || null;
    if (challenge) {
      seed = challenge.seed;
      keeper = challenge.keeper;
    }
    this.seed = seed >>> 0;
    this.keeper = Object.hasOwn(KEEPERS, keeper) ? keeper : "lantern";
    this.random = rng(this.seed);
    this.status = "playing";
    this.elapsed = 0;
    this.level = 1;
    this.xp = 0;
    this.kills = 0;
    this.collected = 0;
    this.nextId = 1;
    this.player = {
      x: 1000,
      y: 750,
      hp: 100,
      radius: 13,
      invincible: 0,
      dashTime: 0,
      dashRemaining: 0,
      lastX: 1,
      lastY: 0,
      dashX: 1,
      dashY: 0,
    };
    this.stats = {
      maxHp: 100,
      speed: 175,
      damage: 16,
      interval: 0.66,
      bolts: 1,
      magnet: 78,
      orbit: 0,
      dashCooldown: 3.8,
      ...KEEPERS[this.keeper].stats,
    };
    this.player.hp = this.stats.maxHp;
    this.metrics = { damageDealt: 0, damageTaken: 0, dashes: 0, healed: 0 };
    this.lastHit = null;
    this.enemies = [];
    this.bullets = [];
    this.motes = [];
    this.events = [];
    this.build = {};
    this.choices = [];
    this.shotTimer = 0.1;
    this.spawnTimer = 0.7;
    this.orbitTimer = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.wave = 0;
    this.viewport = { width: 1120, height: 660 };
    this.attackRange = 520;
    this.dashSerial = 0;
    this.dewSeeded = false;
    this.rerolls = 1;
  }
  setViewport(width, height) {
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    )
      return;
    this.viewport = {
      width: clamp(width, 320, 1800),
      height: clamp(height, 260, 1200),
    };
    this.attackRange = clamp(Math.min(width, height) * 0.5 + 32, 240, 520);
  }
  seedDew() {
    if (this.dewSeeded) return;
    this.dewSeeded = true;
    for (let i = 0; i < 5; i++)
      this.motes.push({
        x: this.player.x + 90 + i * 34,
        y: this.player.y - 20 + Math.sin(i * 0.85) * 20,
        value: 3,
        radius: 5,
        life: this.rules.duration,
        source: "dew",
      });
  }
  emit(type, data = {}) {
    this.events.push({ type, ...data });
    if (this.events.length > 200) this.events.shift();
  }
  pause() {
    if (this.status === "playing") this.status = "paused";
  }
  resume() {
    if (this.status === "paused") this.status = "playing";
  }
  dash(input = { x: 0, y: 0 }) {
    const p = this.player;
    if (this.status !== "playing" || p.dashRemaining > 0) return false;
    const dx = Number.isFinite(input.x) ? input.x : 0,
      dy = Number.isFinite(input.y) ? input.y : 0,
      length = Math.hypot(dx, dy);
    p.dashX = length > 0.08 ? dx / length : p.lastX;
    p.dashY = length > 0.08 ? dy / length : p.lastY;
    p.lastX = p.dashX;
    p.lastY = p.dashY;
    p.dashTime = 0.19;
    this.dashSerial++;
    this.metrics.dashes++;
    p.dashRemaining = this.stats.dashCooldown;
    p.invincible = Math.max(p.invincible, 0.42);
    this.emit("dash", { x: p.x, y: p.y });
    return true;
  }
  spawn(type) {
    const p = this.player,
      halfW = Math.max(280, this.viewport.width * 0.5 + 65),
      halfH = Math.max(280, this.viewport.height * 0.5 + 65);
    let x, y;
    // Spawn just beyond this device's view, rejecting directions outside the map.
    // The safety distance remains the same even when the player reaches a corner.
    for (let attempt = 0; attempt < 16; attempt++) {
      const angle = this.random() * Math.PI * 2,
        dx = Math.cos(angle),
        dy = Math.sin(angle);
      const reach = Math.min(
        halfW / (Math.abs(dx) || 0.001),
        halfH / (Math.abs(dy) || 0.001),
      );
      x = p.x + dx * reach;
      y = p.y + dy * reach;
      if (x >= 30 && x <= WORLD.width - 30 && y >= 30 && y <= WORLD.height - 30)
        break;
      x = null;
    }
    if (x === null) {
      const dx = WORLD.width / 2 - p.x,
        dy = WORLD.height / 2 - p.y,
        d = Math.hypot(dx, dy) || 1;
      x = clamp(p.x + (dx / d) * 400, 30, WORLD.width - 30);
      y = clamp(p.y + (dy / d) * 400, 30, WORLD.height - 30);
    }
    const phase = this.elapsed / this.rules.duration;
    const config = {
      mite: {
        hp: 20 + phase * 14,
        speed: 42 + phase * 17,
        radius: 12,
        damage: 10,
        xp: 2,
      },
      beetle: {
        hp: 57 + phase * 30,
        speed: 30 + phase * 13,
        radius: 19,
        damage: 16,
        xp: 4,
      },
      wisp: {
        hp: 15 + phase * 13,
        speed: 83 + phase * 16,
        radius: 9,
        damage: 9,
        xp: 3,
      },
      boss: {
        hp: this.mode === "practice" ? 420 : 750,
        speed: 39,
        radius: 43,
        damage: 25,
        xp: 40,
      },
    };
    const c = config[type] || config.mite;
    const e = {
      id: this.nextId++,
      type,
      x,
      y,
      ...c,
      maxHp: c.hp,
      hit: 0,
      phase: this.random() * 6.28,
      chargeCooldown: 3,
      windup: 0,
      chargeRemaining: 0,
      charges: 0,
    };
    this.enemies.push(e);
    return e;
  }
  shoot() {
    const p = this.player;
    const targets = this.enemies
      .map((e) => ({ e, d: (e.x - p.x) ** 2 + (e.y - p.y) ** 2 }))
      .filter(({ e, d }) => e.hp > 0 && d < this.attackRange ** 2)
      .sort((a, b) => a.d - b.d)
      .slice(0, this.stats.bolts)
      .map(({ e }) => e);
    if (!targets.length) return;
    for (let i = 0; i < this.stats.bolts; i++) {
      const target = targets[i % targets.length];
      let a = Math.atan2(target.y - p.y, target.x - p.x);
      if (i >= targets.length) a += (i % 2 ? 1 : -1) * 0.12;
      this.bullets.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(a) * 460,
        vy: Math.sin(a) * 460,
        life: 1.5,
        damage: this.stats.damage,
        radius: 5,
      });
    }
    this.emit("shoot");
  }
  damageEnemy(e, amount) {
    if (e.hp <= 0) return;
    const dealt = Math.min(e.hp, amount);
    this.metrics.damageDealt += dealt;
    e.hp -= amount;
    e.hit = 0.12;
    this.emit("hit", { x: e.x, y: e.y, amount: Math.round(dealt) });
    if (e.hp <= 0) {
      this.kills++;
      this.emit("kill", { x: e.x, y: e.y, boss: e.type === "boss" });
      if (e.type === "boss") {
        this.bossDefeated = true;
        this.emit("bossDown");
      }
      this.motes.push({
        x: e.x,
        y: e.y,
        value: e.xp,
        radius: e.type === "boss" ? 10 : 4,
        life: 35,
      });
    }
  }
  heal(amount) {
    const restored = Math.min(
      amount,
      Math.max(0, this.stats.maxHp - this.player.hp),
    );
    if (restored <= 0) return 0;
    this.player.hp += restored;
    this.metrics.healed += restored;
    this.emit("heal", {
      x: this.player.x,
      y: this.player.y,
      amount: Math.round(restored),
    });
    return restored;
  }
  addXp(value) {
    this.xp += value;
    this.collected += value;
    this.checkLevel();
  }
  checkLevel() {
    if (this.status !== "playing") return;
    if (this.xp >= xpFor(this.level)) {
      this.xp -= xpFor(this.level);
      this.level++;
      this.status = "choosing";
      const pool = UPGRADES.filter((u) => (this.build[u.id] || 0) < u.max);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      this.choices = pool.slice(0, 3).map((u) => u.id);
      if (!this.choices.length) {
        this.heal(25);
        this.status = "playing";
      } else this.emit("level", { level: this.level });
    }
  }
  choose(id) {
    if (this.status !== "choosing" || !this.choices.includes(id)) return false;
    const u = UPGRADES.find((u) => u.id === id);
    u.apply(this.stats, this);
    this.build[id] = (this.build[id] || 0) + 1;
    this.player.invincible = Math.max(this.player.invincible, 0.65);
    this.choices = [];
    this.status = "playing";
    this.emit("upgrade", { id });
    this.checkLevel();
    return true;
  }
  canReroll() {
    return (
      this.status === "choosing" &&
      this.rerolls > 0 &&
      UPGRADES.some(
        (u) => (this.build[u.id] || 0) < u.max && !this.choices.includes(u.id),
      )
    );
  }
  reroll() {
    if (!this.canReroll()) return false;
    const available = UPGRADES.filter((u) => (this.build[u.id] || 0) < u.max);
    const fresh = available.filter((u) => !this.choices.includes(u.id)),
      previous = available.filter((u) => this.choices.includes(u.id));
    for (const pool of [fresh, previous])
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    this.choices = [...fresh, ...previous].slice(0, 3).map((u) => u.id);
    this.rerolls--;
    this.emit("reroll");
    return true;
  }
  update(delta, input = { x: 0, y: 0 }) {
    if (this.status !== "playing") return;
    const dt = clamp(Number.isFinite(delta) ? delta : 0, 0, 0.05);
    if (dt === 0) return;
    this.elapsed = Math.min(this.rules.duration, this.elapsed + dt);
    if (this.elapsed >= this.rules.duration) {
      this.status = "won";
      this.emit("end");
      return;
    }
    const p = this.player;
    const playerFrom = { x: p.x, y: p.y };
    p.invincible = Math.max(0, p.invincible - dt);
    p.dashRemaining = Math.max(0, p.dashRemaining - dt);
    let ix = Number.isFinite(input.x) ? input.x : 0,
      iy = Number.isFinite(input.y) ? input.y : 0;
    const len = Math.hypot(ix, iy);
    if (len > 1) {
      ix /= len;
      iy /= len;
    }
    const dashDt = Math.min(dt, p.dashTime),
      normalDt = dt - dashDt,
      dashing = dashDt > 0;
    if (len > 0.08 && normalDt > 0) {
      p.lastX = ix / Math.hypot(ix, iy);
      p.lastY = iy / Math.hypot(ix, iy);
    }
    p.dashTime = Math.max(0, p.dashTime - dashDt);
    p.x = clamp(
      p.x + this.stats.speed * (ix * normalDt + p.dashX * 4.5 * dashDt),
      25,
      WORLD.width - 25,
    );
    p.y = clamp(
      p.y + this.stats.speed * (iy * normalDt + p.dashY * 4.5 * dashDt),
      25,
      WORLD.height - 25,
    );
    const wave = Math.floor(this.elapsed / 30);
    if (wave > this.wave) {
      this.wave = wave;
      this.emit("wave", { wave });
    }
    this.spawnTimer -= dt;
    if (
      this.spawnTimer <= 0 &&
      this.enemies.length < (this.bossSpawned ? MAX_ENEMIES : MAX_ENEMIES - 1)
    ) {
      const progress = this.elapsed / this.rules.duration;
      this.spawnTimer =
        Math.max(0.2, 1.1 - progress * 0.82) / this.rules.spawnScale;
      const roll = this.random();
      this.spawn(
        this.elapsed > 45 && roll < 0.2
          ? "wisp"
          : this.elapsed > 22 && roll < 0.4
            ? "beetle"
            : "mite",
      );
      if (
        this.elapsed > 85 &&
        this.enemies.length <
          (this.bossSpawned ? MAX_ENEMIES : MAX_ENEMIES - 1) &&
        this.random() < 0.34
      )
        this.spawn("mite");
    }
    if (!this.bossSpawned && this.elapsed >= this.rules.bossAt) {
      this.bossSpawned = true;
      this.spawn("boss");
      this.emit("boss");
    }
    this.shotTimer -= dt;
    if (this.shotTimer <= 0) {
      this.shotTimer = this.stats.interval;
      this.shoot();
    }
    this.orbitTimer -= dt;
    this.separateEnemies(dt);
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e.hit = Math.max(0, e.hit - dt);
      const enemyFrom = { x: e.x, y: e.y };
      const dx = p.x - e.x,
        dy = p.y - e.y,
        d = Math.hypot(dx, dy) || 1;
      let speed =
        e.speed *
        (e.type === "wisp"
          ? 1 + Math.sin(this.elapsed * 3 + e.phase) * 0.25
          : 1);
      let charging = false;
      if (e.type === "boss") {
        e.chargeCooldown -= dt;
        if (e.windup > 0) {
          e.windup = Math.max(0, e.windup - dt);
          speed = 0;
          if (e.windup === 0) {
            e.chargeRemaining = 0.6;
            e.chargeCooldown = 6;
          }
        } else if (e.chargeRemaining > 0) {
          charging = true;
          const chargeDt = Math.min(dt, e.chargeRemaining);
          e.chargeRemaining = Math.max(0, e.chargeRemaining - chargeDt);
          e.x = clamp(e.x + e.chargeX * 330 * chargeDt, 35, WORLD.width - 35);
          e.y = clamp(e.y + e.chargeY * 330 * chargeDt, 35, WORLD.height - 35);
        } else if (e.chargeCooldown <= 0) {
          e.windup = 0.85;
          e.chargeX = dx / d;
          e.chargeY = dy / d;
          speed = 0;
          e.charges++;
          this.emit("bossWarn", { first: e.charges === 1 });
        }
      }
      if (!charging) {
        e.x += (dx / d) * speed * dt;
        e.y += (dy / d) * speed * dt;
      }
      const relativeFrom = {
          x: enemyFrom.x - playerFrom.x,
          y: enemyFrom.y - playerFrom.y,
        },
        relativeTo = { x: e.x - p.x, y: e.y - p.y },
        origin = { x: 0, y: 0 };
      const contact =
        sweepCircle(relativeFrom, relativeTo, origin, e.radius + p.radius) !==
        null;
      const currentDx = p.x - e.x,
        currentDy = p.y - e.y,
        currentD = Math.hypot(currentDx, currentDy),
        awayX = currentD > 0.001 ? -currentDx / currentD : Math.cos(e.id),
        awayY = currentD > 0.001 ? -currentDy / currentD : Math.sin(e.id);
      if (
        dashing &&
        sweepCircle(
          relativeFrom,
          relativeTo,
          origin,
          e.radius + p.radius + 22,
        ) !== null &&
        e.lastDash !== this.dashSerial
      ) {
        e.lastDash = this.dashSerial;
        this.damageEnemy(e, this.stats.damage * 0.75);
        if (
          e.type !== "boss" ||
          (!charging && e.windup <= 0 && e.chargeRemaining <= 0)
        ) {
          e.x = clamp(e.x + awayX * 72, 25, WORLD.width - 25);
          e.y = clamp(e.y + awayY * 72, 25, WORLD.height - 25);
        }
      }
      if (
        this.stats.orbit > 0 &&
        this.orbitTimer <= 0 &&
        currentD < 82 + e.radius
      )
        this.damageEnemy(e, this.stats.orbit);
      if (e.hp > 0 && contact && p.invincible <= 0) {
        const taken = Math.min(p.hp, e.damage * this.rules.damageScale);
        p.hp = Math.max(0, p.hp - taken);
        this.metrics.damageTaken += taken;
        this.lastHit = { type: e.type, damage: taken };
        p.invincible = 0.85;
        if (
          e.type !== "boss" ||
          (!charging && e.windup <= 0 && e.chargeRemaining <= 0)
        ) {
          e.x = clamp(e.x + awayX * 25, 25, WORLD.width - 25);
          e.y = clamp(e.y + awayY * 25, 25, WORLD.height - 25);
        }
        this.emit("hurt", { x: p.x, y: p.y, amount: Math.ceil(taken) });
        if (p.hp <= 0) {
          this.status = "lost";
          this.emit("end");
          return;
        }
      }
    }
    if (this.orbitTimer <= 0) this.orbitTimer = 0.55;
    for (const b of this.bullets) {
      if (b.life <= 0) continue;
      const step = Math.min(dt, b.life),
        end = { x: b.x + b.vx * step, y: b.y + b.vy * step };
      let target = null,
        earliest = Infinity;
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        const t = sweepCircle(b, end, e, e.radius + b.radius);
        if (t !== null && t < earliest) {
          earliest = t;
          target = e;
        }
      }
      b.x += b.vx * step * (target ? earliest : 1);
      b.y += b.vy * step * (target ? earliest : 1);
      b.life -= dt;
      if (target) {
        this.damageEnemy(target, b.damage);
        b.life = 0;
      }
    }
    this.bullets = this.bullets.filter((b) => b.life > 0);
    this.enemies = this.enemies.filter((e) => e.hp > 0);
    for (const m of this.motes) {
      m.life -= dt;
      const dx = p.x - m.x,
        dy = p.y - m.y,
        d = Math.hypot(dx, dy);
      if (d < this.stats.magnet) {
        const step = Math.min(
          d,
          (190 + Math.max(0, this.stats.magnet - d) * 4) * dt,
        );
        m.x += (dx / (d || 1)) * step;
        m.y += (dy / (d || 1)) * step;
      }
      if (d < 19 && m.life > 0 && this.status === "playing") {
        m.life = 0;
        this.addXp(m.value);
        this.emit("collect", { x: m.x, y: m.y });
      }
    }
    this.motes = this.motes.filter((m) => m.life > 0);
    // Deterministic coalescing keeps long sessions bounded without losing XP.
    while (this.motes.length > 240) {
      const a = this.motes.shift(),
        b = this.motes[0];
      b.value += a.value;
    }
  }
  separateEnemies(dt) {
    // A local grid keeps correction local; never consume RNG or move the boss.
    const buckets = new Map(),
      size = 96,
      offsets = new Map();
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const cx = Math.floor(e.x / size),
        cy = Math.floor(e.y / size);
      for (let x = cx - 1; x <= cx + 1; x++)
        for (let y = cy - 1; y <= cy + 1; y++)
          for (const other of buckets.get(`${x},${y}`) || []) {
            let dx = e.x - other.x,
              dy = e.y - other.y;
            const d = Math.hypot(dx, dy),
              minimum = (e.radius + other.radius) * 0.72;
            if (d >= minimum) continue;
            if (d < 0.001) {
              const angle =
                (((e.id * 97 + other.id * 53) % 360) * Math.PI) / 180;
              dx = Math.cos(angle);
              dy = Math.sin(angle);
            } else {
              dx /= d;
              dy /= d;
            }
            const push = (minimum - d) * 0.5;
            for (const [target, sign] of [
              [e, 1],
              [other, -1],
            ]) {
              if (target.type === "boss") continue;
              const offset = offsets.get(target) || { x: 0, y: 0 };
              offset.x += dx * push * sign;
              offset.y += dy * push * sign;
              offsets.set(target, offset);
            }
          }
      const key = `${cx},${cy}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(e);
    }
    for (const [e, offset] of offsets) {
      const factor = Math.min(
        1,
        (95 * dt) / (Math.hypot(offset.x, offset.y) || 1),
      );
      e.x = clamp(e.x + offset.x * factor, 25, WORLD.width - 25);
      e.y = clamp(e.y + offset.y * factor, 25, WORLD.height - 25);
    }
  }
}
