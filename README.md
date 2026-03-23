# AI Automation Engineer Landing

Лендинг-портфолио на Next.js 14 (App Router), перенесенный из статического макета [`demo-hub.html`](./demo-hub.html) без изменения дизайна.

Исходный HTML остается главным источником истины для верстки, а требования к миграции зафиксированы в [`instruction.md`](./instruction.md).

## Стек

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- `next/font/google` для шрифтов
- Vercel для деплоя

## Быстрый старт

```bash
npm install
npm run dev
```

Открыть локально:

```bash
http://localhost:3000
```

## Полезные команды

```bash
npm run dev
npm run build
npm run lint
npm run start
```

## Где что менять

- Контент, ссылки, данные карточек: [`app/page.tsx`](./app/page.tsx)
- Глобальные стили и дизайн-токены: [`app/globals.css`](./app/globals.css)
- Шрифты, `<title>`, `<meta name="description">`: [`app/layout.tsx`](./app/layout.tsx)
- UI-компоненты секций: [`components`](./components)

## Структура проекта

```text
app/
  globals.css
  layout.tsx
  page.tsx
components/
  Header.tsx
  Hero.tsx
  TrustBar.tsx
  ProblemCard.tsx
  ProofSection.tsx
  CtaSection.tsx
  Footer.tsx
.github/workflows/ci.yml
demo-hub.html
instruction.md
vercel.json
```

## Контент и ссылки

Все редактируемые значения собраны в `siteConfig` внутри [`app/page.tsx`](./app/page.tsx).

Перед публикацией стоит заменить плейсхолдеры:

- `upworkUrl`
- `githubUrl`
- `email`
- `demoUrl` и `githubUrl` внутри карточек

## Проверка перед деплоем

```bash
npm run build
npm run lint
```

Важно:

- не менять дизайн вручную вне логики исходного `demo-hub.html`
- не подставлять `#` вместо реальных demo/github ссылок
- для внешних ссылок использовать `target="_blank"` и `rel="noopener noreferrer"`

## Деплой

Сборка настроена под Vercel.

- Конфиг платформы: [`vercel.json`](./vercel.json)
- CI GitHub Actions: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)

Типовой поток:

1. Запушить изменения в GitHub.
2. Подключить репозиторий в Vercel.
3. Дождаться успешного `npm run build` в CI и на стороне Vercel.

## Примечание по шрифтам

Проект использует `next/font/google`. Во время production-сборки Next.js обращается к Google Fonts, поэтому в среде без сетевого доступа сборка может падать не из-за кода, а из-за невозможности скачать шрифты.
