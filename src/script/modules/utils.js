export const Announcer = {
  speak(message) {
    const el = document.getElementById('aria-live-announcer');
    if (el) el.textContent = message;
  }
};

export const DOM = {
  get: (id) => {
    const el = document.getElementById(id);
    if (!el) console.warn(`[DOM Warning] Element '${id}' not found.`);
    return el;
  },
  hide: (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  },
  show: (id, displayStyle = 'block') => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('hidden');
      if (displayStyle !== 'block') el.classList.add(displayStyle);
    }
  },
  addEvent: (id, event, callback) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener(event, callback);
    } else {
      console.warn(`[Event Warning] Cannot bind '${event}' to missing ID '${id}'.`);
    }
  }
};