// Словарь: русские названия и транслитерации → официальное английское имя
const heroAliases: Record<string, string> = {
  // A
  "anti-mage": "Anti-Mage", "антимаг": "Anti-Mage", "ам": "Anti-Mage", "am": "Anti-Mage",
  "axe": "Axe", "акс": "Axe", "акса": "Axe",
  "ancient apparition": "Ancient Apparition", "аа": "Ancient Apparition", "aa": "Ancient Apparition", "древний призрак": "Ancient Apparition",
  "abaddon": "Abaddon", "абаддон": "Abaddon",
  "alchemist": "Alchemist", "алхимик": "Alchemist", "алх": "Alchemist",
  "arc warden": "Arc Warden", "арк варден": "Arc Warden", "арк": "Arc Warden",

  // B
  "bane": "Bane", "бейн": "Bane",
  "batrider": "Batrider", "батрайдер": "Batrider", "бат": "Batrider",
  "beastmaster": "Beastmaster", "бистмастер": "Beastmaster", "бм": "Beastmaster",
  "bloodseeker": "Bloodseeker", "кровосос": "Bloodseeker", "бладсикер": "Bloodseeker", "бс": "Bloodseeker",
  "bounty hunter": "Bounty Hunter", "баунти": "Bounty Hunter", "гонщик": "Bounty Hunter",
  "brewmaster": "Brewmaster", "бруmaster": "Brewmaster", "панда": "Brewmaster",
  "bristleback": "Bristleback", "бристлбэк": "Bristleback", "кабан": "Bristleback",
  "broodmother": "Broodmother", "паук": "Broodmother", "бруд": "Broodmother",

  // C
  "centaur warrunner": "Centaur Warrunner", "кентавр": "Centaur Warrunner", "центавр": "Centaur Warrunner",
  "chaos knight": "Chaos Knight", "хаос найт": "Chaos Knight", "хк": "Chaos Knight", "ck": "Chaos Knight",
  "chen": "Chen", "чен": "Chen",
  "clinkz": "Clinkz", "клинкз": "Clinkz",
  "clockwerk": "Clockwerk", "клокверк": "Clockwerk", "клок": "Clockwerk",
  "crystal maiden": "Crystal Maiden", "кристальная дева": "Crystal Maiden", "км": "Crystal Maiden", "цм": "Crystal Maiden", "кристалка": "Crystal Maiden", "cm": "Crystal Maiden",

  // D
  "dark seer": "Dark Seer", "дарк сир": "Dark Seer", "дс": "Dark Seer",
  "dark willow": "Dark Willow", "дарк вилоу": "Dark Willow", "ива": "Dark Willow",
  "dawnbreaker": "Dawnbreaker", "рассветник": "Dawnbreaker", "дон": "Dawnbreaker",
  "dazzle": "Dazzle", "дазл": "Dazzle",
  "death prophet": "Death Prophet", "смерти пророк": "Death Prophet", "дп": "Death Prophet", "dp": "Death Prophet",
  "disruptor": "Disruptor", "дисраптор": "Disruptor",
  "doom": "Doom", "дум": "Doom",
  "dragon knight": "Dragon Knight", "дракон найт": "Dragon Knight", "дк": "Dragon Knight", "dk": "Dragon Knight",
  "drow ranger": "Drow Ranger", "дроу": "Drow Ranger", "дроу рейнджер": "Drow Ranger",

  // E
  "earth spirit": "Earth Spirit", "земляной дух": "Earth Spirit", "зем": "Earth Spirit",
  "earthshaker": "Earthshaker", "землетряс": "Earthshaker", "эс": "Earthshaker", "es": "Earthshaker",
  "elder titan": "Elder Titan", "элдер титан": "Elder Titan", "эт": "Elder Titan",
  "ember spirit": "Ember Spirit", "эмбер": "Ember Spirit", "огонь": "Ember Spirit",
  "enchantress": "Enchantress", "энчантресс": "Enchantress", "энч": "Enchantress",
  "enigma": "Enigma", "энигма": "Enigma",

  // F
  "faceless void": "Faceless Void", "войд": "Faceless Void", "войды": "Faceless Void", "фв": "Faceless Void",

  // G
  "grimstroke": "Grimstroke", "гримстрок": "Grimstroke", "грим": "Grimstroke",
  "gyrocopter": "Gyrocopter", "гиро": "Gyrocopter", "гайро": "Gyrocopter",

  // H
  "hoodwink": "Hoodwink", "белка": "Hoodwink",
  "huskar": "Huskar", "хускар": "Huskar",

  // I
  "invoker": "Invoker", "инвокер": "Invoker", "инвок": "Invoker",
  "io": "Io", "ио": "Io", "шарик": "Io",

  // J
  "jakiro": "Jakiro", "якиро": "Jakiro", "двойной дракон": "Jakiro",
  "juggernaut": "Juggernaut", "жага": "Juggernaut", "джаг": "Juggernaut", "jug": "Juggernaut", "жагернаут": "Juggernaut",

  // K
  "keeper of the light": "Keeper of the Light", "котл": "Keeper of the Light", "kotl": "Keeper of the Light", "хранитель света": "Keeper of the Light",
  "kez": "Kez", "кез": "Kez",
  "kunkka": "Kunkka", "кунка": "Kunkka", "адмирал": "Kunkka",

  // L
  "legion commander": "Legion Commander", "легион": "Legion Commander", "лс": "Legion Commander", "lc": "Legion Commander",
  "leshrac": "Leshrac", "лешрак": "Leshrac", "леш": "Leshrac",
  "lich": "Lich", "лич": "Lich",
  "lifestealer": "Lifestealer", "лайфстилер": "Lifestealer", "наикс": "Lifestealer",
  "lina": "Lina", "лина": "Lina",
  "lion": "Lion", "лион": "Lion",
  "lone druid": "Lone Druid", "друид": "Lone Druid", "лд": "Lone Druid",
  "luna": "Luna", "луна": "Luna",
  "lycan": "Lycan", "ликан": "Lycan", "лайкан": "Lycan",

  // M
  "magnus": "Magnus", "магнус": "Magnus", "маг": "Magnus",
  "marci": "Marci", "марси": "Marci",
  "mars": "Mars", "марс": "Mars",
  "medusa": "Medusa", "медуза": "Medusa",
  "meepo": "Meepo", "мипо": "Meepo", "мипы": "Meepo",
  "mirana": "Mirana", "мирана": "Mirana", "пум": "Mirana",
  "monkey king": "Monkey King", "мк": "Monkey King", "mk": "Monkey King", "обезьяна": "Monkey King", "монки": "Monkey King",
  "morphling": "Morphling", "морф": "Morphling",
  "muerta": "Muerta", "муэрта": "Muerta",

  // N
  "naga siren": "Naga Siren", "нага": "Naga Siren",
  "nature's prophet": "Nature's Prophet", "пророк": "Nature's Prophet", "нп": "Nature's Prophet", "np": "Nature's Prophet", "натура": "Nature's Prophet",
  "necrophos": "Necrophos", "некро": "Necrophos", "necro": "Necrophos",
  "night stalker": "Night Stalker", "ночной": "Night Stalker", "нс": "Night Stalker",
  "nyx assassin": "Nyx Assassin", "никс": "Nyx Assassin", "жук": "Nyx Assassin",

  // O
  "ogre magi": "Ogre Magi", "огр": "Ogre Magi",
  "omniknight": "Omniknight", "омни": "Omniknight",
  "oracle": "Oracle", "оракл": "Oracle",
  "outworld devourer": "Outworld Devourer", "оwd": "Outworld Devourer", "овд": "Outworld Devourer", "аутворлд": "Outworld Devourer",

  // P
  "pangolier": "Pangolier", "панголин": "Pangolier", "панго": "Pangolier",
  "phantom assassin": "Phantom Assassin", "па": "Phantom Assassin", "fa": "Phantom Assassin", "призрак": "Phantom Assassin",
  "phantom lancer": "Phantom Lancer", "пл": "Phantom Lancer", "pl": "Phantom Lancer", "фантом": "Phantom Lancer",
  "phoenix": "Phoenix", "феникс": "Phoenix",
  "primal beast": "Primal Beast", "зверь": "Primal Beast", "примал": "Primal Beast",
  "puck": "Puck", "пак": "Puck",
  "pudge": "Pudge", "пудж": "Pudge",
  "pugna": "Pugna", "пугна": "Pugna",

  // Q
  "queen of pain": "Queen of Pain", "куп": "Queen of Pain", "qop": "Queen of Pain", "королева боли": "Queen of Pain",

  // R
  "razor": "Razor", "рейзор": "Razor",
  "riki": "Riki", "рики": "Riki",
  "ring master": "Ring Master", "рингмастер": "Ring Master",
  "rubick": "Rubick", "рубик": "Rubick",

  // S
  "sand king": "Sand King", "ск": "Sand King", "sk": "Sand King", "песочник": "Sand King",
  "shadow demon": "Shadow Demon", "шд": "Shadow Demon", "sd": "Shadow Demon",
  "shadow fiend": "Shadow Fiend", "сф": "Shadow Fiend", "sf": "Shadow Fiend", "невермор": "Shadow Fiend",
  "shadow shaman": "Shadow Shaman", "шаман": "Shadow Shaman", "рхаста": "Shadow Shaman",
  "silencer": "Silencer", "сайленсер": "Silencer", "сайл": "Silencer",
  "skywrath mage": "Skywrath Mage", "скай": "Skywrath Mage", "скайврат": "Skywrath Mage",
  "slardar": "Slardar", "слардар": "Slardar",
  "slark": "Slark", "сларк": "Slark",
  "snapfire": "Snapfire", "снапфаер": "Snapfire", "бабка": "Snapfire",
  "sniper": "Sniper", "снайпер": "Sniper",
  "spectre": "Spectre", "спектр": "Spectre",
  "spirit breaker": "Spirit Breaker", "сб": "Spirit Breaker", "sb": "Spirit Breaker", "барол": "Spirit Breaker",
  "storm spirit": "Storm Spirit", "сторм": "Storm Spirit",
  "sven": "Sven", "свен": "Sven",

  // T
  "techies": "Techies", "технари": "Techies", "подрывник": "Techies",
  "templar assassin": "Templar Assassin", "та": "Templar Assassin", "ta": "Templar Assassin", "ланайя": "Templar Assassin",
  "terrorblade": "Terrorblade", "тб": "Terrorblade", "tb": "Terrorblade",
  "tidehunter": "Tidehunter", "тайд": "Tidehunter",
  "timbersaw": "Timbersaw", "тимбер": "Timbersaw",
  "tinker": "Tinker", "тинкер": "Tinker",
  "tiny": "Tiny", "тини": "Tiny", "камень": "Tiny",
  "treant protector": "Treant Protector", "трент": "Treant Protector", "дерево": "Treant Protector",
  "troll warlord": "Troll Warlord", "тролль": "Troll Warlord", "трол": "Troll Warlord",
  "tusk": "Tusk", "таск": "Tusk", "морж": "Tusk",

  // U
  "underlord": "Underlord", "андерлорд": "Underlord",
  "undying": "Undying", "зомби": "Undying",
  "ursa": "Ursa", "урса": "Ursa", "медведь": "Ursa",

  // V
  "vengeful spirit": "Vengeful Spirit", "вс": "Vengeful Spirit", "vs": "Vengeful Spirit", "месть": "Vengeful Spirit",
  "venomancer": "Venomancer", "веном": "Venomancer",
  "viper": "Viper", "вайпер": "Viper",
  "visage": "Visage", "визаж": "Visage",
  "void spirit": "Void Spirit", "войд спирит": "Void Spirit", "ввс": "Void Spirit",

  // W
  "warlock": "Warlock", "варлок": "Warlock",
  "weaver": "Weaver", "вивер": "Weaver",
  "windranger": "Windranger", "виндрейнджер": "Windranger", "вр": "Windranger",
  "winter wyvern": "Winter Wyvern", "вивер зима": "Winter Wyvern", "винтер": "Winter Wyvern",
  "witch doctor": "Witch Doctor", "вд": "Witch Doctor", "wd": "Witch Doctor", "доктор": "Witch Doctor",
  "wraith king": "Wraith King", "вк": "Wraith King", "wk": "Wraith King", "скелет": "Wraith King",

  // Z
  "zeus": "Zeus", "зевс": "Zeus",
};

export function resolveHeroName(input: string): string | null {
  const normalized = input.trim().toLowerCase();

  // Точное совпадение по словарю
  if (heroAliases[normalized]) {
    return heroAliases[normalized];
  }

  // Частичное совпадение по словарю
  for (const [alias, name] of Object.entries(heroAliases)) {
    if (alias.includes(normalized) || normalized.includes(alias)) {
      return name;
    }
  }

  return null;
}

export function resolveHeroNames(inputs: string[]): { resolved: string[]; failed: string[] } {
  const resolved: string[] = [];
  const failed: string[] = [];

  for (const input of inputs) {
    const name = resolveHeroName(input);
    if (name) {
      if (!resolved.includes(name)) {
        resolved.push(name);
      }
    } else {
      failed.push(input);
    }
  }

  return { resolved, failed };
}
