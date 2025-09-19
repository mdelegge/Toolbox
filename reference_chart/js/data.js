// Data for the Reference Chart tool
// You can easily add new topics and concepts by editing this file.
// Each topic has: name and items[]. Each item has: key, title, short, icon, and optional definition (HTML allowed).

window.REFERENCE_TOPICS = [
  {
    name: "Movement",
    items: [
      { key: "move", title: "Move", short: "Move up to your Speed", icon: "🚶", definition: "Move a distance up to your Speed." },
      { key: "climbing", title: "Climbing", short: "+1 ft per 1 ft climbed", icon: "🧗", definition: "Climbing costs an extra foot of movement for every foot you climb." },
      { key: "crawling", title: "Crawling", short: "+1 ft per 1 ft crawled", icon: "🦎", definition: "Crawling costs an extra foot of movement for every foot you crawl." },
      { key: "drop-prone", title: "Drop Prone", short: "Free; 0 Speed cost", icon: "🧎", definition: "You can drop prone for free; it doesn't cost movement." },
      { key: "stand-up", title: "Stand Up", short: "Cost: half Speed", icon: "🧍", definition: "Standing up costs an amount of movement equal to half your Speed." },
      { key: "high-jump", title: "High Jump", short: "(3 + STR mod) ft", icon: "🦘", definition: "You leap into the air a number of feet equal to 3 + your Strength modifier." },
      { key: "long-jump", title: "Long Jump", short: "STR score ft", icon: "🏃‍♂️", definition: "You jump a number of feet up to your Strength score." },
      { key: "swimming", title: "Swimming", short: "+1 ft per 1 ft swum", icon: "🏊", definition: "Swimming costs an extra foot of movement for every foot you swim." },
      { key: "teleportation", title: "Teleportation", short: "Instant relocation", icon: "🌀", definition: "You disappear and reappear elsewhere instantly, as specified by the effect." },
      { key: "difficult-terrain", title: "Difficult Terrain", short: "+1 ft per 1 ft moved", icon: "🌿", definition: "Moving through difficult terrain costs an extra foot of movement for every foot you move." }
    ]
  },
  {
    name: "Actions",
    items: [
      { key: "attack", title: "Attack", short: "Weapon or Unarmed", icon: "⚔️", definition: "Make a weapon attack or an Unarmed Strike." },
      { key: "dash", title: "Dash", short: "+Speed movement this turn", icon: "💨", definition: "For the rest of the turn, you gain extra movement equal to your Speed." },
      { key: "disengage", title: "Disengage", short: "No OAs this turn", icon: "🛡️", definition: "Your movement doesn’t provoke Opportunity Attacks for the rest of the turn." },
      { key: "dodge", title: "Dodge", short: "Atk vs you: Disadv.; Dex STs: Adv.", icon: "🌀", definition: "Until the start of your next turn, attack rolls against you have Disadvantage, and you make Dexterity saving throws with Advantage. You lose this benefit if you are Incapacitated or if your Speed is 0." },
      { key: "help", title: "Help", short: "Assist check or attack", icon: "🤝", definition: "Help another creature’s ability check or attack roll, or administer first aid as specified by the rules." },
      { key: "hide", title: "Hide", short: "Dex (Stealth) check", icon: "🕵️", definition: "Attempt to hide by making a Dexterity (Stealth) check." },
      { key: "influence", title: "Influence", short: "Cha or Wis social check", icon: "🗣️", definition: "Make a Charisma (Deception, Intimidation, Performance, or Persuasion) or Wisdom (Animal Handling) check to alter a creature’s attitude." },
      { key: "magic", title: "Magic", short: "Cast/use magic", icon: "✨", definition: "Cast a spell, use a magic item, or use a magical feature, as appropriate." },
      { key: "ready", title: "Ready", short: "Trigger + prepared action", icon: "⏳", definition: "Prepare to take an action in response to a trigger you define." },
      { key: "search", title: "Search", short: "Wis: Insight/Medicine/Percep/Survival", icon: "🔍", definition: "Make a Wisdom (Insight, Medicine, Perception, or Survival) check." },
      { key: "study", title: "Study", short: "Int: Arc/Hist/Invest/Nature/Rel", icon: "📚", definition: "Make an Intelligence (Arcana, History, Investigation, Nature, or Religion) check." },
      { key: "utilize", title: "Utilize", short: "Use nonmagical object", icon: "🧰", definition: "Use a nonmagical object." }
    ]
  },
  {
    name: "Conditions",
    items: [
      { key: "blinded", title: "Blinded", short: "You can't see", icon: "🙈", definition: "You can’t see and automatically fail any ability check that requires sight; attack rolls against you have Advantage, and your attack rolls have Disadvantage." },
      { key: "charmed", title: "Charmed", short: "You're charmed", icon: "💘", definition: "You can’t attack the charmer or target it with harmful abilities or magical effects, and the charmer has Advantage on Charisma checks to interact with you." },
      { key: "deafened", title: "Deafened", short: "You can't hear", icon: "🙉", definition: "You can’t hear and automatically fail any ability check that requires hearing." },
      { key: "exhaustion", title: "Exhaustion", short: "You're exhausted", icon: "🥵", definition: "You suffer levels of exhaustion with specified effects; certain actions or rests can reduce it. See rules for details." },
      { key: "frightened", title: "Frightened", short: "You're frightened", icon: "😱", definition: "You have Disadvantage on ability checks and attack rolls while the source of your fear is within line of sight; you can’t willingly move closer to the source of your fear." },
      { key: "grappled", title: "Grappled", short: "You're grappled", icon: "🪢", definition: "Your Speed becomes 0 and can’t benefit from any bonus to your Speed; the condition ends if the grappler is incapacitated or you are moved out of reach." },
      { key: "incapacitated", title: "Incapacitated", short: "Unable to take actions", icon: "💤", definition: "You can’t take actions or reactions." },
      { key: "invisible", title: "Invisible", short: "You can't be seen", icon: "👻", definition: "You are impossible to see without magic or a special sense; attack rolls against you have Disadvantage, and your attack rolls have Advantage." },
      { key: "paralyzed", title: "Paralyzed", short: "Can't move or act", icon: "🧊", definition: "You are incapacitated and can’t move or speak; attack rolls against you have Advantage, any attack that hits is a critical hit if the attacker is within 5 feet; you automatically fail Strength and Dexterity saving throws." },
      { key: "petrified", title: "Petrified", short: "You're petrified", icon: "🗿", definition: "You are transformed into a solid inanimate substance; you have Resistance to all damage, and are immune to poison and disease (but not to existing effects)." },
      { key: "poisoned", title: "Poisoned", short: "You're poisoned", icon: "☠️", definition: "You have Disadvantage on attack rolls and ability checks." },
      { key: "prone", title: "Prone", short: "You're prone", icon: "🤸", definition: "Your only movement option is to crawl unless you stand up; you have Disadvantage on attack rolls; attack rolls against you have Advantage if the attacker is within 5 feet, otherwise Disadvantage." },
      { key: "restrained", title: "Restrained", short: "You're restrained", icon: "🪤", definition: "Your Speed becomes 0; attack rolls against you have Advantage; your attack rolls have Disadvantage; you have Disadvantage on Dexterity saving throws." },
      { key: "stunned", title: "Stunned", short: "Worse than incapacitated", icon: "💫", definition: "You are incapacitated, can’t move, and can speak only falteringly; attack rolls against you have Advantage; you automatically fail Strength and Dexterity saving throws." },
      { key: "unconscious", title: "Unconscious", short: "You're unconscious", icon: "🛌", definition: "You are incapacitated, can’t move or speak, and are unaware of your surroundings; you drop whatever you’re holding and fall prone; attack rolls against you have Advantage; any attack that hits is a critical hit if the attacker is within 5 feet." }
    ]
  }
];

// Optional: base URL for official rules reference shown in popovers
window.RULES_SOURCE_URL = "https://www.dndbeyond.com/sources/dnd/br-2024";
