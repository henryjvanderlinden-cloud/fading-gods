import random, statistics
from collections import deque

COLS, ROWS = 18, 11
N = COLS * ROWS

def K(c, r): return r * COLS + c

def neighbours(c, r):
    o = [(1,0),(1,-1),(0,-1),(-1,0),(0,1),(1,1)] if (r & 1) else \
        [(1,0),(0,-1),(-1,-1),(-1,0),(-1,1),(0,1)]
    return [(c+dc, r+dr) for dc, dr in o
            if 0 <= c+dc < COLS and 0 <= r+dr < ROWS]

NB = [[K(*p) for p in neighbours(k % COLS, k // COLS)] for k in range(N)]


class Tile:
    __slots__ = ('c','r','t','f','st','own','pop','sown')
    def __init__(self, c, r, t, f):
        self.c, self.r, self.t, self.f = c, r, t, f
        self.st = 'wild'; self.own = None
        self.pop = 0; self.sown = None   # settlement pop / owner


def gen_map(rng):
    v = [rng.random() for _ in range(N)]
    for _ in range(3):
        nv = v[:]
        for k in range(N):
            a = NB[k]
            nv[k] = (v[k] + sum(v[x] for x in a)) / (len(a) + 1)
        v = nv
    T = []
    for r in range(ROWS):
        for c in range(COLS):
            ex = min(c/2.2, (COLS-1-c)/2.2, r/1.6, (ROWS-1-r)/1.6, 1.0)
            x = v[K(c,r)]*0.55 + 0.45*ex
            if x < 0.38:   t, f = 'water', 0.0
            elif x > 0.71: t, f = 'hill', 0.55
            elif x > 0.59: t, f = 'forest', 0.75
            else:          t, f = 'plain', 1.0
            T.append(Tile(c, r, t, f))
    return T


class Game:
    def __init__(self, rng, growth=0.17, spread=2, radius=1,
                 turns=20, excl=0):
        self.rng = rng
        self.growth, self.spread, self.radius = growth, spread, radius
        self.turns, self.excl = turns, excl
        self.T = gen_map(rng)
        land = [k for k in range(N) if self.T[k].t != 'water']
        self.land = land
        left  = [k for k in land if self.T[k].c < COLS*0.34]
        right = [k for k in land if self.T[k].c > COLS*0.66]
        self.pos = [ (left or land)[len(left or land)//2],
                     (right or land)[len(right or land)//2] ]
        self.turn = 1

    # --- geometry -------------------------------------------------
    def ring(self, k, rad):
        s = {k}
        for _ in range(rad):
            add = set()
            for x in s: add.update(NB[x])
            s |= add
        return s

    def cost(self, k, who):
        t = self.T[k]
        if t.t == 'water': return 99
        if t.st == 'cultured': return 3
        if t.st == 'haunted' and t.own != who: return 3
        return 1

    def reach(self, who, mp=3):
        d = {self.pos[who]: 0}
        q = deque([(self.pos[who], 0)])
        while q:
            k, c = q.popleft()
            for nk in NB[k]:
                nc = c + self.cost(nk, who)
                if nc <= mp and (nk not in d or nc < d[nk]):
                    d[nk] = nc; q.append((nk, nc))
        return d

    # --- legality -------------------------------------------------
    def can_found(self, k, who):
        t = self.T[k]
        if t.t == 'water' or t.sown is not None: return False
        if t.st == 'haunted' and t.own != who: return False
        if t.st == 'cultured' and t.own != who: return False
        if any(self.T[x].sown is not None for x in NB[k]): return False
        if self.excl:
            for x in self.ring(k, self.excl):
                q = self.T[x]
                if q.st == 'haunted' and q.own is not None and q.own != who:
                    return False
        return True

    def haunt_gain(self, k, who):
        n = 0
        for x in self.ring(k, self.radius):
            q = self.T[x]
            if q.t != 'water' and q.sown is None and \
               (q.st == 'wild' or (q.st == 'haunted' and q.own != who)):
                n += 1
        return n

    def can_split(self, k, who):
        t = self.T[k]
        if t.sown != who or t.pop < 60: return False
        return any(self.can_found(x, who) for x in NB[k])

    # --- acts -----------------------------------------------------
    def act(self, kind, who):
        k = self.pos[who]; t = self.T[k]
        if kind == 'haunt':
            if not self.haunt_gain(k, who): return False
            for x in self.ring(k, self.radius):
                q = self.T[x]
                if q.t != 'water' and q.sown is None and \
                   (q.st == 'wild' or (q.st == 'haunted' and q.own != who)):
                    q.st = 'haunted'; q.own = who
        elif kind == 'found':
            if not self.can_found(k, who): return False
            t.sown = who; t.pop = 30; t.st = 'wild'; t.own = None
        elif kind == 'split':
            if not self.can_split(k, who): return False
            free = [x for x in NB[k] if self.can_found(x, who)]
            nk = self.rng.choice(free)
            half = t.pop // 2; t.pop -= half
            self.T[nk].sown = who; self.T[nk].pop = half
            self.T[nk].st = 'wild'; self.T[nk].own = None
        return True

    # --- policy ---------------------------------------------------
    def take_turn(self, who, weights):
        wF, wH, wS = weights
        R = self.reach(who)
        best = None
        for k, mv in R.items():
            cands = []
            if self.can_found(k, who): cands.append((wF*(0.6+self.T[k].f), 'found'))
            hg = self.haunt_gain(k, who)
            if hg: cands.append((wH*hg, 'haunt'))
            if self.can_split(k, who): cands.append((wS, 'split'))
            for v, a in cands:
                s = v - mv*0.35 + self.rng.random()*0.9
                if best is None or s > best[0]: best = (s, k, a)
        if best:
            self.pos[who] = best[1]; self.act(best[2], who)
        else:
            self.pos[who] = self.rng.choice(list(R.keys()))

    # --- world tick -----------------------------------------------
    def tick(self):
        for k in self.land:
            t = self.T[k]
            if t.sown is None: continue
            frac = sum(1 for x in NB[k] if self.T[x].t != 'water') / 6
            f = t.f * (0.55 + 0.45*frac)
            t.pop = min(2600, t.pop * (1 + self.growth*f))
        for k in self.land:
            t = self.T[k]
            if t.sown is None or t.pop < 150: continue
            rad = 1 + int((t.pop - 150) // 420)
            cand = [x for x in self.ring(k, rad)
                    if self.T[x].t != 'water' and self.T[x].sown is None
                    and not (self.T[x].st == 'cultured' and self.T[x].own == t.sown)]
            for x in cand[:self.spread]:
                self.T[x].st = 'cultured'; self.T[x].own = t.sown
        for k in self.land:
            t = self.T[k]
            if t.st == 'haunted' and any(self.T[x].st == 'cultured' for x in NB[k]):
                t.st = 'wild'; t.own = None

    def score(self):
        s = [[0,0,0],[0,0,0]]   # haunt, culture, settled
        for k in self.land:
            t = self.T[k]
            if t.sown is not None: s[t.sown][2] += 3
            elif t.st == 'haunted': s[t.own][0] += 1
            elif t.st == 'cultured': s[t.own][1] += 2
        return s

    def play(self, wA, wB):
        for _ in range(self.turns):
            self.take_turn(0, wA)
            self.take_turn(1, wB)
            self.tick()
            self.turn += 1
        return self.score()


DOCTRINE = {
    'cities': (12, 1, 0),
    'bands':  (5, 4, 14),
    'mixed':  (8, 3, 6),
    'haunt':  (2, 9, 2),
}


def match(a, b, n=60, seed0=0, **kw):
    wins = 0; ties = 0; da = []; db = []; parts = [0,0,0]
    for i in range(n):
        rng = random.Random(seed0 + i)
        g = Game(rng, **kw)
        s = g.play(DOCTRINE[a], DOCTRINE[b])
        ta, tb = sum(s[0]), sum(s[1])
        da.append(ta); db.append(tb)
        for j in range(3): parts[j] += s[0][j]
        if ta > tb: wins += 1
        elif ta == tb: ties += 1
    return dict(win=wins/n, tie=ties/n,
                a=statistics.mean(da), b=statistics.mean(db),
                haunt=parts[0]/n, cult=parts[1]/n, set=parts[2]/n)
