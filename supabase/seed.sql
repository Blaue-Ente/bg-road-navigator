-- Seed initial data for BG Road Navigator
-- Countries table for emergency numbers
create table if not exists public.countries (
  code text primary key,
  name text not null,
  name_bg text not null,
  flag text not null,
  police text,
  ambulance text,
  fire text,
  roadside_assistance text,
  eu_emergency text default '112'
);

-- Insert country emergency data
insert into public.countries (code, name, name_bg, flag, police, ambulance, fire, roadside_assistance, eu_emergency) values
  ('BG', 'Bulgaria', 'България', '🇧🇬', '166', '166', '167', '1661', '112'),
  ('GR', 'Greece', 'Гърция', '🇬🇷', '100', '166', '199', '179', '112'),
  ('TR', 'Turkey', 'Турция', '🇹🇷', '155', '112', '112', '112', '112'),
  ('RS', 'Serbia', 'Сърбия', '🇷🇸', '112', '112', '112', '112', '112'),
  ('MK', 'North Macedonia', 'Северна Македония', '🇲🇰', '112', '112', '112', '112', '112'),
  ('RO', 'Romania', 'Румъния', '🇷🇴', '112', '112', '112', '112', '112'),
  ('HU', 'Hungary', 'Унгария', '🇭🇺', '112', '112', '112', '112', '112'),
  ('AT', 'Austria', 'Австрия', '🇦🇹', '112', '112', '112', '112', '112'),
  ('DE', 'Germany', 'Германия', '🇩🇪', '112', '112', '112', '112', '112'),
  ('IT', 'Italy', 'Италия', '🇮🇹', '112', '112', '112', '112', '112'),
  ('FR', 'France', 'Франция', '🇫🇷', '112', '112', '112', '112', '112'),
  ('ES', 'Spain', 'Испания', '🇪🇸', '112', '112', '112', '112', '112'),
  ('PT', 'Portugal', 'Португалия', '🇵🇹', '112', '112', '112', '112', '112'),
  ('SI', 'Slovenia', 'Словения', '🇸🇮', '112', '112', '112', '112', '112'),
  ('HR', 'Croatia', 'Хърватия', '🇭🇷', '112', '112', '112', '112', '112'),
  ('BA', 'Bosnia and Herzegovina', 'Босния и Хървогориия', '🇧🇦', '112', '112', '112', '112', '112'),
  ('ME', 'Montenegro', 'Черна гора', '�🇲🇪', '112', '112', '112', '112', '112'),
  ('AL', 'Albania', 'Албания', '�🇦🇱', '112', '112', '112', '112', '112'),
  ('CH', 'Switzerland', 'Швейцария', '🇨🇭', '112', '112', '112', '112', '112'),
  ('NL', 'Netherlands', 'Нидерландия', '🇳🇱', '112', '112', '112', '112', '112'),
  ('BE', 'Belgium', 'Белгия', '🇧🇪', '112', '112', '112', '112', '112'),
  ('LU', 'Luxembourg', 'Люксембург', '🇱🇺', '112', '112', '112', '112', '112'),
  ('CZ', 'Czech Republic', 'Чехия', '🇨🇿', '112', '112', '112', '112', '112'),
  ('SK', 'Slovakia', 'Словакия', '🇸🇰', '112', '112', '112', '112', '112'),
  ('PL', 'Poland', 'Полша', '🇵🇱', '112', '112', '112', '112', '112'),
  ('UA', 'Ukraine', 'Украйна', '🇺🇦', '112', '112', '112', '112', '112'),
  ('MD', 'Moldova', 'Молдова', '🇲🇩', '112', '112', '112', '112', '112')
on conflict (code) do nothing;

-- Border crossings table
create table if not exists public.border_crossings (
  id text primary key,
  name_bg text not null,
  name_en text not null,
  country_pair text not null,
  coords jsonb not null,
  working_hours text,
  notes text
);

insert into public.border_crossings (id, name_bg, name_en, country_pair, coords, working_hours, notes) values
  ('kalotina', 'Калотина', 'Kalotina', 'BG-RS', '{"lng": 22.8969, "lat": 42.9833}', '00:00 - 24:00', 'Най-голямата граница със Сърбия'),
  ('kulata', 'Кулата', 'Kulata', 'BG-GR', '{"lng": 23.7781, "lat": 41.3972}', '00:00 - 24:00', 'Основна граница с Гърция'),
  ('kapitan-andreevo', 'Капитан Андреево', 'Kapitan Andreevo', 'BG-TR', '{"lng": 26.3056, "lat": 41.8833}', '00:00 - 24:00', 'Най-натоварена граница с Турция'),
  ('danube-bridge-vidin', 'Дунав мост Видин', 'Danube Bridge Vidin', 'BG-RO', '{"lng": 22.8806, "lat": 43.9928}', '00:00 - 24:00', 'Мост над Дунав'),
  ('danube-bridge-ruse', 'Дунав мост Русе', 'Danube Bridge Ruse', 'BG-RO', '{"lng": 25.9714, "lat": 43.8992}', '00:00 - 24:00', 'Втори мост над Дунав'),
  ('gyueshevo', 'Гюешево', 'Gyueshevo', 'BG-MK', '{"lng": 22.5167, "lat": 42.2167}', '00:00 - 24:00', 'Планинска граница'),
  ('zlatarevo', 'Златарево', 'Zlatarevo', 'BG-MK', '{"lng": 23.0667, "lat": 41.4667}', '00:00 - 24:00', 'Алтернатива на Кулата'),
  ('ilinden', 'Илинден', 'Ilinden', 'BG-MK', '{"lng": 23.3386, "lat": 41.5167}', '00:00 - 24:00', 'Най-новата граница'),
  ('promachon', 'Промахон', 'Promachon', 'BG-GR', '{"lng": 23.3639, "lat": 41.5167}', '00:00 - 24:00', 'Алтернатива на Кулата'),
  ('makaza', 'Маказа', 'Makaza', 'BG-GR', '{"lng": 25.3833, "lat": 41.0833}', '00:00 - 24:00', 'Станция в Източните Родопи'),
  ('malko-tarnovo', 'Малко Търново', 'Malko Tarnovo', 'BG-TR', '{"lng": 27.5167, "lat": 42.0333}', '00:00 - 24:00', 'Граница в Странджа'),
  ('lesovo', 'Лесово', 'Lesovo', 'BG-TR', '{"lng": 26.9333, "lat": 42.1167}', '00:00 - 24:00', 'Алтернатива на Капитан Андреево')
on conflict (id) do nothing;