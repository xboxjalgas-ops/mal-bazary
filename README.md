# Мал Базары

Қазақстан фермерлеріне арналған мал және мал шаруашылығы өнімдерінің онлайн-нарығы.

## Мүмкіндіктер

- Мал және өнім хабарландыруларын қарау, іздеу, сүзу және сұрыптау
- Telegram арқылы телефонды растау
- Қол қойылған 30 күндік сессия
- Тек расталған иесінің хабарландыру қосуы және өшіруі
- Таңдаулылар, қараңғы режим және профиль аватары
- Supabase дерекқоры мен Storage

## Архитектура

- `index.html` — таныстыру беті
- `market.html`, `js/app.js`, `css/` — нарық интерфейсі
- `api/` — Vercel serverless API
- `lib/auth.js` — телефонды қалыптандыру және HMAC сессиясын тексеру
- `supabase-schema.sql` — жаңа Supabase жобасының схемасы
- `supabase-migration.sql` — бар базаға қауіпсіз индекстер
- `vercel.json` — қауіпсіздік HTTP header-лері

## Міндетті environment variables

Vercel → Project → Settings → Environment Variables:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN
OTP_SECRET
TELEGRAM_WEBHOOK_SECRET
```

`OTP_SECRET` кемінде 32 таңбалық кездейсоқ құпия болуы керек. `TELEGRAM_WEBHOOK_SECRET` үшін тек `A-Z`, `a-z`, `0-9`, `_`, `-` таңбаларын қолданыңыз. Құпия мәндерді GitHub-қа жүктемеңіз.

## Supabase

Жаңа жоба үшін `supabase-schema.sql` файлын SQL Editor-де бір рет орындаңыз. Бұрыннан жұмыс істеп тұрған база үшін `supabase-migration.sql` файлын орындаңыз; ол деректерді өзгертпей, қажет индекстерді қосады.

## Telegram webhook

Deploy аяқталғаннан кейін webhook-ті secret token-мен орнатыңыз:

```text
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://mal-bazary.vercel.app/api/telegram-webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

Webhook secret орнатылмайынша сервер Telegram update-терін қабылдамайды.

## Жергілікті тексеру

```bash
npm test
npm run check
```

## Қауіпсіздік үлгісі

Telegram коды расталғанда ғана сервер сессия токенін береді. Жариялау, өшіру, профильді оқу/өзгерту және аватар жүктеу сұраулары `Authorization: Bearer <token>` арқылы тексеріледі. Сервер сатушының аты мен телефонын request body-ден алмайды — олар расталған сессия мен `users` кестесінен алынады.

Service-role кілті тек серверде қолданылады. Клиенттен Supabase-ке жазу RLS арқылы жабық.
