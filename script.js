const data = {
  city: { index: '01 / МЕСТО', title: 'Старый город', text: 'Место задаёт окружение героя. Отправьте тот же трамвай к морю и посмотрите, что изменится.' },
  tram: { index: '02 / ГЕРОЙ', title: 'Городской трамвай', text: 'Один и тот же трамвай остаётся героем каждого кадра. Меняются обстоятельства вокруг него.' },
  light: { index: '03 / АТМОСФЕРА', title: 'Ночной свет', text: 'Освещение меняет настроение знакомой сцены. Попробуйте рассвет, не меняя место и героя.' },
  motion: { index: '04 / КОМПОЗИЦИЯ', title: 'Путь взгляда', text: 'Изгиб рельсов ведёт взгляд к трамваю и создаёт ощущение движения в кадре.' },
  result: { index: '05 / РЕЗУЛЬТАТ', title: 'Серия кадров', text: 'Один герой может оказаться в разных местах и при разном свете. Каждое решение видно в результате.' }
};
const $ = selector => document.querySelector(selector);
const stage = $('#stage');
const infoIndex = $('#info-index');
const infoTitle = $('#info-title');
const infoText = $('#info-text');
const outputImage = $('#output-image');
const outputTime = $('#output-time');
const packet = $('#route-packet');
const compare = $('#compare');
const slider = $('#compare-slider');
const before = $('#compare-before');
const divider = $('#compare-divider');
const imagePath = name => `assets/paper-city/${name}.png`;
let active = 'city';
let variant = 'night';
let changeTimer;

function selectNode(node) {
  active = node;
  stage.dataset.active = node;
  const item = data[node];
  infoIndex.textContent = item.index;
  infoTitle.textContent = node === 'light' && variant === 'dawn' ? 'Рассветный свет' : node === 'city' && variant === 'coast' ? 'Приморская набережная' : item.title;
  infoText.textContent = item.text;
  $('#light-controls').hidden = node !== 'light';
  $('#location-controls').hidden = node !== 'city';
  document.querySelectorAll('[data-node]').forEach(el => {
    const selected = el.dataset.node === node;
    el.classList.toggle('active', selected);
    el.setAttribute('aria-pressed', String(selected));
  });
}

function setCompare(value) {
  before.style.width = `${value}%`;
  divider.style.left = `${value}%`;
  before.querySelector('img').style.width = `${before.parentElement.clientWidth}px`;
}

function updateControls() {
  $('#city-button').setAttribute('aria-pressed', String(variant !== 'coast'));
  $('#coast-button').setAttribute('aria-pressed', String(variant === 'coast'));
  $('#night-button').setAttribute('aria-pressed', String(variant !== 'dawn'));
  $('#dawn-button').setAttribute('aria-pressed', String(variant === 'dawn'));
}

function updateComparison() {
  const isCoast = variant === 'coast';
  $('#compare-title').innerHTML = isCoast ? 'Место изменилось.<br><em>Герой остался.</em>' : 'Свет изменился.<br><em>Место осталось.</em>';
  $('.compare-copy p:not(.eyebrow)').textContent = isCoast
    ? 'Вы переместили трамвай из старого города к морю. Та же нода героя участвует в новом результате.'
    : 'Вы изменили освещение старого города. Трамвай и место сохранились — настроение кадра стало другим.';
  const after = $('#compare-after-image');
  after.src = imagePath(variant);
  after.alt = isCoast ? 'Тот же трамвай на приморской набережной' : 'Тот же трамвай на рассвете';
  $('#compare-left-label').textContent = isCoast ? 'СТАРЫЙ ГОРОД' : 'НОЧЬ';
  $('#compare-right-label').textContent = isCoast ? 'У МОРЯ' : 'РАССВЕТ';
  setCompare(Number(slider.value));
}

function setVariant(next, node) {
  if (next === variant) { selectNode(node); return; }
  clearTimeout(changeTimer);
  variant = next;
  selectNode(node);
  updateControls();
  packet.classList.remove('running');
  packet.style.offsetPath = node === 'city'
    ? "path('M315 125 C445 125 420 275 615 275')"
    : "path('M315 385 C440 385 435 295 615 295')";
  void packet.getBoundingClientRect();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) packet.classList.add('running');
  changeTimer = setTimeout(() => {
    outputImage.src = imagePath(next);
    outputImage.alt = next === 'coast' ? 'Трамвай на приморской набережной' : next === 'dawn' ? 'Трамвай в старом городе на рассвете' : 'Ночной город с трамваем';
    outputTime.textContent = next === 'coast' ? 'У МОРЯ' : next === 'dawn' ? 'РАССВЕТ' : 'НОЧЬ';
    $('.output-overlay').textContent = next === 'coast' ? 'ПОБЕРЕЖЬЕ / 02' : 'ГОРОД / 01';
    outputImage.classList.remove('changing');
    void outputImage.getBoundingClientRect();
    outputImage.classList.add('changing');
    compare.hidden = next === 'night';
    if (!compare.hidden) updateComparison();
  }, reduced ? 0 : 850);
}

document.querySelectorAll('[data-node]').forEach(el => el.addEventListener('click', () => selectNode(el.dataset.node)));
$('#city-button').addEventListener('click', () => setVariant('night', 'city'));
$('#coast-button').addEventListener('click', () => setVariant('coast', 'city'));
$('#night-button').addEventListener('click', () => setVariant('night', 'light'));
$('#dawn-button').addEventListener('click', () => setVariant('dawn', 'light'));
$('#reset-button').addEventListener('click', () => setVariant('night', 'city'));
$('#replay-button').addEventListener('click', () => {
  setVariant('night', 'city');
  $('#lab').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  setTimeout(() => $('#coast-button').focus(), 100);
});
$('#reveal-button').addEventListener('click', () => {
  $('#lab').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  selectNode('city');
});
slider.addEventListener('input', () => setCompare(Number(slider.value)));
window.addEventListener('resize', () => setCompare(Number(slider.value)));
selectNode('city');
updateControls();
setCompare(50);
