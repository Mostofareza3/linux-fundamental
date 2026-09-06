"use strict";
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];

/* ============================================================
   THEME  — বই আর সিমুলেটরের সাথে একই key
   ============================================================ */
(function(){
  let t=null;
  try{ t=localStorage.getItem("lf-theme"); }catch(e){}
  if(!t) t=(window.matchMedia && matchMedia("(prefers-color-scheme:dark)").matches)?"dark":"light";
  document.documentElement.dataset.theme=t;
  const SUN='<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/>';
  const MOON='<path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z"/>';
  const icon=$("#themeIcon");
  const paint=()=>{ icon.innerHTML = document.documentElement.dataset.theme==="dark"?MOON:SUN; };
  paint();
  $("#themeBtn").onclick=()=>{
    const n=document.documentElement.dataset.theme==="dark"?"light":"dark";
    document.documentElement.dataset.theme=n;
    try{ localStorage.setItem("lf-theme",n); }catch(e){}
    paint();
  };
})();

/* ============================================================
   STATE
   ============================================================ */
const MANIFEST = window.LAB_MANIFEST || [];
const PAGES    = [{id:"l0", file:"labs/hub.html", title:"শুরু এখান থেকে", hub:true}, ...MANIFEST];

const content = $("#content");
const toc     = $("#toc");
const loaded  = new Map();   // id -> <section> element
let cur = 0;

/* ============================================================
   SIDEBAR  — manifest থেকেই তৈরি
   ============================================================ */
PAGES.forEach((p,i)=>{
  const li=document.createElement("li");
  const b=document.createElement("button");
  b.className="toc-item";
  b.type="button";
  b.dataset.lab=p.id;
  b.innerHTML=`<span class="tocnum">${i===0?"—":String(i).padStart(2,"0")}</span>`+
              `<span>${p.title}</span><span class="dot"></span>`;
  b.onclick=()=>go(i);
  li.appendChild(b); toc.appendChild(li);
});
const tocBtns=$$(".toc-item");

/* ============================================================
   LOADER  — প্রতিটা lab আলাদা file থেকে fetch হয়
   ============================================================ */
function skeleton(){
  const d=document.createElement("div");
  d.className="lab-loading";
  d.innerHTML=`<div class="sk sk-eyebrow"></div><div class="sk sk-title"></div>`+
              `<div class="sk sk-line"></div><div class="sk sk-line"></div><div class="sk sk-line short"></div>`;
  return d;
}

function failure(page,err){
  const d=document.createElement("section");
  d.className="lab active";
  const local = location.protocol === "file:";
  d.innerHTML=
    `<div class="ch-head"><div class="ch-meta"><span class="ch-num">Error</span></div>`+
    `<h2>Lab টা load করা গেল না</h2></div>`+
    `<div class="box danger"><div class="box-t">${local?"file:// দিয়ে খোলা হয়েছে":"যা হয়েছে"}</div>`+
    (local
      ? `<p>Browser নিরাপত্তার কারণে <code>file://</code> থেকে অন্য file পড়তে দেয় না (CORS)। এই পাতাটা দেখতে হলে একটা ছোট local server লাগবে — project folder-এ গিয়ে:</p>`+
        `<div class="code"><div class="code-bar"><span>bash</span></div><pre>python3 -m http.server 8000</pre></div>`+
        `<p>তারপর browser-এ <code>http://localhost:8000/labs.html</code> খোলো।</p>`
      : `<p><code>${page.file}</code> file টা পাওয়া যায়নি।</p><p class="mono" style="font-size:13px">${String(err)}</p>`)+
    `</div>`;
  return d;
}

async function load(page){
  if(loaded.has(page.id)) return loaded.get(page.id);

  const holder=skeleton();
  content.insertBefore(holder, $(".pager"));

  let el;
  try{
    const res=await fetch(page.file, {cache:"no-cache"});
    if(!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const html=await res.text();

    const tmp=document.createElement("div");
    tmp.innerHTML=html;
    el=tmp.querySelector("section.lab");
    if(!el) throw new Error("file-এ কোনো <section class=\"lab\"> পাওয়া যায়নি");

    /* manifest-এর তথ্য section-এ বসিয়ে দাও — একই জিনিস দু'জায়গায় লিখতে হবে না */
    el.id = page.id;
    if(!page.hub){
      el.dataset.title = page.title;
      el.dataset.layer = page.tag  || "";
      el.dataset.time  = page.time || "";
      el.dataset.desc  = page.desc || "";
    }
  }catch(err){
    console.error("lab load failed:", page.file, err);
    el=failure(page,err);
  }

  holder.replaceWith(el);
  loaded.set(page.id, el);
  wire(el);
  return el;
}

/* ============================================================
   NAV
   ============================================================ */
async function go(i, push=true){
  if(i<0 || i>=PAGES.length) return;

  const el = await load(PAGES[i]);

  loaded.forEach(sec=>sec.classList.remove("active"));
  tocBtns.forEach(b=>b.classList.remove("active"));
  cur=i;
  el.classList.add("active");
  tocBtns[cur].classList.add("active");

  const prev=PAGES[i-1], next=PAGES[i+1];
  $("#prevBtn").disabled=!prev;
  $("#nextBtn").disabled=!next;
  $("#prevLbl").textContent=prev?prev.title:"";
  $("#nextLbl").textContent=next?next.title:"";

  if(push && location.hash!=="#"+PAGES[i].id) history.pushState(null,"","#"+PAGES[i].id);
  window.scrollTo({top:0,behavior:"instant"});
  $("#sidebar").classList.remove("open");
  $("#scrim").classList.remove("open");

  if(PAGES[i].hub) buildHub();
  paintProgress();
  updateProgress();

  /* পরেরটা আগেভাগে এনে রাখো — click করলে সাথে সাথে খুলবে */
  if(next && !loaded.has(next.id)) setTimeout(()=>load(next),400);
}
$("#prevBtn").onclick=()=>go(cur-1);
$("#nextBtn").onclick=()=>go(cur+1);
addEventListener("hashchange",()=>{
  const i=PAGES.findIndex(p=>"#"+p.id===location.hash);
  if(i>=0 && i!==cur) go(i,false);
});
$("#menuBtn").onclick=()=>{ $("#sidebar").classList.toggle("open"); $("#scrim").classList.toggle("open"); };
$("#scrim").onclick  =()=>{ $("#sidebar").classList.remove("open"); $("#scrim").classList.remove("open"); };
addEventListener("keydown",e=>{
  if(e.target.matches("input,select,textarea")) return;
  if(e.key==="ArrowRight") go(cur+1);
  if(e.key==="ArrowLeft")  go(cur-1);
});

/* ---------- reading progress bar ---------- */
const progress=$("#progress");
function updateProgress(){
  const max=document.documentElement.scrollHeight-innerHeight;
  const within=max>40?Math.min(scrollY/max,1):0;
  progress.style.width=((cur+within)*(100/PAGES.length)).toFixed(2)+"%";
}
addEventListener("scroll",updateProgress,{passive:true});
addEventListener("resize",updateProgress);

/* ============================================================
   HUB  — manifest থেকে card বানায়
   ============================================================ */
function buildHub(){
  const grid=$("#hubGrid");
  if(!grid || grid.dataset.built) return;
  grid.dataset.built="1";

  MANIFEST.forEach((p,i)=>{
    const c=document.createElement("button");
    c.className="hub-card";
    c.dataset.lab=p.id;
    c.innerHTML=
      `<div class="hn">Lab ${String(i+1).padStart(2,"0")}${p.time?" · "+p.time:""}</div>`+
      `<div class="hdone">✓ শেষ</div>`+
      `<div class="ht">${p.title}</div>`+
      `<div class="hd2">${p.desc||""}</div>`+
      (p.tag?`<span class="hc">${p.tag}</span>`:"");
    c.onclick=()=>go(i+1);
    grid.appendChild(c);
  });

  const reset=$("#resetBtn");
  if(reset) reset.onclick=()=>{
    state={}; save();
    $$(".check input").forEach(i=>{ i.checked=false; });
    paintProgress();
  };
}

/* ============================================================
   CHECKLIST  — localStorage-এ অগ্রগতি
   ============================================================ */
const KEY="lf-labs-progress";
let state={};
try{ state=JSON.parse(localStorage.getItem(KEY)||"{}"); }catch(e){ state={}; }
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(state)); }catch(e){} }

/* checklist সব lab-এর জন্য গোনা হয় — load হোক বা না হোক */
function labDone(id){
  const box=loaded.get(id)?.querySelector(".check");
  if(box){
    const boxes=$$("input",box);
    return boxes.length>0 && boxes.every(b=>b.checked);
  }
  /* এখনো load হয়নি — শুধু save করা তথ্য থেকে বলা যাবে না কতগুলো ঘর ছিল,
     তাই ঐ lab-এর জন্য মোট সংখ্যা মনে রাখি */
  const total=state["_total:"+id];
  if(!total) return false;
  for(let i=0;i<total;i++) if(!state[id+":"+i]) return false;
  return true;
}

function paintProgress(){
  let done=0;
  MANIFEST.forEach(p=>{
    const ok=labDone(p.id);
    if(ok) done++;
    tocBtns.forEach(b=>{ if(b.dataset.lab===p.id) b.classList.toggle("done",ok); });
    $$(".hub-card").forEach(c=>{ if(c.dataset.lab===p.id) c.classList.toggle("done",ok); });
  });
  const count=$("#hubCount"), bar=$("#hubBar");
  const total=MANIFEST.length;
  if(count) count.textContent=`${done} / ${total} শেষ`;
  if(bar)   bar.style.width = total?(done/total*100)+"%":"0";
}

/* ============================================================
   WIRE  — নতুন load হওয়া section-এ copy বোতাম + checklist লাগানো
   ============================================================ */
function wire(root){
  /* copy */
  $$(".copy",root).forEach(btn=>{
    if(btn.id==="resetBtn") return;
    btn.onclick=()=>{
      const pre=btn.closest(".code")?.querySelector("pre");
      if(!pre) return;
      const text=pre.innerText
        .split("\n")
        .map(l=>l.replace(/^\$\s?/,""))
        .join("\n")
        .trim();
      const done=()=>{
        btn.textContent="copied"; btn.classList.add("done");
        setTimeout(()=>{ btn.textContent="copy"; btn.classList.remove("done"); },1400);
      };
      const fallback=()=>{
        const ta=document.createElement("textarea");
        ta.value=text; ta.style.position="fixed"; ta.style.opacity="0";
        document.body.appendChild(ta); ta.select();
        try{ document.execCommand("copy"); done(); }catch(e){ btn.textContent="failed"; }
        document.body.removeChild(ta);
      };
      if(navigator.clipboard?.writeText){
        navigator.clipboard.writeText(text).then(done,fallback);
      } else fallback();
    };
  });

  /* checklist */
  $$(".check",root).forEach(box=>{
    const id=box.dataset.lab;
    const inputs=$$("input",box);
    state["_total:"+id]=inputs.length;
    save();
    inputs.forEach((inp,i)=>{
      const k=id+":"+i;
      inp.checked=!!state[k];
      inp.onchange=()=>{
        if(inp.checked) state[k]=1; else delete state[k];
        save(); paintProgress();
      };
    });
  });
}

/* ============================================================
   BOOT
   ============================================================ */
(function(){
  const i=PAGES.findIndex(p=>"#"+p.id===location.hash);
  go(i>=0?i:0,false);
})();
