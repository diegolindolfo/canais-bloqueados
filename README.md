# Notícias do Dia

App web leve para acompanhar os fatos do dia com foco em notícias gerais.

## O que o app entrega

- Feed com notícias de **Hoje**, **Brasil**, **Mundo**, **Economia** e **Tecnologia**.
- Busca por palavra-chave.
- Seção **Top 5 do dia** para leitura rápida.
- Marcação local de notícias **lidas** e **salvas** (favoritas).
- Fallback automático de fonte caso a principal esteja indisponível.

## Fontes de dados

- Fonte principal: Google News RSS (via proxy CORS).
- Fallback: Spaceflight News API.

## Como executar

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000` no navegador.
