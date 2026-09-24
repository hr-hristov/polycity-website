// Loaded on the Bulgarian pages only. The build puts every sentence written in
// a page into Bulgarian, but the city scenes change their labels in English
// while they play, so each label they write is put into Bulgarian as it
// appears. The language switch is a pair of plain links and needs nothing here.
import { words } from './words.js?v=fc83f5c81499';

const normalize = value => value.replace(/\s+/g, ' ').trim();
const translate = value => {
  const key = normalize(value);
  const translated = words[key];
  return translated && translated !== key ? value.replace(/\S[\s\S]*\S|\S/, translated) : value;
};

// Only words a person reads change; scene names, values and motion are left alone.
function visit(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (!node.parentElement?.closest('script,style,svg,.language-switch')) {
      const translated = translate(node.textContent);
      if (translated !== node.textContent) node.textContent = translated;
    }
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  for (const attribute of ['aria-label', 'title', 'alt', 'data-scene-label']) {
    if (!node.hasAttribute(attribute)) continue;
    const value = node.getAttribute(attribute), translated = translate(value);
    if (translated !== value) node.setAttribute(attribute, translated);
  }
  for (const child of node.childNodes) visit(child);
}

visit(document.body);
new MutationObserver(records => {
  for (const record of records) {
    if (record.type === 'childList') record.addedNodes.forEach(visit);
    else visit(record.target);
  }
}).observe(document.body, { subtree: true, childList: true, characterData: true,
  attributes: true, attributeFilter: ['aria-label', 'title', 'alt'] });
