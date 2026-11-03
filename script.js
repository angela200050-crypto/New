const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const imagePath = (place, light) => {
  const names = { 'city-night': 'night', 'city-dawn': 'dawn', 'city-day': 'city-day', 'coast-night': 'coast-night', 'coast-dawn': 'coast', 'coast-day': 'coast-day', 'mountain-night': 'mountain-night', 'mountain-dawn': 'mountain-dawn', 'mountain-day': 'mountain-day' };
  return `assets/paper-city/${names[`${place}-${light}`]}.webp`;
};
const placeName = place => ({ city: 'Старый город', coast: 'У моря', mountain: 'Горы' })[place];
const lightName = light => ({ night: 'Ночь', dawn: 'Рассвет', day: 'День' })[light];
const cameraName = camera => ({ wide: 'Общий план', push: 'Плавный наезд', track: 'Проводка' })[camera];
const shotTitle = shot => ({ 'city-night': 'Ночной город', 'city-dawn': 'Первый свет', 'city-day': 'Город при свете дня', 'coast-night': 'Огни набережной', 'coast-dawn': 'Дорога к морю', 'coast-day': 'Солнечная набережная', 'mountain-night': 'Ночной перевал', 'mountain-dawn': 'Первые лучи в горах', 'mountain-day': 'Горный перевал' })[`${shot.place}-${shot.light}`];
const shotDescription = shot => {
  if (shot.camera === 'push') return 'Камера приближается к герою на новом маршруте.';
  if (shot.camera === 'track') return 'Камера движется рядом с трамваем.';
  if (shot.place === 'mountain') return 'Трамвай проходит по снежному виадуку.';
  if (shot.place === 'coast') return 'Знакомый трамвай на приморской набережной.';
  if (shot.light === 'dawn') return 'Тот же маршрут встречает новый день.';
  return 'Знакомый трамвай начинает путь в старом городе.';
};
const shotAlt = shot => `Бордовый трамвай: ${placeName(shot.place).toLowerCase()}, ${lightName(shot.light).toLowerCase()}`;
const startingShots = [
  { place: 'city', light: 'night', camera: 'wide' },
  { place: 'mountain', light: 'day', camera: 'track' },
  { place: 'coast', light: 'dawn', camera: 'push' }
];
const shots = startingShots.map(shot => ({ ...shot }));
let selected = 2;
let changeTimer = 0;
let edgeTimer = 0;
const stage = $('#flow-stage');
const packet = $('#flow-packet');

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
    image.classList.toggle('camera-track', shot.camera === 'track');
    card.querySelector('.story-card-top strong').textContent = shotTitle(shot);
    card.querySelector('.story-description').textContent = shotDescription(shot);
    const tags = card.querySelector('.story-tags');
    tags.replaceChildren(...[placeName(shot.place), lightName(shot.light), ...(shot.camera === 'push' ? ['Наезд'] : shot.camera === 'track' ? ['Проводка'] : [])].map(label => {
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
  image.classList.toggle('camera-track', shot.camera === 'track');
  image.classList.remove('frame-arrive');
  void image.offsetWidth;
  image.classList.add('frame-arrive');
  $('#lab-eyebrow').textContent = `КАДР ${String(selected + 1).padStart(2, '0')} / ИНТЕРАКТИВНАЯ СХЕМА`;
  $('#result-index').textContent = `06 / КАДР ${String(selected + 1).padStart(2, '0')}`;
  $('#result-title').textContent = shotTitle(shot);
  $('#result-settings').textContent = `${placeName(shot.place)} · ${lightName(shot.light)} · ${cameraName(shot.camera)}`;
  $('#change-caption').textContent = sameShot(shot, startingShots[selected])
    ? `Выбран кадр ${String(selected + 1).padStart(2, '0')}. Измените одну ноду: остальные решения сохранятся.`
    : `Кадр ${String(selected + 1).padStart(2, '0')} обновлён. Герой и остальные кадры истории сохранились.`;
}

function renderAll() {
  renderStoryboard();
  renderChoices();
  renderResult();
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
function drawMediaConnections() {
  if (matchMedia('(max-width: 1050px)').matches) return;
  const chainStage = $('#chain-stage');
  const rect = chainStage.getBoundingClientRect();
  const point = selector => {
    const port = $(selector).getBoundingClientRect();
    return { x: port.left + port.width / 2 - rect.left, y: port.top + port.height / 2 - rect.top };
  };
  $('#chain-connections').setAttribute('viewBox', `0 0 ${chainStage.clientWidth} ${chainStage.clientHeight}`);
  const photoIn = point('#chain-photo .in');
  [
    ['#chain-prompt-edge', point('#chain-prompt .out'), photoIn],
    ['#chain-reference-edge', point('#chain-reference .out'), photoIn],
    ['#chain-style-edge', point('#chain-style .out'), photoIn],
    ['#chain-video-edge', point('#chain-photo .out'), point('#chain-video .in')]
  ].forEach(([selector, from, to]) => $(selector).setAttribute('d', edge(from, to)));
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
const soundPlayer = $('.output-audio audio');
const soundArt = $('.sound-art');
soundPlayer.addEventListener('play', () => soundArt.classList.add('is-playing'));
['pause', 'ended'].forEach(event => soundPlayer.addEventListener(event, () => soundArt.classList.remove('is-playing')));
window.addEventListener('resize', () => { drawConnections(); drawMediaConnections(); });
if ('ResizeObserver' in window) new ResizeObserver(drawConnections).observe(stage);
if ('ResizeObserver' in window) new ResizeObserver(drawMediaConnections).observe($('#chain-stage'));
renderAll();
requestAnimationFrame(drawMediaConnections);
