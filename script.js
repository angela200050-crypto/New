const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const imagePath = (place, light) => {
  const names = { 'city-night': 'night', 'city-dawn': 'dawn', 'city-day': 'city-day', 'coast-night': 'coast-night', 'coast-dawn': 'coast', 'coast-day': 'coast-day', 'mountain-night': 'mountain-night', 'mountain-dawn': 'mountain-dawn', 'mountain-day': 'mountain-day' };
  return `assets/paper-city/${names[`${place}-${light}`]}.webp`;
};
const placeName = place => ({ city: 'Старый город', coast: 'У моря', mountain: 'Горы' })[place];
const lightName = light => ({ night: 'Ночь', dawn: 'Рассвет', day: 'День' })[light];
const titles = { 'city-night': 'Ночной город', 'city-dawn': 'Первый свет', 'city-day': 'Город при свете дня', 'coast-night': 'Огни набережной', 'coast-dawn': 'Дорога к морю', 'coast-day': 'Солнечная набережная', 'mountain-night': 'Ночной перевал', 'mountain-dawn': 'Первые лучи в горах', 'mountain-day': 'Горный перевал' };
const initial = { place: 'mountain', light: 'day' };
let settings = { ...initial };
let connected = false;
let armed = false;
let updateTimer = 0;
function renderResult() {
  const { place, light } = settings;
  const image = $('#result-image');
  image.src = imagePath(place, light);
  image.alt = `Бордовый трамвай: ${placeName(place).toLowerCase()}, ${lightName(light).toLowerCase()}`;
  $('#result-title').textContent = titles[`${place}-${light}`];
  $('#result-settings').textContent = `${placeName(place)} · ${lightName(light)}`;
  $$('.choice-buttons button').forEach(button => {
    const key = button.dataset.place ? 'place' : 'light';
    button.setAttribute('aria-pressed', String(settings[key] === button.dataset[key]));
  });
  $('#change-caption').textContent = place === initial.place && light === initial.light
    ? 'Измените место или свет — остальные настройки сохранятся.'
    : `Новый вариант: ${placeName(place).toLowerCase()}, ${lightName(light).toLowerCase()}. Внешний вид трамвая сохранён.`;
}
$$('.choice-buttons button').forEach(button => button.addEventListener('click', () => {
  if (!connected) return;
  const key = button.dataset.place ? 'place' : 'light';
  if (settings[key] === button.dataset[key]) return;
  settings[key] = button.dataset[key];
  animateChange(key);
}));
$('#reset-button').addEventListener('click', resetDemo);
$('#reveal-button').addEventListener('click', () => $('#lab').scrollIntoView({ behavior: prefersReducedMotion() ? 'instant' : 'smooth', block: 'start' }));
function drawMediaConnections() {
  if (matchMedia('(max-width: 1050px)').matches) return;
  const stage = $('#chain-stage');
  const rect = stage.getBoundingClientRect();
  const point = selector => {
    const port = $(selector).getBoundingClientRect();
    return { x: port.left + port.width / 2 - rect.left, y: port.top + port.height / 2 - rect.top };
  };
  $('#chain-connections').setAttribute('viewBox', `0 0 ${stage.clientWidth} ${stage.clientHeight}`);
  const to = point('#chain-photo .in');
  ['prompt', 'reference', 'style'].forEach(name => {
    const from = point(`#chain-${name} .out`);
    const bend = Math.max(24, (to.x - from.x) * .45);
    $(`#chain-${name}-edge`).setAttribute('d', `M ${from.x} ${from.y} C ${from.x + bend} ${from.y} ${to.x - bend} ${to.y} ${to.x} ${to.y}`);
  });
}
window.addEventListener('resize', drawMediaConnections);
if ('ResizeObserver' in window) new ResizeObserver(drawMediaConnections).observe($('#chain-stage'));
const soundPlayer = $('.output-audio audio');
const soundArt = $('.sound-art');
soundPlayer.addEventListener('play', () => soundArt.classList.add('is-playing'));
['pause', 'ended'].forEach(event => soundPlayer.addEventListener(event, () => soundArt.classList.remove('is-playing')));
const menuToggle = $('.menu-toggle');
const headerNav = $('#main-nav');
function closeMenu() { menuToggle.setAttribute('aria-expanded', 'false'); headerNav.classList.remove('is-open'); }
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  headerNav.classList.toggle('is-open', open);
});
headerNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
initializeDemo();
requestAnimationFrame(drawMediaConnections);

function setStep(step) {
  const steps = ['connect', 'change', 'video'];
  $$('.demo-steps li').forEach(item => {
    item.classList.toggle('is-current', item.dataset.step === step);
    item.classList.toggle('is-done', steps.indexOf(item.dataset.step) < steps.indexOf(step));
  });
}
function drawDemo() {
  const stage = $('#flow-stage');
  const bounds = stage.getBoundingClientRect();
  const point = id => {
    const r = $(id).getBoundingClientRect();
    return { x: r.left + r.width / 2 - bounds.left, y: r.top + r.height / 2 - bounds.top };
  };
  const to = point('#result-port');
  $('.demo-connections').setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
  ['reference', 'place', 'light'].forEach(name => {
    const from = point(`#${name}-port`);
    const bend = Math.max(16, (to.x - from.x) * .5);
    $(`#demo-${name}-edge`).setAttribute('d', `M ${from.x} ${from.y} C ${from.x + bend} ${from.y} ${to.x - bend} ${to.y} ${to.x} ${to.y}`);
  });
}
function pulse(name) {
  const path = $(`#demo-${name}-edge`);
  path.classList.remove('is-flowing');
  void path.getBoundingClientRect();
  path.classList.add('is-flowing');
}
function initializeDemo() {
  renderResult();
  $$('.choice-buttons button').forEach(b => b.disabled = !connected);
  $('#demo-empty').hidden = connected;
  $('#demo-result-content').hidden = !connected;
  $('#flow-stage').classList.toggle('is-connected', connected);
  $('#connection-state').textContent = connected ? 'Подключено · герой сохраняется' : 'Ожидает подключения';
  $('#reference-port').setAttribute('aria-pressed', String(armed));
  $('#result-port').setAttribute('aria-disabled', String(!armed && !connected));
  requestAnimationFrame(drawDemo);
}
function connectDemo() {
  if (connected || !armed) return;
  connected = true;
  armed = false;
  initializeDemo();
  setStep('change');
  $('#demo-hint').textContent = 'Связь создана. Измените место или свет — подсветится только затронутый шаг.';
  $('#change-caption').textContent = 'Референс подключён. Первый кадр собран.';
  requestAnimationFrame(() => pulse('reference'));
}
function animateChange(key) {
  clearTimeout(updateTimer);
  $$('.choice-node').forEach(n => n.classList.remove('is-updating'));
  $$('.choice-buttons button').forEach(button => {
    const kind = button.dataset.place ? 'place' : 'light';
    button.setAttribute('aria-pressed', String(settings[kind] === button.dataset[kind]));
  });
  $(`#${key}-node`).classList.add('is-updating');
  pulse(key);
  $('#change-caption').textContent = 'Обновляем только выбранный шаг…';
  $('#demo-video-result').hidden = true;
  $('#demo-video-result video').pause();
  setStep('change');
  updateTimer = setTimeout(() => {
    renderResult();
    $(`#${key}-node`).classList.remove('is-updating');
    const image = $('.result-image');
    image.classList.remove('is-revealing');
    void image.offsetWidth;
    image.classList.add('is-revealing');
    $('#demo-hint').textContent = 'Результат обновлён. Теперь добавьте видео, чтобы продолжить процесс в новом формате.';
    setStep('video');
  }, prefersReducedMotion() ? 0 : 650);
}
function resetDemo() {
  clearTimeout(updateTimer);
  settings = { ...initial };
  connected = false;
  armed = false;
  $('#demo-video-result video').pause();
  $('#demo-video-result').hidden = true;
  $$('.choice-node').forEach(n => n.classList.remove('is-updating'));
  $('#demo-draft-edge').setAttribute('d', '');
  initializeDemo();
  setStep('connect');
  $('#demo-hint').textContent = 'Нажмите на порт референса, затем на порт результата. Или перетащите связь между ними.';
}
$('#reference-port').addEventListener('click', () => {
  if (connected) return;
  armed = !armed;
  $('#reference-port').setAttribute('aria-pressed', String(armed));
  $('#result-port').setAttribute('aria-disabled', String(!armed));
  $('#demo-hint').textContent = armed ? 'Теперь нажмите на зелёный порт карточки результата.' : 'Нажмите на порт референса, чтобы начать связь.';
});
$('#result-port').addEventListener('click', () => {
  if (!armed && !connected) $('#demo-hint').textContent = 'Сначала выберите порт референса — он находится на карточке исходного объекта.';
  connectDemo();
});
let dragOrigin = null;
$('#reference-port').addEventListener('pointerdown', event => {
  if (connected || event.button !== 0) return;
  dragOrigin = { x: event.clientX, y: event.clientY };
});
window.addEventListener('pointermove', event => {
  if (!dragOrigin || Math.hypot(event.clientX - dragOrigin.x, event.clientY - dragOrigin.y) < 8) return;
  const r = $('#flow-stage').getBoundingClientRect();
  const a = $('#reference-port').getBoundingClientRect();
  $('#demo-draft-edge').setAttribute('d', `M ${a.left + a.width / 2 - r.left} ${a.top + a.height / 2 - r.top} L ${event.clientX - r.left} ${event.clientY - r.top}`);
});
window.addEventListener('pointerup', event => {
  if (!dragOrigin) return;
  const moved = Math.hypot(event.clientX - dragOrigin.x, event.clientY - dragOrigin.y) > 8;
  dragOrigin = null;
  $('#demo-draft-edge').setAttribute('d', '');
  if (!moved) return;
  const target = $('#result-port').getBoundingClientRect();
  if (event.clientX >= target.left - 12 && event.clientX <= target.right + 12 && event.clientY >= target.top - 12 && event.clientY <= target.bottom + 12) {
    armed = true;
    connectDemo();
  }
});
window.addEventListener('pointercancel', () => { dragOrigin = null; $('#demo-draft-edge').setAttribute('d', ''); });
$('#add-video').addEventListener('click', () => {
  clearTimeout(updateTimer);
  settings = { ...initial };
  renderResult();
  $('#demo-video-result').hidden = false;
  setStep('video');
  $('#demo-hint').textContent = 'Новая нода добавлена: дневной кадр в горах → видео. Нажмите воспроизведение, чтобы посмотреть результат.';
  $('#demo-video-result').scrollIntoView({ behavior: prefersReducedMotion() ? 'instant' : 'smooth', block: 'center' });
});
window.addEventListener('resize', drawDemo);
if ('ResizeObserver' in window) new ResizeObserver(drawDemo).observe($('#flow-stage'));
