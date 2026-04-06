const RSS_PROXY = 'https://api.allorigins.win/raw?url=';
const RSS_BASE = 'https://news.google.com/rss';
const SPACEFLIGHT_API = 'https://api.spaceflightnewsapi.net/v4/articles/?limit=12&ordering=-published_at';
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=60';

const CATEGORY_QUERY = {
  hoje: 'notícias do dia when:1d',
  brasil: 'Brasil when:1d',
  mundo: 'mundo when:1d',
  economia: 'economia when:1d',
  tecnologia: 'tecnologia when:1d'
};

const STORAGE_KEYS = {
  read: 'noticias_lidas',
  favorites: 'noticias_favoritas'
};

const newsList = document.getElementById('news-list');
const topFiveList = document.getElementById('top-five-list');
const statusEl = document.getElementById('status');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const refreshBtn = document.getElementById('refresh-btn');
const cardTemplate = document.getElementById('news-card-template');
const categoryButtons = document.querySelectorAll('.category-btn');

const state = {
  currentCategory: 'hoje',
  currentSearch: '',
  items: [],
  read: new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.read) || '[]')),
  favorites: new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || '[]'))
};

function setStatus(message) {
  statusEl.textContent = message;
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.read, JSON.stringify([...state.read]));
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify([...state.favorites]));
}

function getItemId(item) {
  return item.url;
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(dateString));
}

function truncate(text, maxLength = 170) {
  if (!text) return 'Sem descrição disponível.';
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

function setActiveCategory(category) {
  categoryButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.category === category);
  });
}

function makeGoogleNewsUrl({ category, searchTerm }) {
  const query = searchTerm.trim() || CATEGORY_QUERY[category] || CATEGORY_QUERY.hoje;
  const url = `${RSS_BASE}/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  return `${RSS_PROXY}${encodeURIComponent(url)}`;
}

function parseRssItems(xmlText) {
  const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
  const rssItems = [...xmlDoc.querySelectorAll('item')];
  const items = rssItems.map((item) => {
    const title = item.querySelector('title')?.textContent?.trim() || 'Sem título';
    const url = item.querySelector('link')?.textContent?.trim() || '#';
    const source = item.querySelector('source')?.textContent?.trim() || 'Google News';
    const publishedAt = item.querySelector('pubDate')?.textContent || new Date().toISOString();
    const description = item.querySelector('description')?.textContent || '';

    return {
      title,
      url,
      news_site: source,
      published_at: new Date(publishedAt).toISOString(),
      summary: description.replace(/<[^>]+>/g, '').trim(),
      image_url: ''
    };
  });

  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.title}|${item.news_site}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchGoogleNews({ category, searchTerm }) {
  const response = await fetch(makeGoogleNewsUrl({ category, searchTerm }));

  if (!response.ok) {
    throw new Error(`Erro no Google News RSS: ${response.status}`);
  }

  const text = await response.text();
  return parseRssItems(text).slice(0, 20);
}

async function fetchSpaceflightFallback() {
  const response = await fetch(SPACEFLIGHT_API);
  if (!response.ok) throw new Error(`Erro no fallback: ${response.status}`);
  const data = await response.json();
  return data.results ?? [];
}

function renderTopFive(items) {
  topFiveList.innerHTML = '';
  items.slice(0, 5).forEach((item) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = item.title;
    li.appendChild(link);
    topFiveList.appendChild(li);
  });
}

function renderNews(items) {
  newsList.innerHTML = '';

  if (!items.length) {
    setStatus('Nenhuma notícia encontrada para este filtro.');
    renderTopFive([]);
    return;
  }

  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const id = getItemId(item);
    const clone = cardTemplate.content.cloneNode(true);

    const card = clone.querySelector('.news-card');
    card.classList.toggle('read', state.read.has(id));

    const image = clone.querySelector('.news-image');
    image.src = item.image_url || PLACEHOLDER_IMAGE;

    clone.querySelector('.news-title').textContent = item.title;
    clone.querySelector('.news-summary').textContent = truncate(item.summary);
    clone.querySelector('.news-source').textContent = item.news_site;

    const dateEl = clone.querySelector('.news-date');
    dateEl.textContent = formatDate(item.published_at);
    dateEl.dateTime = item.published_at;

    const readButton = clone.querySelector('.btn-read');
    readButton.classList.toggle('active', state.read.has(id));
    readButton.textContent = state.read.has(id) ? 'Lida' : 'Marcar como lida';
    readButton.addEventListener('click', () => {
      if (state.read.has(id)) {
        state.read.delete(id);
      } else {
        state.read.add(id);
      }
      saveState();
      renderNews(state.items);
    });

    const favoriteButton = clone.querySelector('.btn-favorite');
    favoriteButton.classList.toggle('active', state.favorites.has(id));
    favoriteButton.textContent = state.favorites.has(id) ? 'Salva' : 'Salvar';
    favoriteButton.addEventListener('click', () => {
      if (state.favorites.has(id)) {
        state.favorites.delete(id);
      } else {
        state.favorites.add(id);
      }
      saveState();
      renderNews(state.items);
    });

    const link = clone.querySelector('.news-link');
    link.href = item.url;

    fragment.appendChild(clone);
  });

  newsList.appendChild(fragment);
  renderTopFive(items);
  setStatus(`Exibindo ${items.length} notícia(s) da categoria ${state.currentCategory}.`);
}

async function loadNews({ category = state.currentCategory, searchTerm = state.currentSearch } = {}) {
  setStatus('Carregando notícias do dia...');

  try {
    const items = await fetchGoogleNews({ category, searchTerm });
    state.currentCategory = category;
    state.currentSearch = searchTerm;
    state.items = items;
    setActiveCategory(category);
    renderNews(items);
  } catch (primaryError) {
    console.warn(primaryError);
    setStatus('Fonte principal indisponível. Carregando fallback...');

    try {
      const fallbackItems = await fetchSpaceflightFallback();
      state.currentCategory = category;
      state.currentSearch = searchTerm;
      state.items = fallbackItems;
      setActiveCategory(category);
      renderNews(fallbackItems);
      setStatus('Exibindo notícias via fonte alternativa.');
    } catch (fallbackError) {
      console.error(fallbackError);
      newsList.innerHTML = '';
      renderTopFive([]);
      setStatus('Não foi possível carregar as notícias no momento.');
    }
  }
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadNews({ category: state.currentCategory, searchTerm: searchInput.value.trim() });
});

refreshBtn.addEventListener('click', () => {
  loadNews({ category: state.currentCategory, searchTerm: state.currentSearch });
});

categoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    searchInput.value = '';
    loadNews({ category: button.dataset.category, searchTerm: '' });
  });
});

loadNews();
