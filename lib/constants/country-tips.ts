/**
 * Country-specific driving tips for the Tips page filter.
 * Curated guidance, not live law: wording stays general and points to official sources.
 */

import type { Locale } from "@/lib/i18n/locale";
import type { Localized } from "@/lib/i18n/localized-field";
import { pickText } from "@/lib/i18n/localized-field";
import type { TravelTip } from "@/lib/constants/travel-tips";

export interface CountryTip {
  id: string;
  country_code: string;
  category: TravelTip["category"];
  title: Localized;
  body: Localized;
  priority: TravelTip["priority"];
}

function tip(
  country_code: string,
  slug: string,
  category: TravelTip["category"],
  priority: TravelTip["priority"],
  title: Localized,
  body: Localized
): CountryTip {
  return {
    id: `${country_code.toLowerCase()}-${slug}`,
    country_code,
    category,
    priority,
    title,
    body,
  };
}

export const COUNTRY_TIPS: CountryTip[] = [
  tip(
    "BG",
    "vignette",
    "documents",
    "high",
    {
      bg: "Електронна винетка преди магистрала",
      en: "Buy the e-vignette before the motorway",
      tr: "Otoyoldan önce e-vinyet alın",
      ro: "Cumpărați rovinieta electronică înainte de autostradă",
    },
    {
      bg: "Винетката се купува само от официалния сайт или от места на държавата. Проверката е по номера, затова ползвайте точния номер и държава.",
      en: "Buy only from the official site or state outlets. Checks go by licence plate, so enter the exact plate and country.",
      tr: "Yalnızca resmî siteden veya devlet satış noktalarından alın. Kontrol plakaya göre yapılır; plakayı ve ülkeyi doğru girin.",
      ro: "Cumpărați doar de pe site-ul oficial sau de la puncte autorizate. Controlul se face după număr, deci introduceți exact numărul și țara.",
    },
  ),
  tip(
    "BG",
    "lights",
    "safety",
    "medium",
    {
      bg: "Къси светлини и внимание в градове",
      en: "Dipped headlights and care in towns",
      tr: "Kısa farlar ve şehirlerde dikkat",
      ro: "Faza scurtă și atenție în localități",
    },
    {
      bg: "Карайте с къси светлини през цялата година. В градовете ограничението обикновено е 50 км/ч, извън тях 90, а на магистрала до 140 – следете знаците.",
      en: "Drive with dipped headlights all year. Limits are usually 50 km/h in towns, 90 outside and up to 140 on motorways; follow the signs.",
      tr: "Yıl boyunca kısa farlarla sürün. Sınırlar genelde şehirde 50, şehir dışında 90, otoyolda 140 km/s'e kadardır; levhalara uyun.",
      ro: "Conduceți cu faza scurtă tot anul. Limitele sunt de obicei 50 km/h în localități, 90 în afara lor și până la 140 pe autostradă; urmați indicatoarele.",
    },
  ),
  tip(
    "RO",
    "rovinieta",
    "documents",
    "high",
    {
      bg: "Rovinieta е задължителна",
      en: "The rovinieta is compulsory",
      tr: "Rovinieta zorunludur",
      ro: "Rovinieta este obligatorie",
    },
    {
      bg: "За пътуване по националните пътища е нужна румънска винетка (rovinieta), купена от официалния сайт. Глобите при липса са високи.",
      en: "The Romanian rovinieta is needed on national roads and must be bought on the official site. Fines without it are high.",
      tr: "Ulusal yollarda Romanya rovinietası gerekir ve resmî siteden alınmalıdır. Olmadığında cezalar yüksektir.",
      ro: "Rovinieta românească este necesară pe drumurile naționale și se cumpără de pe site-ul oficial. Amenzile în lipsa ei sunt mari.",
    },
  ),
  tip(
    "RO",
    "roads",
    "safety",
    "high",
    {
      bg: "Лоши и тесни пътища, нулева толерантност към алкохол",
      en: "Poor, narrow roads and zero alcohol tolerance",
      tr: "Bozuk, dar yollar ve sıfır alkol toleransı",
      ro: "Drumuri slabe și înguste, toleranță zero la alcool",
    },
    {
      bg: "Извън магистралите има дупки, камиони и бавно движение; изпреварвайте само с видимост. Нощем карайте по-бавно. Алкохолът е 0,0.",
      en: "Off the motorways expect potholes, trucks and slow traffic; overtake only with clear view, and slow down at night. The alcohol limit is 0.0.",
      tr: "Otoyol dışında çukur, kamyon ve yavaş trafik beklenir; yalnızca görüş açıkken geçin, geceleri yavaşlayın. Alkol sınırı 0,0'dır.",
      ro: "În afara autostrăzilor întâlniți gropi, camioane și trafic lent; depășiți doar cu vizibilitate bună și mergeți mai încet noaptea. Limita de alcool este 0,0.",
    },
  ),
  tip(
    "RS",
    "lights-winter",
    "safety",
    "medium",
    {
      bg: "Светлини денем и зимно оборудване",
      en: "Lights by day and winter equipment",
      tr: "Gündüz farları ve kış donanımı",
      ro: "Faruri ziua și echipament de iarnă",
    },
    {
      bg: "В Сърбия светлините са включени целодневно. През зимата са нужни зимни гуми; носете и вериги за планинските участъци.",
      en: "In Serbia keep headlights on all day. In winter use winter tyres, and carry chains for mountain stretches.",
      tr: "Sırbistan'da farlar gün boyu açık olmalıdır. Kışın kış lastiği kullanın; dağlık kesimler için zincir bulundurun.",
      ro: "În Serbia farurile se țin aprinse toată ziua. Iarna folosiți anvelope de iarnă și purtați lanțuri pentru zonele montane.",
    },
  ),
  tip(
    "RS",
    "tolls",
    "documents",
    "medium",
    {
      bg: "Пътни такси на магистрала",
      en: "Motorway tolls",
      tr: "Otoyol ücretleri",
      ro: "Taxe de autostradă",
    },
    {
      bg: "Магистралите се плащат на пунктове по участък. Носете евро и карта; опашките при граничния пункт Хоргош са по-дълги в пиковите часове.",
      en: "Motorways are paid per section at toll gates. Carry euros and a card; queues at the Horgoš border are longer at peak hours.",
      tr: "Otoyollar kesim başına gişelerde ödenir. Euro ve kart bulundurun; Horgoš sınırındaki kuyruklar yoğun saatlerde uzar.",
      ro: "Autostrăzile se plătesc pe sector la barierele de taxare. Aveți euro și card; cozile la frontiera Horgoš sunt mai lungi în orele de vârf.",
    },
  ),
  tip(
    "HU",
    "ematrica",
    "documents",
    "high",
    {
      bg: "e-matrica за магистрали",
      en: "e-matrica for motorways",
      tr: "Otoyollar için e-matrica",
      ro: "e-matrica pentru autostrăzi",
    },
    {
      bg: "Унгарската електронна винетка е нужна за магистралите и се купува онлайн или на бензиностанции. Алкохолът е 0,0.",
      en: "The Hungarian e-vignette is required on motorways and is sold online or at fuel stations. The alcohol limit is 0.0.",
      tr: "Macar e-vinyeti otoyollarda zorunludur; internetten veya akaryakıt istasyonlarından alınır. Alkol sınırı 0,0'dır.",
      ro: "Rovinieta electronică maghiară este necesară pe autostrăzi și se cumpără online sau la benzinării. Limita de alcool este 0,0.",
    },
  ),
  tip(
    "TR",
    "hgs",
    "documents",
    "high",
    {
      bg: "HGS за магистрали и мостове",
      en: "HGS for motorways and bridges",
      tr: "Otoyol ve köprüler için HGS",
      ro: "HGS pentru autostrăzi și poduri",
    },
    {
      bg: "Магистралите и мостовете в Турция нямат ръчни пунктове. Нужна е HGS етикета или регистриран номер, иначе глобите се трупат.",
      en: "Turkish motorways and bridges have no cash lanes. You need an HGS tag or a registered plate, otherwise fines build up.",
      tr: "Türkiye otoyol ve köprülerinde nakit geçiş yoktur. HGS etiketi veya kayıtlı plaka gerekir; aksi halde cezalar birikir.",
      ro: "Autostrăzile și podurile din Turcia nu au bariere cu plată în numerar. Aveți nevoie de etichetă HGS sau număr înregistrat, altfel amenzile se adună.",
    },
  ),
  tip(
    "TR",
    "border-docs",
    "borders",
    "medium",
    {
      bg: "Документи за колата на границата",
      en: "Car papers at the border",
      tr: "Sınırda araç belgeleri",
      ro: "Actele mașinii la frontieră",
    },
    {
      bg: "Носете свидетелство за регистрация, застраховка и, ако колата не е ваша, нотариално пълномощно. Влизането се отбелязва на колата, не я оставяйте в страната.",
      en: "Carry the registration, insurance and, if the car is not yours, a notarised authorisation. The car's entry is recorded; do not leave it in the country.",
      tr: "Ruhsat, sigorta ve araç size ait değilse noter onaylı yetki belgesi bulundurun. Araç girişi kaydedilir; aracı ülkede bırakmayın.",
      ro: "Aveți talonul, asigurarea și, dacă mașina nu este a dvs., o împuternicire notarială. Intrarea mașinii se înregistrează; nu o lăsați în țară.",
    },
  ),
  tip(
    "GR",
    "tolls",
    "documents",
    "medium",
    {
      bg: "Пътни такси в Гърция",
      en: "Tolls in Greece",
      tr: "Yunanistan'da otoyol ücretleri",
      ro: "Taxe în Grecia",
    },
    {
      bg: "Основните магистрали са платени на пунктове; носете евро в брой. Алкохолът е до 0,05 %, а ремъците са задължителни за всички.",
      en: "Main motorways are tolled at gates; carry euros in cash. The alcohol limit is 0.05 % and seat belts are compulsory for all.",
      tr: "Ana otoyollar gişelerde ücretlidir; nakit euro bulundurun. Alkol sınırı %0,05'tir ve herkes için emniyet kemeri zorunludur.",
      ro: "Autostrăzile principale sunt cu taxă la bariere; aveți euro în numerar. Limita de alcool este 0,05 %, iar centura este obligatorie pentru toți.",
    },
  ),
  tip(
    "AT",
    "vignette",
    "documents",
    "high",
    {
      bg: "Винетка и тунелни такси",
      en: "Vignette and tunnel tolls",
      tr: "Vinyet ve tünel ücretleri",
      ro: "Rovinietă și taxe de tunel",
    },
    {
      bg: "В Австрия е нужна винетка (цифровата е свързана с номера). Някои тунели и планински участъци се плащат отделно.",
      en: "Austria needs a vignette (the digital one is tied to your plate). Some tunnels and mountain sections are paid separately.",
      tr: "Avusturya'da vinyet gerekir (dijital olan plakaya bağlıdır). Bazı tüneller ve dağ kesimleri ayrıca ücretlidir.",
      ro: "Austria cere rovinietă (cea digitală este legată de număr). Unele tuneluri și sectoare montane se plătesc separat.",
    },
  ),
  tip(
    "AT",
    "winter",
    "weather",
    "medium",
    {
      bg: "Зимни гуми от 1 ноември",
      en: "Winter tyres from 1 November",
      tr: "1 Kasım'dan itibaren kış lastiği",
      ro: "Anvelope de iarnă din 1 noiembrie",
    },
    {
      bg: "От 1 ноември до 15 април при зимни условия са нужни зимни гуми. В планината проверете и за вериги.",
      en: "From 1 November to 15 April winter tyres are required in winter conditions. In the mountains check about chains too.",
      tr: "1 Kasım–15 Nisan arasında kış koşullarında kış lastiği zorunludur. Dağlarda zincir gereksinimini de kontrol edin.",
      ro: "Între 1 noiembrie și 15 aprilie sunt necesare anvelope de iarnă în condiții de iarnă. La munte verificați și lanțurile.",
    },
  ),
  tip(
    "DE",
    "autobahn",
    "safety",
    "high",
    {
      bg: "Автобан: препоръчителна скорост и спасителен коридор",
      en: "Autobahn: advisory speed and rescue lane",
      tr: "Autobahn: tavsiye hız ve kurtarma şeridi",
      ro: "Autobahn: viteză recomandată și culoar de salvare",
    },
    {
      bg: "Често няма общо ограничение, но препоръчителната скорост е 130. При задръстване оставете коридор между лентите за спешните коли.",
      en: "There is often no general limit, but 130 km/h is advised. In a jam leave a rescue lane between the lanes for emergency vehicles.",
      tr: "Genellikle genel limit yoktur ama 130 km/s önerilir. Trafik sıkışınca acil araçlar için şeritler arasında yol açın.",
      ro: "Adesea nu există limită generală, dar se recomandă 130 km/h. În caz de ambuteiaj lăsați un culoar între benzi pentru vehiculele de urgență.",
    },
  ),
  tip(
    "DE",
    "low-emission",
    "documents",
    "medium",
    {
      bg: "Зелени зони в градовете",
      en: "Low-emission zones in cities",
      tr: "Şehirlerde düşük emisyon bölgeleri",
      ro: "Zone cu emisii reduse în orașe",
    },
    {
      bg: "Много градове изискват зелена стикер за екологична зона. Купува се преди влизане; без нея се глобява всяко влизане.",
      en: "Many cities require a green environmental sticker. Buy it before you enter; driving in without it is fined each time.",
      tr: "Birçok şehir yeşil çevre etiketi ister. Girmeden önce alın; etiketsiz her giriş cezalıdır.",
      ro: "Multe orașe cer autocolantul verde de mediu. Cumpărați-l înainte de intrare; fără el amenda se aplică la fiecare intrare.",
    },
  ),
  tip(
    "PL",
    "tolls",
    "documents",
    "medium",
    {
      bg: "Платени магистрали А2 и А4",
      en: "Tolled motorways A2 and A4",
      tr: "Ücretli otoyollar A2 ve A4",
      ro: "Autostrăzi cu taxă A2 și A4",
    },
    {
      bg: "Някои участъци на А2 и А4 са платени на пунктове и се плащат с карта. Фаровете са включени денонощно.",
      en: "Some sections of the A2 and A4 are tolled at gates and can be paid by card. Headlights stay on day and night.",
      tr: "A2 ve A4'ün bazı kesimleri gişelerde ücretlidir ve kartla ödenebilir. Farlar gece gündüz açık kalır.",
      ro: "Unele sectoare ale A2 și A4 sunt cu taxă la bariere și se pot plăti cu cardul. Farurile rămân aprinse zi și noapte.",
    },
  ),
  tip(
    "CZ",
    "vignette",
    "documents",
    "high",
    {
      bg: "Електронна винетка в Чехия",
      en: "Czech e-vignette",
      tr: "Çek e-vinyeti",
      ro: "Rovinieta electronică cehă",
    },
    {
      bg: "Нужна е електронна винетка за магистралите; купува се от официалния сайт. Алкохолът е 0,0, скоростта на магистрала до 130.",
      en: "An e-vignette is required on motorways, bought on the official site. The alcohol limit is 0.0 and the motorway limit 130.",
      tr: "Otoyollarda e-vinyet zorunludur; resmî siteden alınır. Alkol sınırı 0,0, otoyol hız sınırı 130'dur.",
      ro: "Este necesară rovinieta electronică pe autostrăzi, de pe site-ul oficial. Limita de alcool este 0,0, iar viteza pe autostradă 130.",
    },
  ),
  tip(
    "SK",
    "vignette",
    "documents",
    "high",
    {
      bg: "Електронна винетка в Словакия",
      en: "Slovak e-vignette",
      tr: "Slovak e-vinyeti",
      ro: "Rovinieta electronică slovacă",
    },
    {
      bg: "Нужна е електронна винетка за магистрали и експресни пътища. Купете я от официалния сайт преди влизане.",
      en: "An e-vignette is required on motorways and expressways. Buy it on the official site before entering.",
      tr: "Otoyol ve ekspres yollarda e-vinyet zorunludur. Girmeden önce resmî siteden alın.",
      ro: "Este necesară rovinieta electronică pe autostrăzi și drumuri expres. Cumpărați-o de pe site-ul oficial înainte de intrare.",
    },
  ),
  tip(
    "HR",
    "tolls",
    "documents",
    "medium",
    {
      bg: "Такси по километри и зимно оборудване",
      en: "Distance tolls and winter equipment",
      tr: "Mesafeye göre ücret ve kış donanımı",
      ro: "Taxe pe distanță și echipament de iarnă",
    },
    {
      bg: "Магистралите са платени според изминатото разстояние, с карта или в брой. През зимата са нужни зимни гуми или вериги.",
      en: "Motorways are tolled by distance, payable by card or cash. In winter carry winter tyres or chains.",
      tr: "Otoyollar mesafeye göre ücretlidir; kart veya nakitle ödenir. Kışın kış lastiği veya zincir bulundurun.",
      ro: "Autostrăzile se taxează pe distanță, cu cardul sau numerar. Iarna aveți anvelope de iarnă sau lanțuri.",
    },
  ),
  tip(
    "SI",
    "vignette",
    "documents",
    "high",
    {
      bg: "е-винетка в Словения",
      en: "Slovenian e-vignette",
      tr: "Slovenya e-vinyeti",
      ro: "Rovinieta electronică slovenă",
    },
    {
      bg: "Нужна е електронна винетка за магистралите; купува се онлайн или на граничните бензиностанции.",
      en: "An e-vignette is required on motorways, sold online or at fuel stations near the border.",
      tr: "Otoyollarda e-vinyet zorunludur; internetten veya sınır yakınındaki akaryakıt istasyonlarından alınır.",
      ro: "Este necesară rovinieta electronică pe autostrăzi, online sau la benzinăriile de la graniță.",
    },
  ),
  tip(
    "IT",
    "ztl",
    "safety",
    "high",
    {
      bg: "ЗТЛ зони в градовете",
      en: "ZTL zones in city centres",
      tr: "Şehir merkezlerinde ZTL bölgeleri",
      ro: "Zone ZTL în centrele orașelor",
    },
    {
      bg: "Центровете на много градове са с ограничен достъп (ZTL) и камери. Влизане без разрешение се глобява по пощата – паркирайте извън центъра.",
      en: "Many city centres are restricted (ZTL) and camera-enforced. Entry without a permit is fined by post; park outside the centre.",
      tr: "Birçok şehir merkezi kısıtlıdır (ZTL) ve kameralıdır. İzinsiz giriş postayla cezalandırılır; merkez dışına park edin.",
      ro: "Multe centre de oraș sunt restricționate (ZTL) și supravegheate cu camere. Intrarea fără permis se amendează prin poștă; parcați în afara centrului.",
    },
  ),
];

export function countryTipTitle(locale: Locale, tip: CountryTip): string {
  return pickText(locale, tip.title);
}

export function countryTipBody(locale: Locale, tip: CountryTip): string {
  return pickText(locale, tip.body);
}

/** Country codes that have curated tips, in display order (the order of first mention). */
export function countriesWithTips(): string[] {
  const seen: string[] = [];
  for (const row of COUNTRY_TIPS) {
    if (!seen.includes(row.country_code)) seen.push(row.country_code);
  }
  return seen;
}

export function tipsForCountry(code: string): CountryTip[] {
  return COUNTRY_TIPS.filter((row) => row.country_code === code);
}
