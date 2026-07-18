export const State = {
  omdbKey: '6e0a9317',
  tmdbKey: '80849c20aa63241eb028c4e7b7d0f3a8',
  currentPage: 1,
  trendingMovies: [],
  recommendedMovies: [],
  actors: [],
  heroMovie: null,
  currentDetailsMovie: null,
  favorites: JSON.parse(localStorage.getItem('cinescope_favorites')) || [],
  cache: new Map(),


  fallbackHero: {
    id: 'tt0071007',
    title: 'Little House on the Prairie',
    year: '1974',
    rating: '7.5',
    type: 'Series',
    plot: 'The life and adventures of the Ingalls family in the nineteenth century American Midwest. Based on Laura Ingalls Wilder\'s beloved book series, this heartwarming classic follows a family making their way on the frontier.',
    backdrop: '/src/assets/hero-poster.jpg',
    poster: '/src/assets/hero.png'
  },
};