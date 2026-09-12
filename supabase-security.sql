-- Мал Базары: database write hardening.
-- Қолданба барлық өзгерісті тек service-role қолданатын қорғалған API арқылы жасайды.
-- Бұл скриптті Supabase SQL Editor-де бір рет орындаңыз.

revoke insert, update, delete on table users from anon, authenticated;
revoke insert, update, delete on table listings from anon, authenticated;
revoke insert, update, delete on table products from anon, authenticated;
revoke insert, update, delete on table support_tickets from anon, authenticated;
revoke insert, update, delete on table conversations from anon, authenticated;
revoke insert, update, delete on table messages from anon, authenticated;
revoke insert, update, delete on table offers from anon, authenticated;
revoke insert, update, delete on table reservations from anon, authenticated;
revoke insert, update, delete on table reviews from anon, authenticated;
revoke all on table favorites from anon, authenticated;

-- Қоғамдық каталог пен пікірлерді оқу сақталады.
grant select on table listings, products, reviews to anon, authenticated;

-- Қауіпті немесе ұрланған сессияның ұзақ өмір сүруін азайтуға көмектесетін индекстер.
create index if not exists users_blocked_auth_idx on users(auth_user_id) where blocked is true;
create index if not exists messages_unread_idx on messages(conversation_id, created_at desc) where read_at is null;