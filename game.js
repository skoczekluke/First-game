// Idle Pickaxe Miner — Deluxe (Glossy Pickaxe + Crack SFX)
// Integrated by Nova — pickaxe animation + embedded crack sound (base64)

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  // storage
  const KEY = 'idle_miner_v2_state';
  let state = JSON.parse(localStorage.getItem(KEY) || 'null') || {
    money: 0,
    dmg: 1,
    idle: 0,
    rockIndex: 0,
    rockHP: null,
    rockMax: null,
    skinsOwned: ['Basic'],
    skin: 'Basic',
    prestige: 0,
    lastTick: Date.now()
  };

  const ORES = [
    {name:'Stone', hp:50, reward:10},
    {name:'Copper', hp:120, reward:30},
    {name:'Iron', hp:340, reward:90},
    {name:'Gold', hp:900, reward:300},
    {name:'Diamond', hp:2400, reward:1000},
    {name:'Mythic', hp:7000, reward:4000}
  ];

  const SKINS = [
    {name:'Basic', cost:0, color:'#ffb86b'},
    {name:'Rusty', cost:100, color:'#c07c4e'},
    {name:'Shiny', cost:500, color:'#f9f871'},
    {name:'Crystal', cost:2500, color:'#7be3ff'}
  ];

  // embedded crack WAV base64
  const crackBase64 = "data:audio/wav;base64,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";

  // audio element
  const crackAudio = new Audio(crackBase64);
  crackAudio.volume = 0.8;

  function save(){ state.lastTick = Date.now(); localStorage.setItem(KEY, JSON.stringify(state)); }

  function ensureRock(){ 
    if (state.rockMax == null) {
      const o = ORES[state.rockIndex] || ORES[0];
      state.rockMax = Math.round(o.hp * Math.pow(1.4, state.rockIndex));
      state.rockHP = state.rockMax;
    }
  }
  ensureRock();

  // offline accrual
  (function applyOffline(){
    const now = Date.now();
    const elapsed = Math.floor((now - (state.lastTick || now))/1000);
    if (elapsed > 0) { state.money += state.idle * elapsed; }
  })();

  // UI refs
  const moneyEl = document.getElementById('money');
  const dmgEl = document.getElementById('dmg');
  const idleEl = document.getElementById('idle');
  const shopPanel = document.getElementById('shop');
  const shopItems = document.getElementById('shopItems');
  const toShopBtn = document.getElementById('toShop');
  const closeShopBtn = document.getElementById('closeShop');
  const prestigeBtn = document.getElementById('prestigeBtn');
  const rockTypeEl = document.getElementById('rockType');
  const rockHPEl = document.getElementById('rockHP');
  const rockMaxEl = document.getElementById('rockMax');
  const skinNameEl = document.getElementById('skinName');
  const prestigeMulEl = document.getElementById('prestigeMul');

  // particles
  const particles = [];
  function spawnParticles(x,y,color,count=12){
    for(let i=0;i<count;i++){ particles.push({ x,y, vx:(Math.random()-0.5)*6, vy:(Math.random()-1.5)*6, life:40+Math.random()*30, color }); }
  }

  // pickaxe swing animation state
  let swing = 0; // 0..1 animation progress
  let swingActive = false;
  let swingStrength = 1;

  function prestigeMultiplier() { return 1 + state.prestige*0.2; }

  function onHit(power){
    const mul = prestigeMultiplier();
    const dmg = power * (state.dmg || 1);
    state.rockHP -= dmg;
    spawnParticles(W/2, H/2, '#fff', 8);
    // play a short light hit using volume reduce
    try{ crackAudio.currentTime = 0; crackAudio.volume = Math.min(1, 0.6 + power*0.05); crackAudio.play(); }catch(e){}
    if (state.rockHP <= 0){
      const ore = ORES[state.rockIndex] || ORES[0];
      const baseReward = ore.reward;
      const reward = Math.round(baseReward * Math.pow(1.15, state.rockIndex) * mul);
      state.money += reward;
      // bigger crack sound
      try{ crackAudio.currentTime = 0; crackAudio.volume = 1.0; crackAudio.play(); }catch(e){}
      spawnParticles(W/2, H/2, '#ffd87a', 30);
      state.rockIndex = Math.min(state.rockIndex + 1, ORES.length - 1);
      state.rockMax = Math.round((ORES[state.rockIndex].hp) * Math.pow(1.4, state.rockIndex));
      state.rockHP = state.rockMax;
    }
    save();
  }

  // input handling (touch/mouse)
  let tStart = null;
  canvas.addEventListener('touchstart', e => { tStart = e.touches[0]; });
  canvas.addEventListener('touchend', e => { if (!tStart) return; const t = e.changedTouches[0]; const dx = t.clientX - tStart.clientX; const dy = t.clientY - tStart.clientY; const dist = Math.sqrt(dx*dx + dy*dy); if (dist > 30) { const power = Math.min(8, Math.floor(dist/18)+1); swingStrength = Math.min(2.5, 0.9 + power*0.25); startSwing(); onHit(power); } else { swingStrength = 0.9; startSwing(); onHit(1); } tStart = null; });

  let mDown=false, mStart=null;
  canvas.addEventListener('mousedown', e => { mDown=true; mStart=e; });
  canvas.addEventListener('mouseup', e => { if (!mStart) return; const dx = e.clientX - mStart.clientX; const dy = e.clientY - mStart.clientY; const dist = Math.sqrt(dx*dx + dy*dy); if (dist > 30) { const power = Math.min(8, Math.floor(dist/18)+1); swingStrength = Math.min(2.5, 0.9 + power*0.25); startSwing(); onHit(power); } else { swingStrength = 0.9; startSwing(); onHit(1); } mDown=false; mStart=null; });

  function startSwing(){ swing = 0; swingActive = true; }

  // shop building
  function buildShop(){
    shopItems.innerHTML = '';
    const dmgUpgradeCost = Math.round(20 * Math.pow(1.6, state.dmg-1));
    const li1 = document.createElement('div'); li1.className='shop-item';
    li1.innerHTML = `<div>Upgrade Pickaxe +1 (cost ${dmgUpgradeCost})</div><div><button class="btn" id="buyDmg">Buy</button></div>`;
    shopItems.appendChild(li1);
    document.getElementById('buyDmg').onclick = ()=> { if (state.money >= dmgUpgradeCost){ state.money -= dmgUpgradeCost; state.dmg++; save(); updateUI(); buildShop(); } else alert('Not enough money'); };

    const idleCost = Math.round(50 * Math.pow(2, state.idle));
    const li2 = document.createElement('div'); li2.className='shop-item';
    li2.innerHTML = `<div>Hire Miner +1 (cost ${idleCost})</div><div><button class="btn" id="buyIdle">Buy</button></div>`;
    shopItems.appendChild(li2);
    document.getElementById('buyIdle').onclick = ()=> { if (state.money >= idleCost){ state.money -= idleCost; state.idle++; save(); updateUI(); buildShop(); } else alert('Not enough money'); };

    const skinHeader = document.createElement('div'); skinHeader.className='small'; skinHeader.textContent = 'Skins';
    shopItems.appendChild(skinHeader);
    SKINS.forEach(s=>{
      const owned = state.skinsOwned.includes(s.name);
      const div = document.createElement('div'); div.className='shop-item';
      div.innerHTML = `<div><span class="skin-preview" style="background:${s.color}"></span>${s.name} ${owned ? '(Owned)' : ''}</div>
        <div><button class="btn buy-skin" data-name="${s.name}" ${owned ? 'disabled' : ''}>${owned ? 'Owned' : 'Buy '+s.cost}</button></div>`;
      shopItems.appendChild(div);
    });
    Array.from(document.querySelectorAll('.buy-skin')).forEach(btn=>{ btn.onclick = ()=>{ const name = btn.dataset.name; const sdata = SKINS.find(x=>x.name===name); if (!sdata) return; if (state.skinsOwned.includes(name)) return alert('You own it'); if (state.money >= sdata.cost){ state.money -= sdata.cost; state.skinsOwned.push(name); state.skin = name; save(); updateUI(); buildShop(); } else alert('Not enough money'); }; });

    const oresHeader = document.createElement('div'); oresHeader.className='small'; oresHeader.textContent='Ores';
    shopItems.appendChild(oresHeader);
    ORES.forEach((o,i)=>{ const cost = Math.round(o.reward * Math.pow(3, i) * 0.5); const div = document.createElement('div'); div.className='shop-item'; div.innerHTML = `<div>${o.name} (reward ${o.reward})</div><div><button class="btn buy-ore" data-index="${i}">Warp (${cost})</button></div>`; shopItems.appendChild(div); });
    Array.from(document.querySelectorAll('.buy-ore')).forEach(btn=>{ btn.onclick = ()=>{ const idx = parseInt(btn.dataset.index,10); const cost = Math.round(ORES[idx].reward * Math.pow(3, idx) * 0.5); if (state.money >= cost){ state.money -= cost; state.rockIndex = idx; state.rockMax = Math.round((ORES[state.rockIndex].hp) * Math.pow(1.4, state.rockIndex)); state.rockHP = state.rockMax; save(); updateUI(); buildShop(); } else alert('Not enough money'); }; });
  }

  function doPrestige(){ if (!confirm('Prestige will reset money, upgrades, and ores for a permanent multiplier. Continue?')) return; state.prestige++; state.money = 0; state.dmg = 1; state.idle = 0; state.rockIndex = 0; state.rockMax = null; state.rockHP = null; state.skinsOwned = ['Basic']; state.skin = 'Basic'; save(); updateUI(); buildShop(); }

  toShopBtn.onclick = ()=> { shopPanel.style.display='block'; buildShop(); updateUI(); };
  closeShopBtn.onclick = ()=> { shopPanel.style.display='none'; updateUI(); };
  prestigeBtn.onclick = ()=> doPrestige();

  function updateUI(){ moneyEl.textContent = Math.floor(state.money); dmgEl.textContent = state.dmg; idleEl.textContent = state.idle; rockTypeEl.textContent = (ORES[state.rockIndex]||ORES[0]).name; rockHPEl.textContent = Math.floor(state.rockHP || 0); rockMaxEl.textContent = Math.floor(state.rockMax || 0); skinNameEl.textContent = state.skin; prestigeMulEl.textContent = (1 + state.prestige*0.2).toFixed(2); }

  // draw glossy pickaxe
  function drawPickaxe(cx, cy, r, angle, skinColor){
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    // handle / shaft
    ctx.fillStyle = '#5a3b29';
    ctx.fillRect(-r*0.05, 10, r*0.9, r*0.14); // handle
    // grip
    ctx.fillStyle = '#3a2a20';
    ctx.fillRect(r*0.6, 10, r*0.1, r*0.14);
    // head - glossy metal
    ctx.beginPath();
    ctx.fillStyle = skinColor || '#ffb86b';
    ctx.moveTo(-r*0.1, -r*0.2);
    ctx.lineTo(r*0.9, -r*0.6);
    ctx.lineTo(r*0.9, r*0.6);
    ctx.lineTo(-r*0.1, r*0.2);
    ctx.closePath();
    ctx.fill();
    // shine
    ctx.beginPath();
    const grad = ctx.createLinearGradient(-r*0.1,-r*0.6,r*0.9,r*0.6);
    grad.addColorStop(0,'rgba(255,255,255,0.35)');
    grad.addColorStop(0.6,'rgba(255,255,255,0.05)');
    ctx.fillStyle = grad;
    ctx.moveTo(-r*0.05, -r*0.15);
    ctx.quadraticCurveTo(r*0.5, -r*0.5, r*0.85, 0);
    ctx.lineTo(r*0.85, 6);
    ctx.quadraticCurveTo(r*0.4, -r*0.05, -r*0.05, 6);
    ctx.fill();
    ctx.restore();
  }

  // main draw function
  function draw(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    ctx.clearRect(0,0,W,H);
    // background
    const grd = ctx.createLinearGradient(0,0,0,H);
    grd.addColorStop(0,'#07101a'); grd.addColorStop(1,'#071827');
    ctx.fillStyle = grd; ctx.fillRect(0,0,W,H);

    const cx = W/2, cy = H/2; const r = Math.min(180, Math.min(W,H)*0.26);
    // rock
    const ore = ORES[state.rockIndex] || ORES[0];
    const rockCol = {'Stone':'#666','Copper':'#8b5a2b','Iron':'#9fa6ad','Gold':'#f5c542','Diamond':'#7ef0ff','Mythic':'#c67cff'}[ore.name] || '#666';
    ctx.beginPath(); ctx.fillStyle = rockCol; ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
    // cracks
    const pct = state.rockHP / state.rockMax;
    ctx.strokeStyle = `rgba(0,0,0,${0.5 + (1-pct)*0.9})`; ctx.lineWidth = 4;
    ctx.beginPath();
    for(let i=0;i<6;i++){ const a1 = Math.PI*2*(i/6); const a2 = a1 + (Math.random()-0.5)*0.4; ctx.moveTo(cx + Math.cos(a1)*r*0.2, cy + Math.sin(a1)*r*0.2); ctx.lineTo(cx + Math.cos(a2)*(r*0.9*(0.6 + (1-pct)*0.4)), cy + Math.sin(a2)*(r*0.9*(0.6 + (1-pct)*0.4))); } ctx.stroke();

    // pickaxe animation (swing)
    if (swingActive) { swing += 0.06 * swingStrength; if (swing >= 1) { swing = 0; swingActive=false; } }
    const swingAngle = Math.sin(swing * Math.PI) * (-1.2 * swingStrength);

    // skin color
    const skinColor = (SKINS.find(s=>s.name===state.skin) || SKINS[0]).color || '#ffb86b';
    drawPickaxe(cx - r*0.2, cy - r*0.1, r*0.9, swingAngle, skinColor);

    // particles
    for(let i=particles.length-1;i>=0;i--){ const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life--; ctx.globalAlpha = Math.max(0, p.life/60); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 4, 4); ctx.globalAlpha = 1; if (p.life <= 0) particles.splice(i,1); }

    updateUI();
    requestAnimationFrame(draw);
  }

  draw();

  // autosave tick
  setInterval(()=> { state.money += state.idle; save(); }, 1000);

  window.addEventListener('resize', ()=> { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

  // ensure initial
  function ensureInit(){ if (!state.rockMax){ state.rockMax = Math.round((ORES[state.rockIndex].hp) * Math.pow(1.4, state.rockIndex)); state.rockHP = state.rockMax; } save(); updateUI(); }
  ensureInit();

})();
