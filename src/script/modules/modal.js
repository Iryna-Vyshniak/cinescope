import { State } from './state.js';
import { APIService } from './api.js';
import { FavoritesManager } from './favorites.js';
import { DOM, Announcer } from './utils.js';

export const ModalController = {
  dialog: null,
  _currentData: null,

  /* Safely read a field */
  _safe(val, fallback = '') {
    if (val === undefined || val === null || val === 'N/A' || val === 'undefined') return fallback;
    if (Array.isArray(val)) return val;
    return String(val);
  },

  init() {
    this.dialog = document.getElementById('detailsModal');
    if (!this.dialog) return;

    DOM.addEvent('modalCloseBtn', 'click', () => this.close());
    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.dialog.open) this.close();
    });

    document.querySelectorAll('[data-tab]').forEach((tab) => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    const tabList = document.querySelector('[role="tablist"]');
    if (tabList) {
      tabList.addEventListener('keydown', (e) => {
        const tabs = [...tabList.querySelectorAll('[role="tab"]')];
        const idx  = tabs.findIndex(t => t === document.activeElement);
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          tabs[(idx + 1) % tabs.length].focus();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          tabs[(idx - 1 + tabs.length) % tabs.length].focus();
        }
      });
    }

    window.addEventListener('openModal', async (e) => {
      this._openWithSkeleton();

      try {
        const payload = e.detail;
        const id = typeof payload === 'object' ? payload.id : payload;
        const data = await APIService.getDetails(id);
        this._currentData = data;

        const poster = this._safe(data.Poster) || this._safe(data.poster) || '/src/assets/no-poster.jpg';

        State.currentDetailsMovie = {
          id:     this._safe(data.imdbID || data.id),
          title:  (typeof payload === 'object' && payload.title) ? payload.title : this._safe(data.Title  || data.title, 'Unknown Title'),
          poster: (typeof payload === 'object' && payload.poster) ? payload.poster : poster,
          year:   (typeof payload === 'object' && payload.year) ? payload.year : this._safe(data.Year   || data.year),
          rating: (typeof payload === 'object' && payload.rating) ? payload.rating : this._safe(data.imdbRating || data.rating, '0'),
        };

        this.renderOverview(data);
        this.renderCast(data);
        this.renderDetails(data);
        this.updateFavButton();
        this.switchTab('tab-overview');

        Announcer.speak(`Opened details for ${State.currentDetailsMovie.title}`);
      } catch (err) {
        console.error('[ModalController] Failed to load details:', err);
        this.close();
      }
    });

    window.addEventListener('favoritesUpdated', () => this.updateFavButton());
  },

  _openWithSkeleton() {
    this.dialog.showModal();
    document.body.classList.add('modal-open-lock');
    this.switchTab('tab-overview');

    const injection = DOM.get('modalContentInjection');
    if (injection) {
      injection.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-7">
          <div class="aspect-2/3 shimmer-bg rounded-xl w-full"></div>
          <div class="flex flex-col gap-4 pt-1">
            <div class="shimmer-bg h-8 w-3/4 rounded-lg"></div>
            <div class="shimmer-bg h-4 w-1/3 rounded-md"></div>
            <div class="shimmer-bg h-4 w-1/2 rounded-md"></div>
            <div class="shimmer-bg h-20 w-full rounded-md"></div>
            <div class="flex gap-3 mt-2">
              <div class="shimmer-bg h-10 w-32 rounded-lg"></div>
              <div class="shimmer-bg h-10 w-36 rounded-lg"></div>
            </div>
          </div>
        </div>`;
    }

    const castContent = DOM.get('modalCastContent');
    if (castContent) {
      castContent.innerHTML = `
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          ${Array(8).fill(`
            <div class="cast-card">
              <div class="w-16 h-16 rounded-full shimmer-bg shrink-0"></div>
              <div class="shimmer-bg h-3 w-3/4 rounded mt-1"></div>
              <div class="shimmer-bg h-2 w-1/2 rounded"></div>
            </div>`).join('')}
        </div>`;
    }

    const detailsContent = DOM.get('modalDetailsContent');
    if (detailsContent) {
      detailsContent.innerHTML = Array(6).fill(`
        <div class="detail-row">
          <div class="shimmer-bg h-3 w-20 rounded"></div>
          <div class="shimmer-bg h-3 w-full rounded"></div>
        </div>`).join('');
    }

    const recsGrid = DOM.get('modalRecsGrid');
    if (recsGrid) recsGrid.innerHTML = '';
  },

  renderOverview(data) {
    const injection = DOM.get('modalContentInjection');
    if (!injection) return;

    const movie = State.currentDetailsMovie;
    const title  = this._safe(movie.title, 'Unknown Title');
    const year   = this._safe(movie.year);
    const rating = this._safe(movie.rating, '0');
    const genres = this._safe(data.Genre || data.genres);
    const plot   = this._safe(data.Plot  || data.plot, 'No plot available.');
    const ratingNum = parseFloat(rating) || 0;
    const pct = Math.round((ratingNum / 10) * 100);

    injection.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-7 fade-in-up">
        <img src="${movie.poster}" class="w-full rounded-xl shadow-xl aspect-[2/3] object-cover border border-white/10" alt="Poster for ${title}" loading="lazy">
        <div class="flex flex-col gap-3">
          <h2 class="text-2xl md:text-3xl font-black text-white leading-tight" id="modalTitle">
            ${title}
            ${year ? `<span class="text-[#737373] font-light text-xl ml-1">(${year})</span>` : ''}
          </h2>

          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="text-brand-red text-xs font-black">★ ${rating}</span>
            ${genres ? genres.split(',').map(g => `
              <span class="px-2 py-0.5 border border-white/20 text-[#B3B3B3] text-[11px] font-semibold rounded-full">${g.trim()}</span>`).join('') : ''}
          </div>

          <!-- Circular Rating -->
          <div class="flex items-center gap-3">
            <div class="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" class="stroke-[#2B2B2B]" stroke-width="3"></circle>
                <circle cx="18" cy="18" r="16" fill="none" class="stroke-brand-red" stroke-width="3" stroke-dasharray="100" stroke-dashoffset="${100 - pct}" stroke-linecap="round" style="transition: stroke-dashoffset 1s ease-out;"></circle>
              </svg>
              <span class="absolute text-[10px] font-black text-white">${rating}</span>
            </div>
            <span class="text-xs font-bold text-[#B3B3B3]">User Score</span>
          </div>

          <p class="text-[#B3B3B3] text-sm leading-relaxed mt-1">${plot}</p>

          <div class="flex flex-wrap gap-3 mt-3">
            <button id="favActionBtn" class="inline-flex items-center gap-2 px-4 py-2.5 border border-white/20 hover:bg-white/10 text-sm font-bold rounded-lg focus:ring-2 focus:ring-white focus:outline-none transition-all">
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              Add to Collection
            </button>
          </div>
        </div>
      </div>`;

    DOM.addEvent('favActionBtn', 'click', () => FavoritesManager.toggle(State.currentDetailsMovie));
  },

  renderCast(data) {
    const castContent = DOM.get('modalCastContent');
    if (!castContent) return;

    const directorStr = this._safe(data.Director);
    const writerStr   = this._safe(data.Writer);

    const cast = [];

    if (directorStr && typeof directorStr === 'string') {
      directorStr.split(',').forEach(name => {
        const n = name.trim();
        if (n) cast.push({ name: n, role: 'Director', img: '/src/assets/avatar.png' });
      });
    }
    if (writerStr && typeof writerStr === 'string') {
      writerStr.split(',').slice(0, 3).forEach(name => {
        const n = name.trim().replace(/\s*\(.*?\)/g, '');
        if (n) cast.push({ name: n, role: 'Writer', img: '/src/assets/avatar.png' });
      });
    }

    if (Array.isArray(data.Actors)) {
      data.Actors.forEach(a => cast.push({ name: a.name, role: a.role, img: a.img }));
    } else {
      const actorStr = this._safe(data.Actors);
      if (actorStr && typeof actorStr === 'string') {
        actorStr.split(',').forEach(name => {
          const n = name.trim();
          if (n) cast.push({ name: n, role: 'Actor', img: '/src/assets/avatar.png' });
        });
      }
    }

    if (cast.length === 0) {
      castContent.innerHTML = `<p class="text-[#737373] text-sm py-8 text-center">No cast information available.</p>`;
      return;
    }

    castContent.innerHTML = `
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 fade-in-up">
        ${cast.map(member => `
          <div class="cast-card w-full!">
            <img src="${member.img}" class="w-14 h-14 rounded-full object-cover border border-white/10 shrink-0 mx-auto" alt="${member.name}">
            <p class="text-xs font-black text-white text-center leading-tight mt-2">${member.name}</p>
            <p class="text-[10px] text-[#737373] text-center font-semibold uppercase tracking-wide">${member.role}</p>
          </div>`).join('')}
      </div>`;
  },

  renderDetails(data) {
    const detailsContent = DOM.get('modalDetailsContent');
    if (!detailsContent) return;

    const rows = [
      { label: 'Rated',      value: this._safe(data.Rated) },
      { label: 'Released',   value: this._safe(data.Released || data.year) },
      { label: 'Runtime',    value: this._safe(data.Runtime) },
      { label: 'Genre',      value: this._safe(data.Genre) },
      { label: 'Director',   value: this._safe(data.Director) },
      { label: 'Writer',     value: this._safe(data.Writer) },
      { label: 'Language',   value: this._safe(data.Language) },
      { label: 'Country',    value: this._safe(data.Country) },
      { label: 'Awards',     value: this._safe(data.Awards) },
      { label: 'Box Office', value: this._safe(data.BoxOffice) },
      { label: 'IMDb Votes', value: this._safe(data.imdbVotes) },
    ].filter(row => row.value);

    if (rows.length === 0) {
      detailsContent.innerHTML = `<p class="text-[#737373] text-sm py-8 text-center">No additional details available.</p>`;
      return;
    }

    detailsContent.innerHTML = `
      <dl class="fade-in-up">
        ${rows.map(row => `
          <div class="detail-row">
            <dt class="detail-label">${row.label}</dt>
            <dd class="detail-value">${row.value}</dd>
          </div>`).join('')}
      </dl>`;
  },

  updateFavButton() {
    const btn = DOM.get('favActionBtn');
    if (!btn || !State.currentDetailsMovie) return;

    const isFav = FavoritesManager.isFavorite(State.currentDetailsMovie.id);
    btn.innerHTML = isFav
      ? `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>In Collection`
      : `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>Add to Collection`;

    btn.className = isFav
      ? 'inline-flex items-center gap-2 px-4 py-2.5 bg-brand-red text-white text-sm font-bold rounded-lg focus:ring-2 focus:ring-white focus:outline-none transition-all'
      : 'inline-flex items-center gap-2 px-4 py-2.5 border border-white/20 hover:bg-white/10 text-sm font-bold rounded-lg focus:ring-2 focus:ring-white focus:outline-none transition-all';
  },

  switchTab(tabId) {
    document.querySelectorAll('[role="tab"]').forEach((tab) => {
      const isActive = tab.dataset.tab === tabId;
      tab.setAttribute('aria-selected', isActive.toString());
      tab.className = [
        'flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all',
        'focus:outline-none focus:ring-inset focus:ring-2 focus:ring-brand-red',
        isActive ? 'tab-active' : 'tab-inactive'
      ].join(' ');
    });

    document.querySelectorAll('.tab-panel').forEach((panel) => {
      const panelId = 'panel-' + tabId.replace('tab-', '');
      if (panel.id === panelId) {
        panel.classList.remove('hidden');
        panel.classList.add('block');
      } else {
        panel.classList.add('hidden');
        panel.classList.remove('block');
      }
    });
  },

  close() {
    if (this.dialog) this.dialog.close();
    document.body.classList.remove('modal-open-lock');
    this._currentData = null;
  },
};