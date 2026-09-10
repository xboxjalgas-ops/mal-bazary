# Мал Базары

Қазақстан фермерлеріне арналған мал және мал шаруашылығы өнімдерінің онлайн-нарығы.

## Негізгі мүмкіндіктер

- Google арқылы қауіпсіз кіру (Supabase Auth)
- Мал және өнім хабарландыруларын жариялау, іздеу, сұрыптау және өшіру
- Мал және өнім хабарландыруына 8 сурет, суреттер галереясы
- Өз хабарландыруын өңдеу және «Сатылды» деп белгілеу
- Google-мен расталған әкімшіге барлық хабарландыруды басқару
- Телефон арқылы сатушымен тікелей байланысу
- Таңдаулылар, қараңғы режим және профиль аватары
- Supabase Database және Storage

## Архитектура

- `index.html` — таныстыру беті
- `market.html`, `js/app.js`, `js/auth.js`, `css/` — интерфейс және Supabase Auth клиенті
- `api/` — Vercel serverless API
- `lib/auth.js` — Supabase access token-ін сервер жағында тексеру
- `supabase-schema.sql` — жаңа Supabase жобасының схемасы
- `supabase-migration.sql` — жұмыс істеп тұрған базаға Auth бағандары мен индекстер
- `vercel.json` — қауіпсіздік HTTP header-лері

## Supabase баптауы

1. Жаңа жоба болса `supabase-schema.sql` орындаңыз.
2. Бұрыннан жұмыс істейтін база болса `supabase-migration.sql` орындаңыз. Бұл файл Google Auth бағандарын, хабарландыру суреттерін, статусын және `listing-images` Storage bucket-ын қосады.
3. Authentication → URL Configuration:
   - Site URL: `https://mal-bazary.vercel.app`
   - Redirect URL: `https://mal-bazary.vercel.app/market.html`
4. Authentication → Providers → Google ішінде Google OAuth Client ID және Secret орнатып, provider-ді қосыңыз.

## Vercel environment variables

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ADMIN_EMAILS=xboxjalgas@gmail.com
```

`SUPABASE_SERVICE_ROLE_KEY` тек серверде сақталады. Frontend-тегі `sb_publishable_...` кілт — Supabase браузерде қолдануға арнайы шығарған ашық publishable key.

## Қауіпсіздік үлгісі

Frontend Google OAuth арқылы Supabase access token алады. Әрбір профиль, жариялау, өшіру және аватар сұрауы Bearer token-мен жіберіледі. API токенді Supabase Auth арқылы тексеріп, қолданушыны `auth_user_id` бойынша анықтайды. Сатушының аты мен телефоны request body-ден алынбайды.

## Тексеру

```bash
npm test
npm run check
```
