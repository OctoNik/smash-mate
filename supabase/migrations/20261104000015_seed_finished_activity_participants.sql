-- Populate the historical activities with real existing test accounts.
-- The host is counted separately, so each example has five attendees total.
with examples(title, email) as (
  values
    ('Mabar Ganda Sabtu Pagi', 'arya.pratama@smashmate.test'),
    ('Mabar Ganda Sabtu Pagi', 'nabila.putri@smashmate.test'),
    ('Mabar Ganda Sabtu Pagi', 'fajar.ramadhan@smashmate.test'),
    ('Mabar Ganda Sabtu Pagi', 'kevin.halim@smashmate.test'),
    ('Coaching Footwork Dasar', 'arya.pratama@smashmate.test'),
    ('Coaching Footwork Dasar', 'sita.maharani@smashmate.test'),
    ('Coaching Footwork Dasar', 'bagas.saputra@smashmate.test'),
    ('Coaching Footwork Dasar', 'tiara.safitri@smashmate.test'),
    ('Mabar Intermediate Sore', 'arya.pratama@smashmate.test'),
    ('Mabar Intermediate Sore', 'rina.anggraini@smashmate.test'),
    ('Mabar Intermediate Sore', 'yoga.nugraha@smashmate.test'),
    ('Mabar Intermediate Sore', 'kevin.halim@smashmate.test')
)
insert into public.activity_participants (activity_id, user_id, display_name)
select a.id, u.id,
  left(coalesce(nullif(btrim(u.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1)), 60)
from examples e
join public.activities a on a.title = e.title and a.cancelled_at is null
join auth.users u on u.email = e.email
where a.host_id <> u.id
on conflict (activity_id, user_id) do nothing;
