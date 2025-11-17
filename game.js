// Idle Pickaxe Miner — Deluxe
// Features: multiple ores, particles, sounds, skins, prestige, offline income, autosave

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

  // ores progression
  const ORES = [
    {name:'Stone', hp:50, reward:10},
    {name:'Copper', hp:120, reward:30},
    {name:'Iron', hp:340, reward:90},
    {name:'Gold', hp:900, reward:300},
    {name:'Diamond', hp:2400, reward:1000},
    {name:'Mythic', hp:7000, reward:4000}
  ];

  // skins shop
  const SKINS = [
    {name:'Basic', cost:0, color:'#ffb86b'},
    {name:'Rusty', cost:100, color:'#c07c4e'},
    {name:'Shiny', cost:500, color:'#f9f871'},
    {name:'Crystal', cost:2500, color:'#7be3ff'}
  ];

  function save(){ state.lastTick = Date.now(); localStorage.setItem(KEY, JSON.stringify(state)); }

  // init rock HP if null
  function ensureRock(){ 
    if (state.rockMax == null) {
      const o = ORES[state.rockIndex] || ORES[0];
      state.rockMax = o.hp * Math.pow(1.4, state.rockIndex);
      state.rockHP = state.rockMax;
    }
  }
  ensureRock();

  // offline accrual
  (function applyOffline(){
    const now = Date.now();
    const elapsed = Math.floor((now - (state.lastTick || now))/1000);
    if (elapsed > 0) {
      state.money += state.idle * elapsed;
    }
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

  // audio using WebAudio
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playClick() {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'square';
    o.frequency.value = 220 + Math.random()*200;
    g.gain.value = 0.08;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.06);
  }
  function playBreak(){
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type='sawtooth'; o.frequency.value = 120;
    g.gain.value = 0.12;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.frequency.linearRampToValueAtTime(700, audioCtx.currentTime + 0.25);
    o.stop(audioCtx.currentTime + 0.28);
  }

  // particles
  const particles = [];
  function spawnParticles(x,y,color,count=12){
    for(let i=0;i<count;i++){
      particles.push({
        x, y,
        vx: (Math.random()-0.5)*6,
        vy: (Math.random()-1.5)*6,
        life: 40 + Math.random()*30,
        color
      });
    }
  }

  // mine logic
  function prestigeMultiplier(){ return 1 + state.prestige*0.2; }
  function mine(amount){
    const mul = prestigeMultiplier();
    const dmg = amount * (state.dmg || 1);
    state.rockHP -= dmg;
    spawnParticles(W/2, H/2, '#fff', 8);
    playClick();
    if (state.rockHP <= 0){
      // reward scaled by ore reward and prestige
      const ore = ORES[state.rockIndex] || ORES[0];
      const baseReward = ore.reward;
      const reward = Math.round(baseReward * Math.pow(1.15, state.rockIndex) * mul);
      state.money += reward;
      playBreak();
      spawnParticles(W/2, H/2, '#ffd87a', 30);
      // advance ore occasionally
      state.rockIndex = Math.min(state.rockIndex + 1, ORES.length - 1);
      // increase rock strength
      state.rockMax = (ORES[state.rockIndex].hp) * Math.pow(1.4, state.rockIndex);
      state.rockHP = state.rockMax;
    }
    save();
  }

  // touch swipe detection for pickaxe
  let tStart = null;
  canvas.addEventListener('touchstart', e => { tStart = e.touches[0]; });
  canvas.addEventListener('touchend', e => {
    if (!tStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - tStart.clientX;
    const dy = t.clientY - tStart.clientY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    // direction could influence damage
    if (dist > 30){
      const power = Math.min(6, Math.floor(dist/20) + 1);
      mine(power);
    } else {
      // small tap = light hit
      mine(1);
    }
    tStart = null;
  });

  // also allow mouse clicks/drags on desktop
  let mDown = false, mStart = null;
  canvas.addEventListener('mousedown', e => { mDown=true; mStart=e; });
  canvas.addEventListener('mouseup', e => {
    if (!mStart) return;
    const dx = e.clientX - mStart.clientX;
    const dy = e.clientY - mStart.clientY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 30) mine(Math.min(6, Math.floor(dist/20)+1)); else mine(1);
    mDown=false; mStart=null;
  });

  // upgrades / shop
  function buildShop(){
    shopItems.innerHTML = '';
    // pickaxe upgrade
    const dmgUpgradeCost = Math.round(20 * Math.pow(1.6, state.dmg-1));
    const li1 = document.createElement('div'); li1.className='shop-item';
    li1.innerHTML = `<div>Upgrade Pickaxe +1 (cost ${dmgUpgradeCost})</div><div><button class="btn" id="buyDmg">Buy</button></div>`;
    shopItems.appendChild(li1);
    document.getElementById('buyDmg').onclick = ()=> {
      if (state.money >= dmgUpgradeCost){ state.money -= dmgUpgradeCost; state.dmg++; save(); updateUI(); buildShop(); } else alert('Not enough money');
    };

    // idle miner upgrade
    const idleCost = Math.round(50 * Math.pow(2, state.idle));
    const li2 = document.createElement('div'); li2.className='shop-item';
    li2.innerHTML = `<div>Hire Miner +1 (cost ${idleCost})</div><div><button class="btn" id="buyIdle">Buy</button></div>`;
    shopItems.appendChild(li2);
    document.getElementById('buyIdle').onclick = ()=> {
      if (state.money >= idleCost){ state.money -= idleCost; state.idle++; save(); updateUI(); buildShop(); } else alert('Not enough money');
    };

    // skins
    const skinHeader = document.createElement('div'); skinHeader.className='small'; skinHeader.textContent = 'Skins';
    shopItems.appendChild(skinHeader);
    SKINS.forEach(s=>{
      const owned = state.skinsOwned.includes(s.name);
      const div = document.createElement('div'); div.className='shop-item';
      div.innerHTML = `<div><span class="skin-preview" style="background:${s.color}"></span>${s.name} ${owned ? '(Owned)' : ''}</div>
        <div><button class="btn buy-skin" data-name="${s.name}" ${owned ? 'disabled' : ''}>${owned ? 'Owned' : 'Buy '+s.cost}</button></div>`;
      shopItems.appendChild(div);
    });
    // skin buy handlers
    Array.from(document.querySelectorAll('.buy-skin')).forEach(btn=>{
      btn.onclick = ()=>{
        const name = btn.dataset.name;
        const sdata = SKINS.find(x=>x.name===name);
        if (!sdata) return;
        if (state.skinsOwned.includes(name)) return alert('You own it');
        if (state.money >= sdata.cost){ state.money -= sdata.cost; state.skinsOwned.push(name); state.skin = name; save(); updateUI(); buildShop(); } else alert('Not enough money');
      };
    });

    // ores list and quick skip purchases (optional)
    const oresHeader = document.createElement('div'); oresHeader.className='small'; oresHeader.textContent='Ores';
    shopItems.appendChild(oresHeader);
    ORES.forEach((o,i)=>{
      const cost = Math.round(o.reward * Math.pow(3, i) * 0.5);
      const div = document.createElement('div'); div.className='shop-item';
      div.innerHTML = `<div>${o.name} (reward ${o.reward})</div><div><button class="btn buy-ore" data-index="${i}">Warp (${cost})</button></div>`;
      shopItems.appendChild(div);
    });
    Array.from(document.querySelectorAll('.buy-ore')).forEach(btn=>{
      btn.onclick = ()=>{
        const idx = parseInt(btn.dataset.index,10);
        const cost = Math.round(ORES[idx].reward * Math.pow(3, idx) * 0.5);
        if (state.money >= cost){
          state.money -= cost;
          state.rockIndex = idx;
          state.rockMax = (ORES[state.rockIndex].hp) * Math.pow(1.4, state.rockIndex);
          state.rockHP = state.rockMax;
          save(); updateUI(); buildShop();
        } else alert('Not enough money');
      };
    });
  }

  // prestige: resets progress for multiplier
  function doPrestige(){
    if (!confirm('Prestige will reset money, upgrades, and ores for a permanent multiplier. Continue?')) return;
    state.prestige++;
    state.money = 0;
    state.dmg = 1;
    state.idle = 0;
    state.rockIndex = 0;
    state.rockMax = null;
    state.rockHP = null;
    state.skinsOwned = ['Basic'];
    state.skin = 'Basic';
    save(); updateUI(); buildShop();
  }

  toShopBtn.onclick = ()=> { shopPanel.style.display='block'; buildShop(); updateUI(); };
  closeShopBtn.onclick = ()=> { shopPanel.style.display='none'; updateUI(); };
  prestigeBtn.onclick = ()=> doPrestige();

  // update HUD
  function updateUI(){
    moneyEl.textContent = Math.floor(state.money);
    dmgEl.textContent = state.dmg;
    idleEl.textContent = state.idle;
    rockTypeEl.textContent = (ORES[state.rockIndex]||ORES[0]).name;
    rockHPEl.textContent = Math.floor(state.rockHP || 0);
    rockMaxEl.textContent = Math.floor(state.rockMax || 0);
    skinNameEl.textContent = state.skin;
    prestigeMulEl.textContent = (1 + state.prestige*0.2).toFixed(2);
  }

  // game loop draw
  function draw(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    ctx.clearRect(0,0,W,H);

    // background noise
    const grd = ctx.createLinearGradient(0,0,0,H);
    grd.addColorStop(0,'#07101a'); grd.addColorStop(1,'#071827');
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,W,H);

    // draw rock
    const cx = W/2, cy = H/2;
    const r = Math.min(160, Math.min(W,H)*0.25);
    // rock color by ore
    const ore = ORES[state.rockIndex] || ORES[0];
    const rockCol = {
      'Stone':'#666',
      'Copper':'#8b5a2b',
      'Iron':'#9fa6ad',
      'Gold':'#f5c542',
      'Diamond':'#7ef0ff',
      'Mythic':'#c67cff'
    }[ore.name] || '#666';
    ctx.beginPath();
    ctx.fillStyle = rockCol;
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fill();
    // cracks visual based on damage
    const pct = state.rockHP / state.rockMax;
    ctx.strokeStyle = `rgba(0,0,0,${0.6 + (1-pct)*0.9})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for(let i=0;i<6;i++){
      const a1 = Math.PI*2*(i/6);
      const a2 = a1 + (Math.random()-0.5)*0.6;
      ctx.moveTo(cx + Math.cos(a1)*r*0.2, cy + Math.sin(a1)*r*0.2);
      ctx.lineTo(cx + Math.cos(a2)*(r*0.9*(0.6 + (1-pct)*0.4)), cy + Math.sin(a2)*(r*0.9*(0.6 + (1-pct)*0.4)));
    }
    ctx.stroke();

    // pickaxe swing preview
    // draw pickaxe depending on skin color and animation when mouse/touch recent
    const pickColor = (SKINS.find(s=>s.name===state.skin) || SKINS[0]).color || '#ffb86b';
    const swing = (Date.now()%400)/400; // simple bob
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(Date.now()/120)*0.15);
    ctx.fillStyle = pickColor;
    ctx.fillRect(r+10, -12, 70, 8);
    ctx.fillStyle = '#333';
    ctx.fillRect(r+70, -22, 18, 18);
    ctx.restore();

    // particles update
    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--;
      ctx.globalAlpha = Math.max(0, p.life/60);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
      ctx.globalAlpha = 1;
      if (p.life <= 0) particles.splice(i,1);
    }

    updateUI();
    requestAnimationFrame(draw);
  }
  draw();

  // autosave tick
  setInterval(()=> {
    state.money += state.idle;
    save();
  }, 1000);

  // window resize
  window.addEventListener('resize', ()=> { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

  // initial UI update and ensure values
  ensureInit();
  function ensureInit(){
    if (!state.rockMax){ state.rockMax = (ORES[state.rockIndex].hp) * Math.pow(1.4, state.rockIndex); state.rockHP = state.rockMax; }
    save(); updateUI();
  }

})();
