// The words arrive the way the camera moves: a heading a line at a time out of
// its own mask, then the paragraph, the button and the rows behind it, each
// once, in the order the page is read. Nothing here animates anything but
// position and fade, and nothing is hidden unless this module is running.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;
let watcher = null;

function lines(heading) {
  const parts = [];
  let line = document.createElement('span');
  for (const node of [...heading.childNodes]) {
    if (node.nodeName === 'BR') { parts.push(line); line = document.createElement('span'); continue; }
    line.append(node);
  }
  parts.push(line);
  heading.replaceChildren(...parts.map((body, index) => {
    const mask = document.createElement('span');
    mask.className = 'line-mask';
    body.className = 'line-body';
    body.style.setProperty('--line-index', String(index));
    mask.append(body);
    return mask;
  }));
}

// Siblings that arrive together come in one behind the other, so a row of
// three cards reads left to right rather than all at once.
function order(element) {
  const family = [...(element.parentElement?.children ?? [])].filter(node => node.hasAttribute('data-arrive'));
  const place = family.indexOf(element);
  element.style.setProperty('--arrive-index', String(place < 0 ? 0 : place));
}

function start() {
  const settled = [...document.querySelectorAll('[data-lines],[data-arrive]')];
  // A heading is only cut into lines when those lines are going to move. Cut
  // and left still, its own line break is gone and the two lines run together.
  if (reduced.matches) {
    root.dataset.motion = 'still';
    settled.forEach(element => element.setAttribute('data-arrived', ''));
    return;
  }
  for (const heading of document.querySelectorAll('[data-lines]')) lines(heading);
  root.dataset.motion = 'on';
  settled.forEach(order);
  watcher = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.setAttribute('data-arrived', '');
      watcher.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: .08 });
  settled.forEach(element => watcher.observe(element));
}

function stand() {
  root.dataset.motion = 'still';
  document.querySelectorAll('[data-lines],[data-arrive]').forEach(element => element.setAttribute('data-arrived', ''));
  watcher?.disconnect();
  watcher = null;
}

start();
reduced.addEventListener('change', () => { if (reduced.matches) stand(); });
window.addEventListener('pagehide', event => { if (!event.persisted) { watcher?.disconnect(); watcher = null; } });
