const API_BASE = 'https://api.spaceflightnewsapi.net/v4/articles/';
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=60';

const newsList = document.getElementById('news-list');
const statusEl = document.getElementById('status');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const refreshBtn = document.getElementById('refresh-btn');
const cardTemplate = document.getElementById('news-card-template');

let currentSearch = '';

function setStatus(message) {
  statusEl.textContent = message;
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(dateString));
}

function truncate(text, maxLength = 160) {
  if (!text) return 'Sem descrição disponível.';
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

function buildUrl(searchTerm = '') {
  const params = new URLSearchParams({
    limit: '12',
    ordering: '-published_at'
  });

  if (searchTerm.trim()) {
    params.set('title_contains', searchTerm.trim());
  }

  return `${API_BASE}?${params.toString()}`;
}

function renderNews(items) {
  newsList.innerHTML = '';

  if (!items.length) {
    setStatus('Nenhuma notícia encontrada para este filtro.');
    return;
  }

  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const clone = cardTemplate.content.cloneNode(true);

    const image = clone.querySelector('.news-image');
    image.src = item.image_url || PLACEHOLDER_IMAGE;

    clone.querySelector('.news-title').textContent = item.title;
    clone.querySelector('.news-summary').textContent = truncate(item.summary);
    clone.querySelector('.news-source').textContent = item.news_site;

    const dateEl = clone.querySelector('.news-date');
    dateEl.textContent = formatDate(item.published_at);
    dateEl.dateTime = item.published_at;

    const link = clone.querySelector('.news-link');
    link.href = item.url;

    fragment.appendChild(clone);
  });

  newsList.appendChild(fragment);
  setStatus(`Exibindo ${items.length} notícia(s).`);
}

async function loadNews(searchTerm = '') {
  setStatus('Carregando notícias...');

  try {
    const response = await fetch(buildUrl(searchTerm));

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const data = await response.json();
    renderNews(data.results ?? []);
  } catch (error) {
    console.error(error);
    newsList.innerHTML = '';
    setStatus('Não foi possível carregar as notícias. Tente novamente.');
  }
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  currentSearch = searchInput.value;
  loadNews(currentSearch);
});

refreshBtn.addEventListener('click', () => {
  loadNews(currentSearch);
});

loadNews();
