const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const imagePath = (place, light) => {
  const names = { 'city-night': 'night', 'city-dawn': 'dawn', 'coast-night': 'coast-night', 'coast-dawn': 'coast' };
  return `assets/paper-city/${names[`${place}-${light}`]}.webp`;
};
const placeName = place => place === 'coast' ? 'У моря' : 'Старый город';
const lightName = light => light === 'dawn' ? 'Рассвет' : 'Ночь';
const cameraName = camera => camera === 'push' ? 'Плавный наезд' : 'Общий план';
const shotTitle = shot => ({ 'city-night': 'Ночной город', 'city-dawn': 'Первый свет', 'coast-night': 'Огни набережной', 'coast-dawn': 'Дорога к морю' })[`${shot.place}-${shot.light}`];
const shotDescription = shot => {
  if (shot.camera === 'push') return 'Камера приближается к герою на новом маршруте.';
  if (shot.place === 'coast') return 'Знакомый трамвай на приморской набережной.';
  if (shot.light === 'dawn') return 'Тот же маршрут встречает новый день.';
  return 'Знакомый трамвай начинает путь в старом городе.';
};
const shotAlt = shot => `Бордовый трамвай: ${placeName(shot.place).toLowerCase()}, ${lightName(shot.light).toLowerCase()}`;
const startingShots = [
  { place: 'city', light: 'night', camera: 'wide' },
  { place: 'city', light: 'dawn', camera: 'wide' },
  { place: 'coast', light: 'dawn', camera: 'push' }
];
const shots = startingShots.map(shot => ({ ...shot }));
let selected = 2;
let changeTimer = 0;
let edgeTimer = 0;
const stage = $('#flow-stage');
const packet = $('#flow-packet');
const compare = $('#compare');
const slider = $('#compare-slider');

function sameShot(a, b) {
  return a.place === b.place && a.light === b.light && a.camera === b.camera;
}

function renderStoryboard() {
  $$('.story-card').forEach((card, index) => {
    const shot = shots[index];
    const image = card.querySelector('img');
    image.src = imagePath(shot.place, shot.light);
    image.alt = shotAlt(shot);
    image.classList.toggle('camera-push', shot.camera === 'push');
    card.querySelector('.story-card-top strong').textContent = shotTitle(shot);
    card.querySelector('.story-description').textContent = shotDescription(shot);
    const tags = card.querySelector('.story-tags');
    tags.replaceChildren(...[placeName(shot.place), lightName(shot.light), ...(shot.camera === 'push' ? ['Наезд'] : [])].map(label => {
      const span = document.createElement('span');
      span.textContent = label;
      return span;
    }));
    card.setAttribute('aria-pressed', String(index === selected));
  });
}

function renderChoices() {
  const shot = shots[selected];
  $$('.choice-buttons button').forEach(button => {
    const key = button.dataset.place ? 'place' : button.dataset.light ? 'light' : 'camera';
    button.setAttribute('aria-pressed', String(shot[key] === button.dataset[key]));
  });
}

function renderResult() {
  const shot = shots[selected];
  const image = $('#result-image');
  image.src = imagePath(shot.place, shot.light);
  image.alt = shotAlt(shot);
  image.classList.toggle('camera-push', shot.camera === 'push');
  image.classList.remove('frame-arrive');
  void image.offsetWidth;
  image.classList.add('frame-arrive');
  $('#lab-title').innerHTML = `Как собирается <em>кадр ${String(selected + 1).padStart(2, '0')}.</em>`;
  $('#result-index').textContent = `06 / КАДР ${String(selected + 1).padStart(2, '0')}`;
  $('#result-title').textContent = shotTitle(shot);
  $('#result-settings').textContent = `${placeName(shot.place)} · ${lightName(shot.light)} · ${cameraName(shot.camera)}`;
  $('#change-caption').textContent = sameShot(shot, startingShots[selected])
    ? `Выбран кадр ${String(selected + 1).padStart(2, '0')}. Измените одну ноду: остальные решения сохранятся.`
    : `Кадр ${String(selected + 1).padStart(2, '0')} обновлён. Герой и остальные кадры истории сохранились.`;
}

function setCompare(value) {
  const before = $('#compare-before');
  before.style.width = `${value}%`;
  $('#compare-divider').style.left = `${value}%`;
  $('#compare-before-image').style.width = `${before.parentElement.clientWidth}px`;
}

function renderCompare() {
  const shot = shots[selected];
  const baseline = startingShots[selected];
  compare.hidden = sameShot(shot, baseline);
  $('#compare-button').hidden = compare.hidden;
  if (compare.hidden) return;
  const before = $('#compare-before-image');
  const after = $('#compare-after-image');
  before.src = imagePath(baseline.place, baseline.light);
  before.alt = `Исходный кадр: ${shotAlt(baseline)}`;
  before.classList.toggle('camera-push', baseline.camera === 'push');
  after.src = imagePath(shot.place, shot.light);
  after.alt = `Новый кадр: ${shotAlt(shot)}`;
  after.classList.toggle('camera-push', shot.camera === 'push');
  const changed = ['place', 'light', 'camera'].filter(key => shot[key] !== baseline[key]);
  const singleChange = changed.length === 1 ? changed[0] : null;
  const title = singleChange === 'camera' ? 'Камера меняет <em>историю кадра.</em>' : singleChange === 'light' ? 'Другой свет — <em>другое настроение.</em>' : singleChange === 'place' ? 'Новый маршрут — <em>тот же герой.</em>' : 'Новые решения — <em>новый кадр.</em>';
  $('#compare-title').innerHTML = title;
  $('#compare-description').textContent = `Кадр ${String(selected + 1).padStart(2, '0')}: ${placeName(shot.place).toLowerCase()}, ${lightName(shot.light).toLowerCase()}, ${cameraName(shot.camera).toLowerCase()}. Изменился выбранный кадр; остальные остались на месте.`;
  requestAnimationFrame(() => setCompare(Number(slider.value)));
}

function renderAll() {
  renderStoryboard();
  renderChoices();
  renderResult();
  renderCompare();
  requestAnimationFrame(drawConnections);
}

function portPoint(selector) {
  const port = $(selector).getBoundingClientRect();
  const rect = stage.getBoundingClientRect();
  return { x: port.left + port.width / 2 - rect.left, y: port.top + port.height / 2 - rect.top };
}
function curve(a, b) {
  const bend = Math.max(24, (b.x - a.x) * .45);
  return `C ${a.x + bend} ${a.y} ${b.x - bend} ${b.y} ${b.x} ${b.y}`;
}
function edge(a, b) { return `M ${a.x} ${a.y} ${curve(a, b)}`; }
function drawConnections() {
  if (matchMedia('(max-width: 900px)').matches) return;
  const points = {
    heroOut: portPoint('#hero-node .out'), placeIn: portPoint('#place-node .in'), placeOut: portPoint('#place-node .out'),
    lightIn: portPoint('#light-node .in'), lightOut: portPoint('#light-node .out'), cameraIn: portPoint('#camera-node .in'), cameraOut: portPoint('#camera-node .out'),
    renderIn: portPoint('#render-node .in'), renderOut: portPoint('#render-node .out'), resultIn: portPoint('#result-node .in')
  };
  const svg = $('#flow-connections');
  svg.setAttribute('viewBox', `0 0 ${stage.clientWidth} ${stage.clientHeight}`);
  const pairs = [
    ['hero-place', points.heroOut, points.placeIn], ['hero-light', points.heroOut, points.lightIn], ['hero-camera', points.heroOut, points.cameraIn],
    ['place-render', points.placeOut, points.renderIn], ['light-render', points.lightOut, points.renderIn], ['camera-render', points.cameraOut, points.renderIn],
    ['render-result', points.renderOut, points.resultIn]
  ];
  pairs.forEach(([name, a, b]) => $(`#edge-${name}`).setAttribute('d', edge(a, b)));
  stage._points = points;
}
function animatePath(kind) {
  if (prefersReducedMotion() || matchMedia('(max-width: 900px)').matches) return;
  drawConnections();
  const p = stage._points;
  const input = kind === 'place' ? p.placeIn : kind === 'light' ? p.lightIn : p.cameraIn;
  const output = kind === 'place' ? p.placeOut : kind === 'light' ? p.lightOut : p.cameraOut;
  const route = `M ${p.heroOut.x} ${p.heroOut.y} ${curve(p.heroOut, input)} L ${output.x} ${output.y} ${curve(output, p.renderIn)} L ${p.renderOut.x} ${p.renderOut.y} ${curve(p.renderOut, p.resultIn)}`;
  clearTimeout(edgeTimer);
  $$('.flow-edge').forEach(path => path.classList.remove('is-active'));
  [`#edge-hero-${kind}`, `#edge-${kind}-render`, '#edge-render-result'].forEach(selector => $(selector).classList.add('is-active'));
  packet.classList.remove('running');
  packet.style.offsetPath = `path('${route}')`;
  void packet.getBoundingClientRect();
  packet.classList.add('running');
  edgeTimer = setTimeout(() => $$('.flow-edge').forEach(path => path.classList.remove('is-active')), 1500);
}

function selectShot(index, scroll = false) {
  clearTimeout(changeTimer);
  selected = index;
  $('#render-state').textContent = 'Готово';
  renderAll();
  if (scroll) $('#lab').scrollIntoView({ behavior: prefersReducedMotion() ? 'instant' : 'smooth', block: 'start' });
}

function changeSetting(kind, value) {
  if (shots[selected][kind] === value) return;
  clearTimeout(changeTimer);
  shots[selected][kind] = value;
  renderChoices();
  animatePath(kind);
  $('#render-state').textContent = 'Обновляем кадр…';
  changeTimer = setTimeout(() => {
    renderAll();
    $('#render-state').textContent = 'Готово';
  }, prefersReducedMotion() ? 0 : 950);
}

$$('.story-card').forEach(card => card.addEventListener('click', () => selectShot(Number(card.dataset.shot), true)));
$$('[data-place]').forEach(button => button.addEventListener('click', () => changeSetting('place', button.dataset.place)));
$$('[data-light]').forEach(button => button.addEventListener('click', () => changeSetting('light', button.dataset.light)));
$$('[data-camera]').forEach(button => button.addEventListener('click', () => changeSetting('camera', button.dataset.camera)));
$('#reveal-button').addEventListener('click', () => selectShot(selected, true));
$('#reset-button').addEventListener('click', () => { clearTimeout(changeTimer); shots[selected] = { ...startingShots[selected] }; $('#render-state').textContent = 'Готово'; renderAll(); });
$('#compare-button').addEventListener('click', () => compare.scrollIntoView({ behavior: prefersReducedMotion() ? 'instant' : 'smooth', block: 'start' }));
$('#replay-button').addEventListener('click', () => selectShot((selected + 1) % shots.length, true));
slider.addEventListener('input', () => setCompare(Number(slider.value)));
window.addEventListener('resize', () => { drawConnections(); setCompare(Number(slider.value)); });
if ('ResizeObserver' in window) new ResizeObserver(drawConnections).observe(stage);
renderAll();
