/** Planner + API templates merged into `bg`. */
export const bgRestPlanner = {
  planner: {
    warnings: {
      poiPartial:
        "Част от станциите и хотелите не се заредиха. Липсващите спирки са ориентири по пътя.",
      osrmRouting:
        "Избягването на магистрали или тол важи при Valhalla. Този маршрут е от публичния OSRM.",
      scenicEmpty:
        "Няма забележителности по трасето за по-спокойния ход.",
      hotelRatings: "Оценки на местата за нощувка още не са налични.",
      confirmOvernight:
        "Пътуването е над 10 часа шофиране. Потвърдете нощувката преди тръгване.",
      hotelRatingsOvernight: "Оценки на нощувките още не са налични.",
    },
    border: {
      noBgBorder:
        "Няма български граничен пункт между тези две точки. Маршрутът е директният.",
      serbiaHungary:
        "Сравнени са пунктовете между Сърбия и Унгария. Чакането от Hárinfó е ориентировъчно; ако липсва, остава типичната стойност.",
      bgCompared:
        "Сравнени са българските пунктове по направлението. Чакането е оценка, не официално време.",
      viaAfter: "По пътя след това е {name}.",
      slowerThanBest:
        "С {delta} мин повече от {name}: {drive} мин път и {wait} мин {waitKind} ({waitLabel}).",
      preferred: "Предпочитан граничен пункт: {name}.",
      lowestTotal:
        "Най-малко общо време през {name}: {drive} мин път и {wait} мин {waitKind}.{penalty}",
      communityPenalty: " Сигнали по пътя добавят {minutes} мин.",
      pickedAlternate: "Избран е алтернативният път покрай {name}.",
      onRouteHuRs:
        "Маршрутът минава през {name}. Чакането е отделно от избора на български пункт.",
    },
    routeLabel: {
      via: "През {name}",
      direct: "Директен път",
      alternative: "Алтернативен път",
    },
    wait: {
      forecastArrival: "прогноза за часа на пристигане",
      dayStatsLow: "типична медиана за този час, моделирана оценка",
      dayStats: "типична медиана за този ден и час",
      currentLow: "текуща опашка, моделирана оценка",
      currentCache: "текуща опашка от кеша",
      noNakordoniObservation: "няма наблюдение от nakordoni",
      localTypical:
        "местна типична оценка, не е от nakordoni",
      unlicensedTable:
        "Типично чакане от нашата таблица. Пунктът е извън лицензираните пазари на Nakordoni.{traffic}",
      unlicensedNoData:
        "Няма данни за чакане. Пунктът е извън лицензираните пазари на Nakordoni.{traffic}",
      tomtomDelay: " TomTom отчита около {minutes} мин задръстване наблизо.",
      noData: "няма данни",
      noWaitData: "няма данни за чакане",
      hatarinfoUnder15: "Няма чакане над 15 мин за лек автомобил.",
      hatarinfoMinutes: "Около {minutes} мин за лек автомобил.",
      hatarinfoDisclaimer: " Показанието е ориентировъчно.",
      metricTypicalQueue: "типична опашка",
      metricNoData: "без данни за чакане",
      metricWait: "чакане",
      hatarinfoNoteTitle: "Hárinfó, леки коли.",
      hatarinfoFromHungary: "От Унгария: {phrase}.",
      hatarinfoToHungary: "Към Унгария: {phrase}.",
      hatarinfoPhraseUnder15: "няма чакане над 15 мин",
      hatarinfoPhraseMinutes: "{minutes} мин",
    },
    timeZone: {
      local: "местно време",
    },
    age: {
      unknown: "времето на наблюдение е неизвестно",
      under2: "наблюдение преди по-малко от 2 мин",
      minutes: "наблюдение преди {minutes} мин",
      hours: "наблюдение преди {hours} ч",
      days: "наблюдение преди {days} д",
      pinJustNow: "току-що",
      pinMinutes: "преди {minutes} мин",
      pinHours: "преди {hours} ч",
      pinDays: "преди {days} д",
    },
    stops: {
      sight: "Забележителност",
      sightReason: "По избор: гледка или забележителност близо до пътя.",
      chargeOvernight: "Зареждане и нощувка",
      overnight: "Нощувка",
      chargeRest: "Зареждане и почивка",
      fuelRest: "Гориво и почивка",
      charge: "Зареждане",
      fuel: "Гориво",
      rest: "Почивка",
      reserveLow: "Резервът свършва в този участък.",
      motorwayService: "Станцията е в крайпътно обслужване.",
      detourFuel: "Предпочетена е станция до 3 км извън магистралата.",
      restWithCharge: "Почивката съвпада със зареждането.",
      restAfterDrive: "Почивка след около 2–2.5 часа шофиране.",
      overnightWake:
        "Спите тук. Тръгване на следващия ден в {wake} ({place}). Остават {remaining} шофиране.",
      overnightGeneric: "Тук се спи. На сутринта пътят продължава.",
      lodgingNearby: "Наблизо: {name}. Оценки още няма.",
      lodgingNoMapHotel: "Няма зареден хотел от картата. Оценки още няма.",
    },
    weather: {
      hourlyEmpty: "Няма почасова прогноза за този час.",
      noForecast: "Няма прогноза за този час.",
      attribution: "Прогноза: Open-Meteo.com (CC BY 4.0)",
      warningAlongRoute: "Около {km} км по маршрута в {eta}.",
    },
    hotspots: {
      attentionTitle: "Участък за повишено внимание",
      severityHigh: "висока",
      severityMedium: "средна",
      severityLow: "ниска",
      detail:
        "{count} произшествия · тежест {severity} · {source} · {years}",
      warningOnRoute:
        "{title}: {count} по маршрута. {detail}",
      reasonOne:
        "1 участък с чести катастрофи по избрания маршрут.",
      reasonOther:
        "{count} участъка с чести катастрофи по избрания маршрут.",
      reasonEn:
        "{count} high-accident sections along the chosen route.",
      reasonTr:
        "Seçilen güzergâhta sık kaza olan {count} kesim var.",
      reasonRoOne: "1 sector cu accidente frecvente pe ruta aleasă.",
      reasonRoFew: "{count} sectoare cu accidente frecvente pe ruta aleasă.",
      reasonRoMany: "{count} de sectoare cu accidente frecvente pe ruta aleasă.",
      sourceRsMup: "МВР на Сърбия",
      sourceBgCherna: "Черна писта",
      sourceBgMvr: "МВР",
      sourceDe: "Unfallatlas",
      sourceHu: "KSH",
      sourceAt: "Statistik Austria",
      sourceCz: "Полиция на Чехия",
    },
    hazards: {
      roadworks: "Ремонт",
      closed: "Затворен път",
      danger: "Опасност",
      conditions: "Лоши условия",
      attribution:
        "Източник: Агенция „Пътна инфраструктура“ (datasheet.api.bg)",
      validUntil: "Валидно до {until}.",
      moreSignals: "Още {count} сигнала от АПИ по трасето.",
      signalOne: "сигнал",
      signalOther: "сигнала",
      reasonTitle: "Обстановка от АПИ",
      reasonDetail:
        "По българската част има {count} {signals} ({kinds}).{place}",
      reasonExample: " Пример: {place}.",
      reasonEnOne:
        "1 Bulgarian road agency alert on this route ({kinds}).{place}",
      reasonEnOther:
        "{count} Bulgarian road agency alerts on this route ({kinds}).{place}",
      reasonTrOne:
        "Bu güzergâhta 1 Bulgar yol ajansı uyarısı var ({kinds}).{place}",
      reasonTrOther:
        "Bu güzergâhta {count} Bulgar yol ajansı uyarısı var ({kinds}).{place}",
      reasonRo:
        "{count} alerte de la Agenția rutieră bulgară pe acest traseu ({kinds}).{place}",
      agencyDetailsOnly:
        "Подробностите са на български от Агенция „Пътна инфраструктура“.",
      lineUntil: "{label}: {where}{text}{until}",
    },
    proximity: {
      hotspotAhead:
        "След {meters} м: участък с чести катастрофи. Карайте внимателно.",
      hazardAhead: "След {meters} м: опасност по пътя. Карайте внимателно.",
    },
    fuel: {
      diesel: "дизел",
      petrol: "бензин",
      lpg: "газ",
      noAverage: "{country}: няма средна цена",
      averageLine: "{country}: {fuel} ср. {price} €/л",
      deltaCheaper:
        "{signed}, спестяваш ~{euros} € за {liters} л",
      deltaCostlier:
        "{signed}, плащаш ~{euros} € повече за {liters} л",
      deltaNeutral: "{signed} спрямо средното за {liters} л",
      sourceCommunity: "от потребител",
      sourceCommunityAgo: "от потребител, преди {hours} ч",
      oilBulletinLabel:
        "Европейска комисия, Weekly Oil Bulletin",
    },
    why: {
      viaBorder: "През {name}",
      fasterThanDirect: "По-кратко от директния",
      slowerThanDirect: "По-дълго от директния",
      timeDetail:
        "{minutes} мин разлика спрямо директния маршрут без принуден пункт.",
      shorterThanDirect: "По-къс от директния",
      longerThanDirect: "По-дълъг от директния",
      distanceDetail: "{km} км разлика спрямо директния маршрут.",
      incident: "Сигнал по трасето",
      avoidMotorways: "Без магистрали",
      avoidMotorwaysDetail:
        "Маршрутизацията моли Valhalla да избягва магистрали.",
      avoidTolls: "Без тол и винетки, доколкото може",
      avoidTollsDetail:
        "Valhalla получава use_tolls 0. Винетните връзки в списъка пак се показват.",
      scenic: "По-спокоен ход",
      scenicDetail:
        "Край пътя са добавени гледки и забележителности, ако ги има.",
      pet: "С любимец",
      petDetail:
        "Предпочитани са спирки с зелена площ и места, отбелязани като подходящи за любимец.",
      children: "С деца",
      childrenDetail:
        "Почивките са по-части, а ресторантите и площадките тежат повече.",
      twoDrivers: "Двама шофьори",
      twoDriversDetail: "Дневният лимит за шофиране е по-дълъг.",
      borderFaster:
        "През {chosen} пътят е с около {delta} мин по-малко общо време от {other}.",
      borderSlower:
        "През {chosen} пътят е с около {delta} мин повече общо време от {other}.",
      waitShorter:
        "По-кратко чакане на границата: около {chosen} мин вместо {other} мин.",
      waitLonger:
        "По-дълго чакане на границата: около {chosen} мин вместо {other} мин.",
      waitSame:
        "Чакане на границата: около {minutes} мин и при двата варианта.",
    },
    checklist: {
      officialInfo: "Официална информация",
      officialShop: "Официален магазин",
      idTitle: "Лична карта или паспорт",
      idDetail: "Валиден документ за самоличност за шофьора и пътниците.",
      licenceTitle: "Свидетелство за управление",
      licenceDetail:
        "Националното свидетелство е достатъчно в ЕС. Извън ЕС носете и международно, ако се изисква.",
      turkeyDocsTitle: "Турция: лична карта и зелена карта",
      turkeyDocsDetail:
        "На Капитан Андреево носете паспорт или лична карта и зелена карта (застраховка), валидна за TR.",
      insuranceAbroad: "Застраховка извън България",
      insuranceAbroadDetail:
        "Проверете дали гражданската отговорност покрива държавите по пътя. Зелена карта е нужна там, където полицата не важи.",
      mfaAdvice: "Съвети на МВнР за пътуване в чужбина",
      mfaAdviceDetail:
        "Официални консулски указания преди пътуване извън България.",
      travelAdvice: "Съвети за пътуване",
      petPassport: "Ветеринарен паспорт на любимеца",
      petPassportDetail:
        "ЕС паспорт на животното, микрочип и валидна ваксина срещу бяс. Важи за пътуване в ЕС и зависи от документите на животното, не от гражданството на водача. За Турция и други страни извън ЕС проверете условията преди тръгване.",
      petEuRules: "Условия за любимци в ЕС",
      citizenshipDocs: "Документи и винетка според водача и колата",
      citizenshipDocsDetail:
        "Паспортът и визата зависят от гражданството. Германско пребиваване не се чита от този план. Винетката следва регистрацията на автомобила.",
      childSeat: "Детско столче",
      childSeatYoung:
        "Дете на {age} г. пътува в столче или седалка според ръста. В ЕС столче е задължително под 135 см или 12 години.",
      childSeatGeneric:
        "Деца под 135 см или 12 години пътуват в столче. Проверете правилото във всяка държава по пътя.",
      winterTitle: "{rule}: зимно оборудване",
      winterInSeason: "{summary} {period}. {chains}",
      winterOffSeason: "Извън обичайния сезон ({period}). {summary}",
      winterDisclaimerTitle: "Проверете преди тръгване",
      vest: "Светлоотразителна жилетка",
      vestDetail:
        "По една за всеки пътник в много държави, включително България.",
      triangle: "Предупредителен триъгълник",
      triangleDetail: "Задължителен в багажника.",
      firstAid: "Аптечка",
      firstAidDetail:
        "Аптечка е задължителна или силно очаквана в част от държавите по този път.",
      distanceToll: "Тол на км",
      vignette: "Винетка",
      safetyClosing: "Пазете себе си и другите на пътя.",
    },
  },
  api: {
    rateLimited: "Твърде много заявки",
    invalidPlan: "Невалидна заявка за план",
    routeUnavailable: "Маршрутът не можа да бъде изчислен",
    planFailed: "Планът не можа да бъде изчислен",
  },
  vignetteFormat: {
    validityTemplate: "Срокове (проверени на {checked}): {validity}",
  },
} as const;