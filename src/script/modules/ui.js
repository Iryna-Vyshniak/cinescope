import { DOM } from './utils.js';

export const UIEngine = {

  /* ── Safely read a field, returning '' if undefined/null/N/A ── */
  _safe(val, fallback = '') {
    if (val === undefined || val === null || val === 'N/A' || val === 'undefined') return fallback;
    return String(val);
  },

  /* ── Hero ── */
  renderHero(movie) {
    const section = DOM.get('heroSection');
    const content = DOM.get('heroContent');
    if (!movie || !section || !content) { this.setHeroSkeleton(); return; }

    section.style.backgroundImage = `url('${movie.backdrop}')`;

    const title  = this._safe(movie.title, 'CineScope');
    const year   = this._safe(movie.year);
    const rating = this._safe(movie.rating, '0');
    const type   = this._safe(movie.type, 'Featured');
    const plot   = this._safe(movie.plot, 'Discover trending movies, top-rated shows, and celebrated actors all in one place.');
    const ratingNum = parseFloat(rating) || 0;
    const pct = Math.round((ratingNum / 10) * 100);

    content.innerHTML = `
      <div class="fade-in-up flex flex-col gap-3">
        <span class="inline-flex items-center gap-2 self-start px-3 py-1 bg-brand-red/20 border border-brand-red/60 text-brand-red text-[11px] font-black uppercase tracking-widest rounded-full">
          <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26z"/></svg>
          Spotlight
        </span>
        <h1 class="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">${title}</h1>
        <div class="flex items-center gap-3 text-sm text-[#B3B3B3]">
          <span class="text-brand-red font-black text-xs">★ ${rating}</span>
          ${year ? `<span>${year}</span>` : ''}
          ${type ? `<span class="uppercase font-semibold text-[11px] tracking-wide px-2 py-0.5 border border-white/20 rounded">${type}</span>` : ''}
        </div>
        <!-- Rating range bar -->
        <div class="max-w-50 flex items-center gap-2">
          <div class="rating-bar-track flex-1">
            <div class="rating-bar-fill" style="width: ${pct}%"></div>
          </div>
          <span class="text-[10px] text-[#B3B3B3] font-bold">${rating}/10</span>
        </div>
        <p class="text-[#B3B3B3] text-sm md:text-base line-clamp-3 max-w-xl leading-relaxed">${plot}</p>
      </div>
    `;
  },

  setHeroSkeleton() {
    const section = DOM.get('heroSection');
    const content = DOM.get('heroContent');
    if (section) section.style.backgroundImage = 'none';
    if (content) {
      content.innerHTML = `
        <div class="flex flex-col gap-4">
          <div class="shimmer-bg h-6 w-28 rounded-full"></div>
          <div class="shimmer-bg h-14 w-4/5 rounded-lg"></div>
          <div class="shimmer-bg h-5 w-2/5 rounded-md"></div>
          <div class="shimmer-bg h-20 w-full rounded-md"></div>
        </div>
      `;
    }
  },

  /* ── Section headings ── */
  renderSectionHeaders() {
    const dashboard = DOM.get('dashboardHeadline');
    if (dashboard) {
      dashboard.className = 'text-2xl md:text-3xl font-black flex items-center gap-3 mt-10 mb-5';
      dashboard.innerHTML = '<span class="section-accent" aria-hidden="true"></span>Trending Content';
    }
    const recs = DOM.get('recsHeading');
    if (recs) {
      recs.className = 'text-xl font-bold mb-4 text-[#E5E5E5] flex items-center gap-2';
      recs.innerHTML = '<span class="section-accent" aria-hidden="true"></span>Recommended Watches';
    }
    const actors = DOM.get('actorsHeading');
    if (actors) {
      actors.className = 'text-xl font-bold mb-4 text-[#E5E5E5] flex items-center gap-2';
      actors.innerHTML = '<span class="section-accent" aria-hidden="true"></span>Celebrated Artists';
    }
  },

  /* ── Grid renderer ── */
  renderGrid(containerId, items, isActor = false) {
    const container = DOM.get(containerId);
    if (!container || !items || !items.length) return;
    container.innerHTML = '';

    items.forEach((item, index) => {
      const li = document.createElement('li');

      if (isActor) {
        const name = this._safe(item.name, 'Unknown');
        const role = this._safe(item.role, 'Artist');
        const img  = this._safe(item.img, '/src/assets/avatar.png');

        li.className = 'swiper-slide cast-card fade-in-up';
        li.style.animationDelay = `${index * 40}ms`;
        li.innerHTML = `
          <img src="${img}" onerror="this.onerror=null; this.src='/src/assets/avatar.png';" class="w-16 h-16 rounded-full object-cover border-2 border-white/10 shrink-0" alt="${name}" loading="lazy" decoding="async" width="64" height="64">
          <p class="text-xs font-black text-white w-full truncate leading-tight">${name}</p>
          <p class="text-[10px] text-[#737373] w-full truncate">${role}</p>
        `;
      } else {
        const title = this._safe(item.title || item.Title, 'Unknown');
        const rating = this._safe(item.rating || item.imdbRating, '0');
        const year   = this._safe(item.year   || item.Year);
        const poster = this._safe(item.poster  || item.Poster);
        const id     = this._safe(item.id      || item.imdbID);
        const validPoster = (poster && poster !== 'N/A') ? poster : '/src/assets/movie.png';
        const ratingNum = parseFloat(rating) || 0;
        const pct = Math.round((ratingNum / 10) * 100);

        li.className = 'swiper-slide movie-card fade-in-up';
        li.style.animationDelay = `${index * 40}ms`;
        li.setAttribute('role', 'listitem');

        li.innerHTML = `
          <div class="aspect-2/3 relative overflow-hidden shrink-0">
            <img src="${validPoster}" onerror="this.onerror=null; this.src='/src/assets/movie.png';" class="w-full h-full object-cover" alt="Movie poster: ${title}" loading="lazy" decoding="async">
          </div>
          <div class="flex flex-col flex-1 gap-2 pt-3 pb-2 px-3">
            <h4 class="font-extrabold text-sm text-white leading-tight truncate">${title}</h4>
            <div class="flex items-center gap-2 mt-auto">
              <span class="text-brand-red text-[11px] font-black">★ ${rating}</span>
              ${year ? `<span class="text-[10px] text-[#737373] ml-auto">${year}</span>` : ''}
            </div>
          </div>
          <button class="card-details-btn" data-movie-id="${id}" aria-label="View details for ${title}">Details</button>
        `;

        const detailsPayload = { id, title, year, rating, poster: validPoster };

        const detailsBtn = li.querySelector('[data-movie-id]');
        if (detailsBtn) {
          detailsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('openModal', { detail: detailsPayload }));
          });
        }

        li.addEventListener('click', (e) => {
          if (e.target.closest('[data-movie-id]')) return;
          window.dispatchEvent(new CustomEvent('openModal', { detail: detailsPayload }));
        });

        li.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('openModal', { detail: detailsPayload }));
          }
        });

        li.setAttribute('tabindex', '0');
      }

      container.appendChild(li);
    });
  },

  /* ── Skeleton placeholders ── */
  setSkeletons(containerId, isActor = false) {
    const container = DOM.get(containerId);
    if (!container) return;

    const actorSkeleton = `
      <li class="swiper-slide cast-card" aria-hidden="true">
        <div class="w-16 h-16 rounded-full shimmer-bg shrink-0"></div>
        <div class="shimmer-bg h-3 w-3/4 rounded mt-1"></div>
        <div class="shimmer-bg h-2 w-1/2 rounded"></div>
      </li>`;

    const movieSkeleton = `
      <li class="swiper-slide movie-card" aria-hidden="true">
        <div class="aspect-2/3 w-full shimmer-bg shrink-0"></div>
        <div class="flex flex-col flex-1 gap-2 pt-3 pb-2 px-3">
          <div class="shimmer-bg h-4 w-4/5 rounded"></div>
          <div class="flex items-center gap-2 mt-auto">
            <div class="shimmer-bg h-3 w-10 rounded"></div>
            <div class="shimmer-bg h-3 w-8 rounded ml-auto"></div>
          </div>
        </div>
        <div class="shimmer-bg h-8 w-full rounded-md mt-auto"></div>
      </li>`;

    container.innerHTML = isActor
      ? Array(8).fill(actorSkeleton).join('')
      : Array(8).fill(movieSkeleton).join('');
  },

  /* ── Pagination ── */
  renderPagination(total, page) {
    const container = DOM.get('paginationController');
    if (!container) return;
    container.innerHTML = '';

    const pages = Math.min(Math.ceil(total / 10), 10);
    if (pages <= 1) return;

    if (page > 1) {
      const prev = this._pageBtn('\u2039 Prev', false, `Page ${page - 1}`);
      prev.addEventListener('click', () => window.dispatchEvent(new CustomEvent('changePage', { detail: page - 1 })));
      container.appendChild(prev);
    }

    for (let i = 1; i <= pages; i++) {
      const btn = this._pageBtn(i, i === page, `Page ${i}`);
      btn.addEventListener('click', () => window.dispatchEvent(new CustomEvent('changePage', { detail: i })));
      container.appendChild(btn);
    }

    if (page < pages) {
      const next = this._pageBtn('Next \u203A', false, `Page ${page + 1}`);
      next.addEventListener('click', () => window.dispatchEvent(new CustomEvent('changePage', { detail: page + 1 })));
      container.appendChild(next);
    }
  },

  _pageBtn(label, isActive, ariaLabel) {
    const btn = document.createElement('button');
    btn.className = `page-btn${isActive ? ' active' : ''}`;
    btn.innerHTML = label;
    btn.setAttribute('aria-label', ariaLabel);
    if (isActive) btn.setAttribute('aria-current', 'page');
    return btn;
  },
};