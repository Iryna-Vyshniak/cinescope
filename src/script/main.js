import { State } from './modules/state.js';
import { APIService } from './modules/api.js';
import { UIEngine } from './modules/ui.js';
import { ModalController } from './modules/modal.js';
import { FavoritesManager } from './modules/favorites.js';
import { DOM, Announcer } from './modules/utils.js';

import Swiper from 'swiper';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const App = {
  async init() {
    await this.playIntro();

    ModalController.init();
    FavoritesManager.init();
    this.bindEvents();
    await this.loadDashboard();
  },

  playIntro() {
    return new Promise((resolve) => {
      const overlay = DOM.get('introOverlay');
      if (!overlay) { resolve(); return; }

      // After animation completes (~2.2s), fade out the overlay
      setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => {
          overlay.remove();
          resolve();
        }, 600);
      }, 2200);
    });
  },

  bindEvents() {
    DOM.addEvent('searchForm', 'submit', async (e) => {
      e.preventDefault();
      State.currentPage = 1;
      await this.executeSearch();
    });

    DOM.addEvent('backToDashboardBtn', 'click', () => {
      DOM.show('carouselsContentPanel');
      DOM.hide('searchResultsViewport');
      DOM.hide('searchReturnBox');
      const headline = DOM.get('dashboardHeadline');
      if (headline) {
        headline.className = 'text-2xl md:text-3xl font-black flex items-center gap-3 mt-10 mb-5';
        headline.innerHTML = '<span class="section-accent" aria-hidden="true"></span>Trending Content';
      }
      const input = DOM.get('searchInput');
      if (input) input.value = '';
    });

    window.addEventListener('changePage', async (e) => {
      State.currentPage = e.detail;
      await this.executeSearch();
    });

    window.addEventListener('scroll', () => {
      const nav = DOM.get('mainNavbar');
      if (!nav) return;
      if (window.scrollY > 50) {
        nav.classList.add('bg-[#141414]/95', 'backdrop-blur-md', 'border-b', 'border-white/5', 'shadow-xl');
      } else {
        nav.classList.remove('bg-[#141414]/95', 'backdrop-blur-md', 'border-b', 'border-white/5', 'shadow-xl');
      }
    });

    this.initCustomSelect();
  },

  initCustomSelect() {
    const btn = DOM.get('customSelectBtn');
    const list = DOM.get('customSelectList');
    const input = DOM.get('typeSelect');
    const text = DOM.get('customSelectText');
    if (!btn || !list || !input || !text) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      if (expanded) {
        list.classList.add('hidden');
        list.classList.remove('flex');
      } else {
        list.classList.remove('hidden');
        list.classList.add('flex');
      }
    });

    list.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      
      const val = li.getAttribute('data-value');
      input.value = val;
      text.textContent = li.textContent;
      
      list.querySelectorAll('li').forEach(el => el.setAttribute('aria-selected', 'false'));
      li.setAttribute('aria-selected', 'true');
      
      btn.setAttribute('aria-expanded', 'false');
      list.classList.add('hidden');
      list.classList.remove('flex');
    });

    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !list.contains(e.target)) {
        btn.setAttribute('aria-expanded', 'false');
        list.classList.add('hidden');
        list.classList.remove('flex');
      }
    });
  },

  swipers: {},
  searchAbortController: null,

  initSwiper(selector, prevEl, nextEl) {
    if (this.swipers[selector]) {
      this.swipers[selector].update();
      return;
    }
    this.swipers[selector] = new Swiper(selector, {
      modules: [Navigation, Autoplay],
      slidesPerView: 1,
      spaceBetween: 16,
      loop: true,
      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
      },
      breakpoints: {
        640: { slidesPerView: 3 },
        1024: { slidesPerView: 4 },
        1280: { slidesPerView: 5 }
      },
      navigation: {
        nextEl: nextEl,
        prevEl: prevEl,
      },
    });
  },

  async loadDashboard() {
    // 1. Show hero with fallback data immediately, then show skeletons for all grid sections
    UIEngine.renderHero(State.fallbackHero);
    UIEngine.setSkeletons('trendingGridTrack');
    UIEngine.setSkeletons('recommendedGridTrack');
    UIEngine.setSkeletons('actorsGridTrack', true);

    try {
      const [trending, recommended, actors] = await Promise.all([
        APIService.fetchTrending(),
        APIService.fetchRecommended(),
        APIService.fetchActors()
      ]);

      if (trending.length > 0 && recommended.length > 0 && actors.length > 0) {
        State.trendingMovies = trending;
        State.recommendedMovies = recommended;
        State.actors = actors;
        State.heroMovie = trending[Math.floor(Math.random() * trending.length)];

        UIEngine.renderHero(State.heroMovie);
        UIEngine.renderSectionHeaders();
        UIEngine.renderGrid('trendingGridTrack', trending);
        UIEngine.renderGrid('recommendedGridTrack', recommended);
        UIEngine.renderGrid('actorsGridTrack', actors, true);

        // Initialize Swipers after DOM is populated
        this.initSwiper('#trendingSwiper', '#trendingPrevBtn', '#trendingNextBtn');
        this.initSwiper('#recsSwiper', '#recsPrevBtn', '#recsNextBtn');
        this.initSwiper('#actorsSwiper', '#actorsPrevBtn', '#actorsNextBtn');
      } else {
        throw new Error('Live API Endpoints Returned Empty');
      }

    } catch (e) {
      console.warn('API Data Request Halted. Keeping hero fallback + skeleton grids.', e);
      // Hero already shows fallback (Little House on the Prairie).
      // Grid skeletons stay visible — user sees shimmer placeholders.
      // Set section headers so user sees labeled sections with shimmer content.
      UIEngine.renderSectionHeaders();
    }
  },

  async executeSearch() {
    const input = DOM.get('searchInput');
    const select = DOM.get('typeSelect');
    if (!input || !select) return;

    const q = input.value.trim();
    const type = select.value;
    if (!q) return;

    if (this.searchAbortController) {
      this.searchAbortController.abort();
    }
    this.searchAbortController = new AbortController();
    const signal = this.searchAbortController.signal;

    DOM.hide('carouselsContentPanel');
    DOM.show('searchResultsViewport');
    DOM.show('searchReturnBox');

    UIEngine.setSkeletons('searchResultsGrid');

    try {
      const data = await APIService.searchOMDb(q, type, State.currentPage, signal);
      const headline = DOM.get('dashboardHeadline');
      if (headline) {
        headline.className = 'text-2xl md:text-3xl font-black flex items-center gap-3 mt-10 mb-5';
        headline.innerHTML = `<span class="section-accent" aria-hidden="true"></span>Results for \u201C${q}\u201D`;
      }

      UIEngine.renderGrid('searchResultsGrid', data.results);
      UIEngine.renderPagination(data.total, State.currentPage);
      Announcer.speak(`Found ${data.total} results for ${q}.`);
      if (headline) headline.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Search aborted due to a new search request.');
        return;
      }
      const grid = DOM.get('searchResultsGrid');
      if (grid) grid.innerHTML = `<li class="col-span-full py-12 text-center text-[#737373]">Movie not found! Please adjust your query.</li>`;
      DOM.hide('paginationController');
      Announcer.speak('No results found.');
    }
  }
};

window.addEventListener('DOMContentLoaded', () => App.init());