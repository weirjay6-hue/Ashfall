import seedrandom from 'seedrandom';

export class RNG {
  constructor(seed) {
    this.seed = seed;
    this._rng = seedrandom(seed);
  }

  next() { return this._rng(); }

  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(min, max) {
    return this.next() * (max - min) + min;
  }

  pick(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[this.int(0, arr.length - 1)];
  }

  bool(chance = 0.5) {
    return this.next() < chance;
  }

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  weighted(items) {
    const total = items.reduce((s, i) => s + (i.weight || 1), 0);
    let r = this.next() * total;
    for (const item of items) {
      r -= item.weight || 1;
      if (r <= 0) return 'value' in item ? item.value : item;
    }
    const last = items[items.length - 1];
    return 'value' in last ? last.value : last;
  }

  uid() {
    return Math.random().toString(36).slice(2, 10);
  }

  name(type = 'npc') {
    const parts = NAME_PARTS[type] || NAME_PARTS.npc;
    const prefix = this.pick(parts.prefix);
    const suffix = this.pick(parts.suffix);
    return prefix + suffix;
  }

  townName() {
    const p = this.pick(TOWN_PREFIXES);
    const s = this.pick(TOWN_SUFFIXES);
    return p + s;
  }
}

const NAME_PARTS = {
  npc: {
    prefix: ['Al','Bran','Cor','Dal','Eld','Fen','Gar','Hav','Ira','Jor','Kel','Lorn','Mal','Nor','Oryn','Pol','Quen','Rath','Sol','Tor','Ulm','Var','Wyl','Xen','Yor','Zan'],
    suffix: ['dar','ek','el','ic','ion','is','ith','ok','on','or','os','us','ys','an','eth','ond','wyn','ard','ern'],
  },
  female: {
    prefix: ['Aed','Bel','Cal','Del','Eli','Fae','Gal','Hel','Isa','Jal','Kal','Lir','Myr','Nar','Ori','Phe','Quel','Rha','Sel','Tel','Una','Val','Wren','Xyl','Ysa','Zyl'],
    suffix: ['a','ae','ara','ath','aya','ea','ela','ia','iel','ine','ira','na','nya','ra','ria','sa','thal','va','yn','yra'],
  },
};

const TOWN_PREFIXES = ['Ash','Black','Cold','Dark','Dawn','Deep','Dragon','Ember','Fallen','Fire','Frost','Ghost','Grim','Hard','High','Hill','Iron','Last','Lone','Lost','Mud','Night','Old','Red','Rock','Raven','Salt','Shadow','Silver','Storm','Thorn','Thunder','Twin','West','White','Wind','Wolf'];
const TOWN_SUFFIXES = ['barrow','bridge','brook','burg','cliff','cross','dale','fall','fen','field','ford','gate','glen','grove','haven','helm','hill','hold','keep','march','moor','mount','port','reach','ridge','rock','run','shade','spire','stead','vale','wall','ward','water','well','wood'];

export function makeRNG(seed) {
  return new RNG(seed);
}
