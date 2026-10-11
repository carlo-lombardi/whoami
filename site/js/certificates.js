// A certificate renewal walking through its gates in order while the expiry counts down.

const START_DAYS = 30;
const DAYS_PER_STEP = 3;
const RENEWED_DAYS = 365;
const STEP_MS = 850;

export function initCertificates({ reducedMotion }) {
  const list = document.getElementById('cert-steps');
  const button = document.getElementById('cert-run');
  const ring = document.getElementById('ring-value');
  const number = document.getElementById('ring-num');
  if (!list || !button || !ring || !number) return;
  const steps = [...list.children];

  function setDays(days) {
    number.textContent = String(days);
    ring.setAttribute('stroke-dasharray', `${Math.max(3, (days / RENEWED_DAYS) * 100)} 100`);
    ring.classList.toggle('low', days <= START_DAYS);
  }

  function mark(index) {
    steps.forEach((step, i) => {
      step.classList.toggle('done', i < index);
      step.classList.toggle('current', i === index);
    });
  }

  function finish() {
    mark(steps.length);
    setDays(RENEWED_DAYS);
    button.disabled = false;
    button.textContent = 'Run it again';
  }

  function run() {
    button.disabled = true;
    list.classList.add('running');
    if (reducedMotion) {
      finish();
      return;
    }
    let index = 0;
    setDays(START_DAYS);
    mark(0);
    const timer = setInterval(() => {
      index += 1;
      if (index >= steps.length) {
        clearInterval(timer);
        finish();
        return;
      }
      setDays(START_DAYS - index * DAYS_PER_STEP);
      mark(index);
    }, STEP_MS);
  }

  setDays(START_DAYS);
  button.addEventListener('click', run);
}
