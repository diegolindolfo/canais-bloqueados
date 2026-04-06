# Notícias Agora

Aplicação web simples de notícias consumindo a API pública [Spaceflight News API](https://api.spaceflightnewsapi.net/).

## Como executar

Como é um app estático (HTML/CSS/JS), você pode abrir o `index.html` no navegador ou subir um servidor local.

Exemplo com Python:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Funcionalidades

- Listagem das notícias mais recentes.
- Busca por palavra-chave no título.
- Botão de atualização para recarregar os dados.
- Layout responsivo com cards.
