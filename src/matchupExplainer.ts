import type { OpenDotaHero } from "./types.js";

export function explainMatchup(
  counter: OpenDotaHero,
  enemy: OpenDotaHero,
  winrate: number,
): string {
  const counterRoles = new Set(counter.roles);
  const enemyRoles = new Set(enemy.roles);

  const reasons: string[] = [];

  // Дизейблер против мобильного/уходящего героя
  if (counterRoles.has("Disabler") && enemyRoles.has("Escape")) {
    reasons.push("блокирует побег");
  }

  // Дизейблер против нюкера — прерывает касты
  if (counterRoles.has("Disabler") && enemyRoles.has("Nuker")) {
    reasons.push("прерывает каст способностей");
  }

  // Дизейблер против керри — не даёт фармить
  if (counterRoles.has("Disabler") && enemyRoles.has("Carry")) {
    reasons.push("контролирует керри");
  }

  // Нюкер против хрупкого героя (инт/аги)
  if (counterRoles.has("Nuker") && (enemy.primary_attr === "int" || enemy.primary_attr === "agi")) {
    reasons.push("взрывной урон добивает хрупкого героя");
  }

  // Инициатор против керри
  if (counterRoles.has("Initiator") && enemyRoles.has("Carry")) {
    reasons.push("форсирует бой до набора предметов");
  }

  // Дурабл против нюкера — выдерживает взрыв
  if (counterRoles.has("Durable") && enemyRoles.has("Nuker")) {
    reasons.push("выдерживает взрывной урон");
  }

  // Дальний бой против ближнего — безопасный харас
  if (counter.attack_type === "Ranged" && enemy.attack_type === "Melee") {
    reasons.push("безопасный харас с расстояния");
  }

  // Пушер против медленного героя
  if (counterRoles.has("Pusher") && !enemyRoles.has("Pusher")) {
    reasons.push("быстро ломает базу");
  }

  // Саппорт против агрессивного керри на линии
  if (counterRoles.has("Support") && counterRoles.has("Disabler") && enemyRoles.has("Carry")) {
    reasons.push("ломает лайнинг");
  }

  // Если ничего конкретного — просто винрейт
  if (reasons.length === 0) {
    if (winrate >= 57) return "статистически очень сильный матчап";
    if (winrate >= 54) return "стабильно выигрывает этот матчап";
    return "хорошо закрывает эту позицию";
  }

  // Берём не больше 2 причин
  return reasons.slice(0, 2).join(", ");
}
