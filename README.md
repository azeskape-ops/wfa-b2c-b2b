# Lead Generation Quiz (Анкета ВНЖ)

Multi-step lead generation form (quiz) built with Next.js, TypeScript, and Tailwind CSS.

## Run the app

From the **project root** (this folder):

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

**Important (Windows):** The `&` in the folder name `wfa-b2c&b2b` breaks npm. **Rename the folder** to `wfa-b2c-b2b` (replace `&` with `-`), then run `npm run dev` from the renamed folder.

## Project structure

- **`src/app/page.tsx`** – Multi-step quiz (8 steps, Ukrainian copy)
- **`src/app/layout.tsx`** – Root layout and metadata
- **`src/app/globals.css`** – Global styles (Tailwind)

## Quiz flow

1. Contact info (name, phone +421/+380, city, email) → Next
2. Goal (Отримання ВНЖ / Продовження ВНЖ / Консультація) – auto-advance
3. Experience (Так / Ні / Частково / Зупинився)
4. Work in Slovakia (Офіційно працюю / В пошуку / Наразі не працюю / Інше)
5. Registration address (Так, є / Ні / В процесі / Не знаю)
6. Current status/document (Тимчасовий захист, Біометрія, ВНЖ іншої країни, ВНЖ Словаччини)
7. Communication channel (WhatsApp / Viber / Telegram / Дзвінок)
8. Final CTA (Так / Обов'язково перейду) → logs `formData` to console and shows thank-you screen

Back button is available on steps 2–8.
