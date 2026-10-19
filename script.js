(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const scene = $("#scene");
  const catSprite = $("#catSprite");
  const placedItems = $("#placedItems");
  const toyGrid = $("#toyGrid");
  const catNameInput = $("#catNameInput");
  const catNameDisplay = $("#catNameDisplay");
  const bubble = $("#bubble");
  const mood = $("#mood");
  const sceneHint = $("#sceneHint");
  const statusText = $("#statusText");
  const liveAnnouncement = $("#liveAnnouncement");
  const growthBadge = $("#growthBadge");

  const toys = [
    { id:"ball", emoji:"🧶", name:"毛線球", category:"toy", action:"play", duration:1400, message:"這顆球好好玩！", effect:"💖" },
    { id:"fish-toy", emoji:"🐟", name:"魚魚玩偶", category:"toy", action:"play", duration:1300, message:"抓到魚魚了！", effect:"✨" },
    { id:"feather", emoji:"🪶", name:"羽毛棒", category:"toy", action:"play", duration:1500, message:"再揮高一點嘛！", effect:"⭐" },
    { id:"mouse", emoji:"🐭", name:"小老鼠", category:"toy", action:"play", duration:1200, message:"嘿！別跑！", effect:"💫" },
    { id:"box", emoji:"📦", name:"紙箱", category:"toy", action:"hide", duration:1300, message:"這裡是我的秘密基地！", effect:"💗" },
    { id:"bell", emoji:"🔔", name:"小鈴鐺", category:"toy", action:"play", duration:1000, message:"叮鈴鈴～", effect:"✨" },
    { id:"yarn", emoji:"🧵", name:"彩色線球", category:"toy", action:"play", duration:1200, message:"好多顏色！", effect:"💖" },
    { id:"laser", emoji:"🔴", name:"紅點點", category:"toy", action:"play", duration:1100, message:"等等我！", effect:"⭐" },
    { id:"milk", emoji:"🥛", name:"一杯牛奶", category:"food", action:"drink", duration:1300, consume:true, message:"咕嚕咕嚕，好喝！", effect:"💕" },
    { id:"fish", emoji:"🐠", name:"鮮魚點心", category:"food", action:"eat", duration:1400, consume:true, message:"魚魚最好吃了！", effect:"💗" },
    { id:"cookie", emoji:"🍪", name:"小餅乾", category:"food", action:"eat", duration:1200, consume:true, message:"喀滋喀滋！", effect:"✨" },
    { id:"cake", emoji:"🍰", name:"奶油蛋糕", category:"food", action:"sniff", duration:1000, message:"聞起來甜甜的。", effect:"💖" },
    { id:"strawberry", emoji:"🍓", name:"草莓", category:"food", action:"sniff", duration:1000, message:"紅紅的，好香！", effect:"💕" },
    { id:"coffee", emoji:"☕", name:"苦苦咖啡", category:"food", action:"forbidden", duration:1100, consume:true, message:"我不能吃這個！", effect:"💢", forbidden:true },
    { id:"chocolate", emoji:"🍫", name:"濃郁巧克力", category:"food", action:"forbidden", duration:1100, consume:true, message:"我不能吃這個！", effect:"💢", forbidden:true },
    { id:"bed", emoji:"🛏️", name:"軟綿綿小床", category:"cozy", action:"sleep", duration:1600, message:"呼嚕……好舒服。", effect:"💤" },
    { id:"pillow", emoji:"🧸", name:"抱抱玩偶", category:"cozy", action:"love", duration:1300, message:"抱緊緊！", effect:"💗" },
    { id:"plant", emoji:"🪴", name:"小盆栽", category:"cozy", action:"sniff", duration:1000, message:"聞聞新鮮的葉子。", effect:"🍃" },
    { id:"flower", emoji:"🌷", name:"小花束", category:"cozy", action:"sniff", duration:1100, message:"好漂亮的花！", effect:"🌸" },
    { id:"cushion", emoji:"🩷", name:"愛心抱枕", category:"cozy", action:"love", duration:1200, message:"這個抱枕好柔軟。", effect:"💞" },
    { id:"book", emoji:"📚", name:"故事書", category:"cozy", action:"sniff", duration:900, message:"今天要讀什麼呢？", effect:"✨" },
    { id:"music", emoji:"🎵", name:"音樂盒", category:"cozy", action:"listen", duration:1300, message:"喵～這首歌好聽！", effect:"🎶" }
  ];

  const state = {
    catName: "奶油",
    affection: 10,
    interactions: 0,
    snackCount: 0,
    growthLevel: 0,
    selectedToy: null,
    objects: [],
    targetId: null,
    x: 50,
    y: 64,
    mode: "idle",
    generation: 0,
    timer: null,
    category: "all"
  };

  const catEmojis = ["🐈", "🐈‍⬛", "😺", "🐱"];
  let activeCatEmoji = catEmojis[0];

  function announce(message) { liveAnnouncement.textContent = message; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function wait(ms, generation) {
    return new Promise(resolve => {
      state.timer = window.setTimeout(() => resolve(generation === state.generation), ms);
    });
  }
  function random(min, max) { return Math.random() * (max - min) + min; }

  function updateCatName() {
    const name = (catNameInput.value || "").trim().slice(0, 12) || "奶油";
    state.catName = name;
    catNameDisplay.textContent = `${name}的小房間`;
    catSprite.setAttribute("aria-label", `${name}正在活動`);
  }

  function updateStats() {
    $("#affectionValue").textContent = state.affection;
    $("#interactionValue").textContent = state.interactions;
    $("#snackValue").textContent = state.snackCount;
    $("#affectionValue").classList.toggle("negative-value", state.affection < 0);
  }

  function setMood(text) { mood.textContent = text; }
  function setBubble(text) {
    if (!text) { bubble.hidden = true; bubble.textContent = ""; return; }
    bubble.textContent = text;
    bubble.hidden = false;
  }
  function setAnimation(name = "") {
    catSprite.className = `cat-sprite${name ? ` ${name}` : ""}`;
  }
  function setCatPosition(x, y) {
    state.x = clamp(x, 8, 92);
    state.y = clamp(y, 23, 82);
    const catArea = $(".cat-area");
    catArea.style.left = `${state.x}%`;
    catArea.style.top = `${state.y}%`;
  }

  function spawnEffects(x, y, emojis) {
    const sceneRect = scene.getBoundingClientRect();
    emojis.forEach((emoji, index) => {
      const effect = document.createElement("span");
      effect.textContent = emoji;
      effect.setAttribute("aria-hidden", "true");
      Object.assign(effect.style, {
        position: "absolute", zIndex: "12", left: `${x}%`, top: `${y}%`,
        transform: `translate(${(index - (emojis.length - 1) / 2) * 18}px, 0)`,
        fontSize: "21px", pointerEvents: "none",
        transition: "transform .75s ease, opacity .75s ease"
      });
      scene.append(effect);
      requestAnimationFrame(() => {
        effect.style.transform = `translate(${(index - (emojis.length - 1) / 2) * 18}px, -35px) scale(1.15)`;
        effect.style.opacity = "0";
      });
      window.setTimeout(() => effect.remove(), 800);
    });
  }

  function updateGrowth() {
    const nextLevel = Math.min(3, Math.floor(state.snackCount / 3));
    if (nextLevel <= state.growthLevel) return;
    state.growthLevel = nextLevel;
    const sizes = [64, 76, 88, 100];
    catSprite.style.setProperty("--cat-size", `${sizes[nextLevel]}px`);
    const labels = ["", "🌱 長大一點了！", "🌷 又長大了！", "👑 巨大貓咪！"];
    growthBadge.textContent = labels[nextLevel];
    growthBadge.hidden = false;
    spawnEffects(state.x, state.y - 10, ["✨", "💖", "⭐"]);
    announce(`${state.catName}長大了！目前成長階段 ${nextLevel}。`);
    window.setTimeout(() => { growthBadge.hidden = true; }, 2400);
  }

  function renderToyGrid() {
    toyGrid.replaceChildren();
    toys.filter(toy => state.category === "all" || toy.category === state.category).forEach(toy => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `toy-card${state.selectedToy === toy.id ? " selected" : ""}${toy.forbidden ? " forbidden" : ""}`;
      button.draggable = true;
      button.dataset.toyId = toy.id;
      button.setAttribute("aria-pressed", String(state.selectedToy === toy.id));
      button.innerHTML = `<span class="toy-emoji" aria-hidden="true">${toy.emoji}</span><span class="toy-name"></span>`;
      $(".toy-name", button).textContent = toy.name;
      button.addEventListener("click", () => {
        state.selectedToy = state.selectedToy === toy.id ? null : toy.id;
        renderToyGrid();
        sceneHint.textContent = state.selectedToy ? `已選擇「${toy.name}」，點房間放置或拖曳進房間。` : "選一個右側物品，再點房間放置吧！";
      });
      button.addEventListener("dragstart", event => {
        state.selectedToy = toy.id;
        event.dataTransfer.setData("text/plain", toy.id);
        event.dataTransfer.effectAllowed = "copy";
        renderToyGrid();
      });
      toyGrid.append(button);
    });
  }

  function addObject(toyId, x, y) {
    const toy = toys.find(item => item.id === toyId);
    if (!toy) return;
    if (toy.consume && toy.action !== "forbidden") {
      // Consumable objects can be placed more than once; each placement is a new instance.
    }
    const instanceId = `${toy.id}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
    const element = document.createElement("button");
    element.type = "button";
    element.className = "placed-item";
    element.dataset.instanceId = instanceId;
    element.setAttribute("aria-label", `與${toy.name}互動`);
    element.innerHTML = `<span class="placed-emoji" aria-hidden="true">${toy.emoji}</span><span class="item-label"></span>`;
    $(".item-label", element).textContent = toy.name;
    element.style.left = `${clamp(x, 8, 92)}%`;
    element.style.top = `${clamp(y, 20, 84)}%`;
    element.addEventListener("click", event => {
      event.stopPropagation();
      if (state.mode === "interacting" || state.mode === "walking") return;
      interactWith({ instanceId, toy, element, x: clamp(x, 8, 92), y: clamp(y, 20, 84) });
    });
    placedItems.append(element);
    state.objects.push({ instanceId, toy, element, x: clamp(x, 8, 92), y: clamp(y, 20, 84) });
    state.selectedToy = null;
    renderToyGrid();
    sceneHint.textContent = `${toy.emoji} ${toy.name} 已放進房間，點它就能和貓咪互動！`;
    setMood("🧸 新東西出現了！");
    announce(`${toy.name}已放進房間。`);
  }

  function sceneCoordinates(event) {
    const rect = scene.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 8, 92),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 20, 84)
    };
  }

  scene.addEventListener("click", event => {
    if (event.target.closest(".placed-item")) return;
    if (!state.selectedToy) return;
    const point = sceneCoordinates(event);
    addObject(state.selectedToy, point.x, point.y);
  });
  scene.addEventListener("dragover", event => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; });
  scene.addEventListener("drop", event => {
    event.preventDefault();
    const toyId = event.dataTransfer.getData("text/plain");
    if (!toys.some(toy => toy.id === toyId)) return;
    const point = sceneCoordinates(event);
    addObject(toyId, point.x, point.y);
  });

  document.querySelectorAll(".category-tab").forEach(button => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      document.querySelectorAll(".category-tab").forEach(tab => {
        const active = tab === button;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-pressed", String(active));
      });
      renderToyGrid();
    });
  });

  catNameInput.addEventListener("input", updateCatName);

  async function interactWith(object) {
    if (state.mode !== "idle") return;
    const generation = state.generation;
    state.mode = "walking";
    state.targetId = object.instanceId;
    object.element.classList.add("is-target");
    setBubble("");
    setMood("🐾 走過去看看");
    statusText.textContent = `${state.catName}正在靠近物品`;
    setAnimation("is-walking");

    const side = object.x >= state.x ? -1 : 1;
    const approachX = clamp(object.x + side * 7, 8, 92);
    const approachY = clamp(object.y, 23, 82);
    catSprite.style.setProperty("--facing", object.x >= state.x ? "1" : "-1");
    setCatPosition(approachX, approachY);
    if (!await wait(760, generation)) return;
    if (generation !== state.generation) return;

    setAnimation(object.toy.action === "sleep" ? "is-sleeping" :
      ["eat", "drink"].includes(object.toy.action) ? "is-eating" :
      ["play", "hide", "love", "listen"].includes(object.toy.action) ? "is-playing" : "is-sniffing");
    state.mode = "interacting";
    object.element.classList.remove("is-target");
    object.element.classList.add("is-used");
    setMood(object.toy.forbidden ? "💢 這個不能吃！" : "💗 開心互動中");
    setBubble(object.toy.forbidden ? "嗯？這個不行！" : object.toy.message);
    if (!object.toy.forbidden) spawnEffects(object.x, object.y - 6, [object.toy.effect || "✨"]);
    if (!await wait(object.toy.duration, generation)) return;
    if (generation !== state.generation) return;

    if (object.toy.action === "forbidden") {
      object.element.remove();
      state.objects = state.objects.filter(item => item.instanceId !== object.instanceId);
      state.affection -= 2;
      state.interactions += 1;
      updateStats();
      setAnimation("is-happy");
      setBubble("我不能吃這個！");
      setMood("💢 這個不能吃！");
      sceneHint.textContent = `${object.toy.emoji} 被丟掉了！親密度 -2`;
      spawnEffects(state.x, state.y - 10, state.affection < 0 ? ["💢", "💨"] : ["💨", "💢"]);
      announce(`${state.catName}說：我不能吃這個！親密度減少 2。`);
      if (!await wait(1100, generation)) return;
      if (generation !== state.generation) return;
      finishInteraction();
      return;
    }

    state.interactions += 1;
    state.affection += object.toy.action === "love" ? 3 : 1;
    if (object.toy.category === "food" && ["eat", "drink"].includes(object.toy.action)) {
      state.snackCount += 1;
      updateGrowth();
    }
    updateStats();
    if (object.toy.consume) {
      object.element.remove();
      state.objects = state.objects.filter(item => item.instanceId !== object.instanceId);
      sceneHint.textContent = `${object.toy.emoji} ${object.toy.name}吃完了！`;
    } else {
      object.element.classList.remove("is-used");
      sceneHint.textContent = `${object.toy.emoji} ${object.toy.name}互動完成！還可以再玩一次。`;
    }
    setBubble(object.toy.message);
    setMood(state.affection < 0 ? "💢 有點不開心" : "☀️ 心情不錯");
    spawnEffects(state.x, state.y - 10, [object.toy.action === "love" ? "💖" : "✨"]);
    announce(`${state.catName}和${object.toy.name}互動完成，親密度增加。`);
    if (!await wait(850, generation)) return;
    if (generation !== state.generation) return;
    finishInteraction();
  }

  function finishInteraction() {
    setBubble("");
    setAnimation("");
    state.targetId = null;
    state.mode = "idle";
    statusText.textContent = `${state.catName}正在等你`;
    if (state.affection < 0) {
      setMood("💢 有點不開心");
      sceneHint.textContent = `${state.catName}頭上冒出怒氣符號了，試著用喜歡的玩具安撫牠吧。`;
    } else {
      setMood("☀️ 自由漫步中");
    }
  }

  $("#resetButton").addEventListener("click", resetGame);

  function resetGame() {
    state.generation += 1;
    if (state.timer) window.clearTimeout(state.timer);
    state.catName = "奶油";
    catNameInput.value = "奶油";
    state.affection = 10;
    state.interactions = 0;
    state.snackCount = 0;
    state.growthLevel = 0;
    state.selectedToy = null;
    state.objects = [];
    state.targetId = null;
    state.mode = "idle";
    state.category = "all";
    placedItems.replaceChildren();
    growthBadge.hidden = true;
    catSprite.style.setProperty("--cat-size", "64px");
    catSprite.style.setProperty("--facing", "1");
    setCatPosition(50, 64);
    setAnimation("");
    setBubble("");
    setMood("☀️ 自由漫步中");
    statusText.textContent = "貓咪正在等你";
    sceneHint.textContent = "選一個右側物品，再點房間放置吧！";
    document.querySelectorAll(".category-tab").forEach(tab => {
      const active = tab.dataset.category === "all";
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
    updateCatName();
    updateStats();
    renderToyGrid();
    announce("遊戲已重新開始。");
  }

  function init() {
    catSprite.textContent = activeCatEmoji;
    catSprite.style.setProperty("--facing", "1");
    setCatPosition(50, 64);
    updateCatName();
    updateStats();
    renderToyGrid();
  }

  init();
})();
