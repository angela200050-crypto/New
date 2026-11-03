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
  const key = button.dataset.place ? 'place' : 'light';
  settings[key] = button.dataset[key];
  renderResult();
}));
$('#reset-button').addEventListener('click', () => { settings = { ...initial }; renderResult(); });
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
renderResult();
requestAnimationFrame(drawMediaConnections);
