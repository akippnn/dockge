const adjectives = [
    "agile", "brave", "calm", "swift", "eager", "fierce", "gentle", "happy",
    "keen", "lively", "mighty", "noble", "proud", "rapid", "sharp", "strong",
    "vivid", "witty", "zesty", "bright", "cosmic", "divine", "frosty",
    "golden", "hidden", "iron", "jade", "lunar", "misty", "nova",
    "ocean", "platinum", "quantum", "royal", "solar", "thunder",
    "wild", "yellow", "amber", "crimson", "emerald", "sapphire",
];

const nouns = [
    "panda", "tiger", "eagle", "dragon", "phoenix", "wolf", "bear", "hawk",
    "lion", "shark", "whale", "fox", "raven", "koala", "otter", "falcon",
    "heron", "jaguar", "lynx", "owl", "panther", "rhino", "swan", "vixen",
    "badger", "coyote", "dolphin", "elk", "gecko", "ibis",
    "lemur", "mantis", "newt", "ocelot", "puma", "quail",
    "sable", "toucan", "viper", "wombat", "zebra",
];

let used = new Set<string>();

export function generateLabel(): string {
    for (let attempt = 0; attempt < 200; attempt++) {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const label = `${adj}-${noun}`;
        if (!used.has(label)) {
            used.add(label);
            return label;
        }
    }
    const fallback = `runner-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    used.add(fallback);
    return fallback;
}

export function releaseLabel(label: string) {
    used.delete(label);
}
