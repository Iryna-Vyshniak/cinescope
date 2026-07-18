import { State } from './state.js';
import { DOM } from './utils.js';

export const FavoritesManager = {
  init() {
    const btn = DOM.get('userProfileBtn');
    const popup = DOM.get('favoritesPopup');

    if (btn && popup) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', (!isExpanded).toString());
        popup.classList.toggle('hidden');
      });

      document.addEventListener('click', (e) => {
        if (!popup.contains(e.target) && e.target !== btn) {
          popup.classList.add('hidden');
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    this.renderAll();
  },

  toggle(movie) {
    const index = State.favorites.findIndex(item => item.id === movie.id);
    if (index === -1) {
      State.favorites.push(movie);
    } else {
      State.favorites.splice(index, 1);
    }
    localStorage.setItem('cinescope_favorites', JSON.stringify(State.favorites));
    this.renderAll();
    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
  },

  isFavorite(id) {
    return State.favorites.some(item => item.id === id);
  },

  renderAll() {
    const list = DOM.get('favoritesList');
    const countBadge = DOM.get('favCountBadge');
    const popupCount = DOM.get('favPopupCount');
    
    if (!list) return;

    const total = State.favorites.length;
    if (popupCount) popupCount.innerText = `${total} items`;

    if (countBadge) {
      if (total > 0) {
        countBadge.innerText = total;
        countBadge.classList.remove('hidden');
      } else {
        countBadge.classList.add('hidden');
      }
    }

    if (total === 0) {
      list.innerHTML = `<p class="text-xs text-neutral-500 text-center py-6">Your collection is empty. Bookmark movies inside details cards.</p>`;
      return;
    }

    list.innerHTML = '';
    State.favorites.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = "flex items-center gap-3 p-2 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group relative";
      itemElement.setAttribute("role", "link");
      itemElement.setAttribute("tabindex", "0");
      
      itemElement.innerHTML = `
        <img src="${item.poster}" class="w-10 h-14 object-cover rounded-md border border-white/10 shrink-0" alt="" loading="lazy">
        <div class="flex-grow overflow-hidden pr-8">
          <h4 class="text-xs font-black truncate text-gray-200 group-hover:text-white">${item.title}</h4>
          <p class="text-[10px] text-gray-400 mt-0.5">${item.year} &bull; ★ ${item.rating}</p>
        </div>
        <button class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-brand-red text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs" aria-label="Remove" data-remove-id="${item.id}">
          &times;
        </button>
      `;

      itemElement.addEventListener('click', (e) => {
        if (e.target.closest("[data-remove-id]")) return;
        window.dispatchEvent(new CustomEvent('openModal', { detail: item.id }));
      });

      const removeBtn = itemElement.querySelector("[data-remove-id]");
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggle(item);
        });
      }

      list.appendChild(itemElement);
    });
  }
};