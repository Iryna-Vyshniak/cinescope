import { State } from './state.js';

export const APIService = {
  async query(url, signal = null) {
    if (State.cache.has(url)) return State.cache.get(url);
    const options = { headers: { 'Accept': 'application/json' } };
    if (signal) options.signal = signal;
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
    const data = await response.json();
    State.cache.set(url, data);
    return data;
  },

  async fetchTrending() {
    if (!State.tmdbKey) throw new Error("TMDB Key Missing");
    const data = await this.query(`https://api.themoviedb.org/3/trending/movie/week?api_key=${State.tmdbKey}`);
    return data.results.slice(0, 10).map(m => this.mapTMDB(m));
  },

  async fetchRecommended() {
    if (!State.tmdbKey) throw new Error("TMDB Key Missing");
    const data = await this.query(`https://api.themoviedb.org/3/movie/popular?api_key=${State.tmdbKey}`);
    return data.results.slice(0, 10).map(m => this.mapTMDB(m));
  },

  async fetchActors() {
    if (!State.tmdbKey) throw new Error("TMDB Key Missing");
    const data = await this.query(`https://api.themoviedb.org/3/trending/person/week?api_key=${State.tmdbKey}`);
    return data.results.slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      role: p.known_for_department || "Actor",
      img: p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : '/src/assets/avatar.png'
    }));
  },

  async searchOMDb(query, type, page, signal) {
    if (!State.omdbKey) throw new Error("OMDb Key Missing");
    const data = await this.query(`https://www.omdbapi.com/?apikey=${State.omdbKey}&s=${encodeURIComponent(query)}&type=${type}&page=${page}`, signal);
    if (data.Response === "False") throw new Error(data.Error);
    
    // Fetch details for each result to get accurate imdbRating (fixes "0" rating bug)
    const detailedResults = await Promise.all(data.Search.map(async (item) => {
      try {
        const detail = await this.query(`https://www.omdbapi.com/?apikey=${State.omdbKey}&i=${item.imdbID}`, signal);
        return { ...item, imdbRating: detail.imdbRating !== 'N/A' ? detail.imdbRating : '0' };
      } catch (e) {
        return { ...item, imdbRating: '0' };
      }
    }));

    return { results: detailedResults, total: parseInt(data.totalResults) };
  },

  async getDetails(id) {
    const strId = String(id);
    if (strId.startsWith('tt')) {
      if (!State.omdbKey) throw new Error("OMDb Key Missing");
      return await this.query(`https://www.omdbapi.com/?apikey=${State.omdbKey}&i=${strId}&plot=full`);
    } else {
      if (!State.tmdbKey) throw new Error("TMDB Key Missing");
      const data = await this.query(`https://api.themoviedb.org/3/movie/${strId}?api_key=${State.tmdbKey}&append_to_response=credits`);
      return {
        imdbID: data.imdb_id || data.id.toString(),
        Title: data.title,
        Year: (data.release_date || '').split('-')[0] || 'N/A',
        Poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : 'N/A',
        Runtime: data.runtime ? `${data.runtime} min` : 'N/A',
        Genre: data.genres ? data.genres.map(g => g.name).join(', ') : 'N/A',
        Director: data.credits?.crew?.filter(c => c.job === 'Director').map(c => c.name).join(', ') || 'N/A',
        Writer: data.credits?.crew?.filter(c => c.department === 'Writing').map(c => c.name).join(', ') || 'N/A',
        Actors: data.credits?.cast?.slice(0, 10).map(c => ({
          name: c.name,
          role: c.character,
          img: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : '/src/assets/avatar.png'
        })) || [],
        Plot: data.overview || 'N/A',
        Language: data.spoken_languages?.map(l => l.english_name).join(', ') || 'N/A',
        Country: data.production_countries?.map(c => c.name).join(', ') || 'N/A',
        imdbRating: (data.vote_average || 0).toFixed(1),
        imdbVotes: data.vote_count ? data.vote_count.toLocaleString() : 'N/A',
        Rated: data.adult ? 'NC-17' : 'PG-13',
        BoxOffice: data.revenue ? `$${data.revenue.toLocaleString()}` : 'N/A'
      };
    }
  },

  mapTMDB(m) {
    return {
      id: m.id.toString(),
      title: m.title || m.name,
      year: (m.release_date || '').split('-')[0] || 'N/A',
      rating: (m.vote_average || 0).toFixed(1),
      plot: m.overview,
      type: 'movie',
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '/src/assets/movie.png',
      backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : '/src/assets/no-poster.jpg'
    };
  }
};