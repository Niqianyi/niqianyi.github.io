const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const launch = $('#surface'), whale = $('#whale'), travel = $('#whale-travel');
const dialog = $('#intro-dialog');
let framePending = false, depth = 0, focused = false, pointerNear = false, touchTimer;
const clamp = v => Math.max(0, Math.min(1, v));
function awake(value) {
  travel.classList.toggle('awake', value);
  $('#whale-greeting').setAttribute('aria-hidden', String(!value));
}
function updateJourney() {
  const range = Math.max(1, launch.offsetHeight - innerHeight);
  depth = motion.matches ? 0 : clamp(scrollY / range);
  launch.style.setProperty('--dive', depth.toFixed(4));
  const total = document.documentElement.scrollHeight - innerHeight;
  $('.progress').style.transform = `scaleX(${total > 0 ? clamp(scrollY / total) : 0})`;
  $('.sea-depth').textContent = depth > .55 ? 'DEEP BLUE / 在深海，继续探索' : 'INTO THE BLUE / 向更深处探索';
  let current = 'surface';
  ['about','growth'].forEach(id => { if ($('#' + id).getBoundingClientRect().top < innerHeight * .4) current = id; });
  $$('[data-nav]').forEach(a => { const active = a.dataset.nav === current; a.classList.toggle('active', active); if (active) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); });
  awake((pointerNear || focused) && depth < .85);
  framePending = false;
}
function scheduleJourney() { if (!framePending) { framePending = true; requestAnimationFrame(updateJourney); } }
addEventListener('scroll', scheduleJourney, {passive:true});
addEventListener('resize', scheduleJourney, {passive:true});
motion.addEventListener('change', scheduleJourney);
addEventListener('pointermove', e => {
  if (e.pointerType === 'touch' || dialog.open) return;
  const r = whale.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) { pointerNear = false; return; }
  const dx = (e.clientX - (r.left + r.width * .5)) / (r.width * .58);
  const dy = (e.clientY - (r.top + r.height * .55)) / (r.height * .58);
  pointerNear = dx * dx + dy * dy < 1.35;
  awake((pointerNear || focused) && depth < .85);
}, {passive:true});
document.addEventListener('pointerleave', () => { pointerNear = false; awake(focused); });
whale.addEventListener('focus', () => { focused = true; awake(true); });
whale.addEventListener('blur', () => { focused = false; awake(pointerNear); });
whale.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { awake(true); clearTimeout(touchTimer); touchTimer = setTimeout(() => awake(focused), 2500); } });
whale.addEventListener('click', () => { awake(true); dialog.showModal(); });
function closeIntro() { dialog.close(); whale.focus({preventScroll:true}); }
$('.dialog-close').addEventListener('click', closeIntro);
dialog.addEventListener('click', e => { if (e.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeIntro(); });
dialog.addEventListener('cancel', () => { requestAnimationFrame(() => whale.focus({preventScroll:true})); });
$('#meet-queenie').addEventListener('click', () => { dialog.close(); });
const seas = ['academic','practice','leadership'];
function selectSea(name, focus = false) {
  if (!seas.includes(name)) return;
  $$('[data-sea]').forEach(b => { const selected = b.dataset.sea === name; b.setAttribute('aria-selected',String(selected)); b.tabIndex = selected ? 0 : -1; if (selected && focus) b.focus({preventScroll:true}); });
  $$('.sea-panel').forEach(p => { p.hidden = p.id !== 'panel-' + name; });
  $('#announcement').textContent = '已进入' + ({academic:'知识海域：学业与项目经历',practice:'探索海域：工作与创业故事',leadership:'连接海域：领导力与个人思考'}[name]);
  scheduleJourney();
}
$$('[data-sea]').forEach(b => b.addEventListener('click', () => selectSea(b.dataset.sea)));
$('.sea-tabs').addEventListener('keydown', e => {
  if (!['ArrowRight','ArrowLeft','Home','End'].includes(e.key)) return;
  const tabs = $$('[data-sea]'), index = tabs.indexOf(document.activeElement);
  if (index < 0) return;
  e.preventDefault();
  let next = e.key === 'ArrowRight' ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
  if (e.key === 'Home') next = 0; if (e.key === 'End') next = tabs.length - 1;
  selectSea(tabs[next].dataset.sea,true);
});
if (matchMedia('(hover: none)').matches) $('#whale-hint').textContent = '轻点鲸鱼，认识 Queenie。';
updateJourney();
