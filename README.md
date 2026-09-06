# Linux Fundamentals

Linux-এর mental model ভিত্তিক একটা বাংলা কোর্স — বই, interactive simulator, আর hands-on lab।

## পাতা তিনটে

| File | কী আছে |
|---|---|
| `index.html` | মূল বই — ১৫টা chapter |
| `simulators.html` | Interactive simulator (permission, fork/exec, pipe, PATH, path resolve) |
| `labs.html` | Hands-on lab — ধাপে ধাপে করার কাজ |

## চালাবে কীভাবে

`index.html` আর `simulators.html` — দুটোই self-contained, browser-এ সরাসরি খুললেই চলে।

`labs.html` lab-গুলো আলাদা file থেকে `fetch()` করে আনে, তাই এটার জন্য একটা local server লাগে
(browser নিরাপত্তার কারণে `file://` থেকে অন্য file পড়তে দেয় না):

```bash
python3 -m http.server 8000
```

তারপর browser-এ <http://localhost:8000/labs.html>।

## Labs-এর গঠন

```
labs.html                 ← shell (topbar, sidebar, pager) — খালি খোলস
assets/labs.css           ← সব style
assets/labs.js            ← nav, fetch loader, checklist, copy বোতাম
labs/manifest.js          ← lab-এর তালিকা  ← নতুন lab এখানে যোগ করো
labs/hub.html             ← প্রথম স্ক্রিন
labs/lab-01-....html      ← এক lab = এক file
labs/lab-02-....html
```

### নতুন lab যোগ করা

দুটো কাজ, ব্যস:

**১.** `labs/` -এ নতুন একটা file বানাও। ভেতরে একটাই section থাকবে:

```html
<section class="lab">
  <div class="ch-head">
    <div class="ch-meta">
      <span class="ch-num">Lab 03</span>
      <span class="layer-tag">chapter 09</span>
      <span class="layer-tag time">≈ 40 মিনিট</span>
    </div>
    <h2>Lab-এর পুরো নাম</h2>
    <p class="ch-lede">এক প্যারায় পরিচয়।</p>
  </div>

  <div class="step" data-n="1">
    <h4>ধাপের নাম</h4>
    <p class="obj">লক্ষ্য: ...</p>
    <div class="code">
      <div class="code-bar"><span>bash</span><button class="copy">copy</button></div>
<pre>$ echo hello</pre>
    </div>
    <div class="out">
      <div class="out-bar">output</div>
<pre>hello</pre>
    </div>
  </div>

  <div class="check" data-lab="l3">
    <div class="ct">Lab 3 — চেকলিস্ট</div>
    <label><input type="checkbox"><span>প্রথম কাজ</span></label>
  </div>
</section>
```

**২.** `labs/manifest.js` -এ একটা ঘর যোগ করো:

```js
{
  id:    "l3",
  file:  "labs/lab-03-file-permissions.html",
  title: "File Permissions",
  tag:   "chapter 06",
  time:  "40 মিনিট",
  desc:  "chmod, chown — কে কী করতে পারবে ঠিক করা।"
}
```

Sidebar, hub card, pager, progress bar সব নিজে থেকেই ঠিক হয়ে যাবে।
`data-lab` -এর মান manifest-এর `id` -এর সাথে মিলতে হবে (checklist save হওয়ার জন্য)।

### কাজে লাগার class

| Class | কী |
|---|---|
| `.step` + `data-n="1"` | নম্বর দেওয়া ধাপ |
| `.code` + `.code-bar` | copy বোতাম সহ command block |
| `.out` + `.out-bar` | expected output |
| `.box tip/note/warn/danger/confuse` | callout |
| `details.solve` | লুকানো সমাধান |
| `.check` | checklist (localStorage-এ save হয়) |
