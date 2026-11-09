#!/usr/bin/env python3
"""DSATube collector. Builds public/videos.json and public/playlists.json.

  1. Videos     YouTube search through yt-dlp (no API key)
  2. Playlists  real YouTube playlists found by searching, with their videos
  3. Collections  1000+ extra playlists built from your video list (by topic, language,
                  channel, ...), so the Playlists tab is always full

Resumable: finished searches are remembered in data/state.json and the files are saved
every few searches, so Ctrl+C is safe. Run it again to continue.

  pip install -r requirements.txt
  python collect.py                   # full run
  python collect.py --max-minutes 30  # stop after 30 minutes, continue later
"""
import argparse, collections, json, os, random, re, sys, time, urllib.parse

try:
    from yt_dlp import YoutubeDL
except ImportError:
    sys.exit("yt-dlp is missing. Run:  pip install -r requirements.txt")

ROOT = os.path.dirname(os.path.abspath(__file__))
VIDEOS = os.path.join(ROOT, "public", "videos.json")
PLAYLISTS = os.path.join(ROOT, "public", "playlists.json")
STATE = os.path.join(ROOT, "data", "state.json")

# ---- What to search for. Add terms to get more. -----------------------------------
TOPICS = {
    "Arrays & Strings": ["arrays", "strings", "two pointers", "sliding window", "prefix sum", "kadane algorithm",
        "matrix problems", "string matching", "kmp algorithm", "palindrome", "anagram", "subarray problems",
        "rabin karp", "z algorithm", "next permutation"],
    "Linked Lists": ["linked list", "singly linked list", "doubly linked list", "circular linked list",
        "reverse linked list", "linked list cycle", "merge two sorted lists", "lru cache"],
    "Stacks & Queues": ["stack", "queue", "monotonic stack", "circular queue", "deque", "priority queue",
        "infix postfix", "next greater element", "min stack", "queue using stacks"],
    "Trees": ["binary tree", "binary search tree", "avl tree", "red black tree", "b tree", "trie", "segment tree",
        "fenwick tree", "tree traversal", "lowest common ancestor", "tree diameter", "heap data structure",
        "n-ary tree", "morris traversal", "huffman coding"],
    "Graphs": ["graph theory", "bfs", "dfs", "dijkstra algorithm", "bellman ford", "floyd warshall", "kruskal",
        "prim algorithm", "topological sort", "union find", "minimum spanning tree", "shortest path",
        "strongly connected components", "bipartite graph", "graph coloring", "network flow", "a star search"],
    "Dynamic Programming": ["dynamic programming", "memoization", "knapsack problem", "longest common subsequence",
        "longest increasing subsequence", "coin change", "edit distance", "matrix chain multiplication",
        "dp on trees", "dp on grids", "bitmask dp", "partition dp", "house robber", "fibonacci dp"],
    "Sorting": ["bubble sort", "selection sort", "insertion sort", "merge sort", "quick sort", "heap sort",
        "counting sort", "radix sort", "bucket sort", "shell sort", "sorting algorithms comparison"],
    "Searching": ["binary search", "linear search", "ternary search", "binary search on answer",
        "search in rotated array", "interpolation search", "exponential search"],
    "Hashing": ["hash table", "hash map", "hash function", "collision resolution", "open addressing", "chaining",
        "bloom filter", "consistent hashing", "two sum", "hashing problems"],
    "Recursion & Backtracking": ["recursion", "backtracking", "n queens", "sudoku solver", "subsets", "permutations",
        "combination sum", "tower of hanoi", "recursion tree", "word search"],
    "Greedy": ["greedy algorithm", "activity selection", "fractional knapsack", "job scheduling", "interval problems",
        "huffman"],
    "Bit Manipulation": ["bit manipulation", "bitwise operators", "xor tricks", "count set bits", "power of two"],
    "Complexity": ["big o notation", "time complexity", "space complexity", "amortized analysis", "asymptotic notation",
        "master theorem", "np complete"],
    "Interview Prep": ["dsa", "data structures and algorithms", "coding interview", "leetcode", "blind 75",
        "neetcode 150", "striver sde sheet", "competitive programming", "faang interview", "dsa roadmap",
        "dsa for beginners", "dsa projects"],
}
MODS = ["tutorial", "explained", "full course", "interview questions", "leetcode solution", "in python",
        "in java", "in c++", "visualization", "lecture", "in hindi", "for beginners"]
CHANNELS = [  # optional: channels to pull everything from (bad URLs are skipped)
    "https://www.youtube.com/@NeetCode/videos", "https://www.youtube.com/@takeUforward/videos",
    "https://www.youtube.com/@abdul_bari/videos", "https://www.youtube.com/@WilliamFiset-videos/videos",
    "https://www.youtube.com/@CSDojo/videos", "https://www.youtube.com/@freecodecamp/search?query=algorithms",
]

# ---- Relevance --------------------------------------------------------------------
DSA = re.compile(r"\b(dsa|data structures?|algorithms?|algorithmic|dynamic programming|leetcode|big[- ]?o|"
    r"(binary|avl|red[- ]black|segment|fenwick|suffix|n-?ary|b) ?(search|trees?)|linked lists?|"
    r"hash(ing| tables?| maps?| functions?)|graph(s| theory| traversal)|dijkstra|kruskal|prim'?s|bellman|floyd|"
    r"backtracking|recursion|memoi[sz]ation|(quick|merge|heap|bubble|radix|insertion|selection|counting|bucket|shell) ?sort|"
    r"sorting|heaps?|tries|trie|bloom filters?|union[- ]find|complexity|sliding window|two pointers?|"
    r"priority queues?|stacks?|queues?|a\* search|topological|knapsack|subsequence|n[- ]?queens?|kadane|"
    r"bit(wise)? manipulation|greedy|coding interview|competitive programming|bfs|dfs|subarray)\b", re.I)
NOISE = re.compile(r"\b(youtube'?s? algorithm|recommendation algorithm|tiktok|instagram|facebook|crypto|bitcoin|"
    r"election|politic\w*|music|lyrics|trailer|gameplay|vlog|podcast|reaction|prank|full movie|"
    r"stack (overflow|exchange)|livestream|live stream)\b", re.I)

def relevant(title, term=""):
    if NOISE.search(title):
        return False
    return bool(DSA.search(title)) or (len(term) > 3 and term.lower() in title.lower())

def guess_topic(title):
    t = title.lower()
    for tp, terms in TOPICS.items():
        if any(x in t for x in terms):
            return tp
    return "General"

# ---- Storage ----------------------------------------------------------------------
def load(path, default):
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return default

def save_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(obj, f, separators=(",", ":"), ensure_ascii=False)
    os.replace(tmp, path)

# videos.json uses short keys:  id, t=title, c=channel, tp=topic, v=views, d=duration(sec)
def keep(e, topic, term="", strict=True):
    vid, title, dur = e.get("id") or "", e.get("title") or "", e.get("duration")
    if len(vid) != 11 or not dur or dur < 90 or dur > 12 * 3600:
        return None
    if e.get("live_status") in ("is_live", "is_upcoming"):
        return None
    if strict and not relevant(title, term):
        return None
    if NOISE.search(title):
        return None
    topic = guess_topic(title) if topic == "General" else topic
    return dict(id=vid, t=title, c=e.get("channel") or e.get("uploader") or "", tp=topic,
                v=int(e.get("view_count") or 0), d=int(dur))

# ---- Collections: playlists built from the video list ------------------------------
ACRONYMS = {"bfs": "BFS", "dfs": "DFS", "dsa": "DSA", "kmp": "KMP", "lru": "LRU", "dp": "DP", "np": "NP",
            "xor": "XOR", "bst": "BST", "avl": "AVL", "faang": "FAANG", "sde": "SDE"}
LANGS = [("in Python", r"\bpython\b"), ("in Java", r"\bjava\b"), ("in C++", r"c\+\+|\bcpp\b"),
         ("in Hindi", r"\bhindi\b|हिंदी")]
FLAVORS = LANGS + [("for Beginners", r"beginner"), ("Interview Questions", r"interview|leetcode"),
                   ("Visualized", r"visuali[sz]"), ("Crash Courses", r"crash course|full course|complete course")]

def nice(s):
    return " ".join(ACRONYMS.get(w, w.capitalize()) for w in s.split())

def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:60]

def build_collections(db, limit):
    vids = sorted(db.values(), key=lambda v: -v["v"])
    out = {}
    def add(cid, title, topic, items, minn=6, cap=60):
        ids = [v["id"] for v in items][:cap]
        if len(ids) >= minn and cid not in out:
            out[cid] = dict(id=cid, t=title, c="DSATube", tp=topic, k="auto", v=ids,
                            _w=len(ids) * 1e9 + sum(v["v"] for v in items[:cap]))
    for tp in TOPICS:
        pool = [v for v in vids if v["tp"] == tp]
        base = "c-" + slug(tp)
        add(base + "-best", f"Best of {tp}", tp, pool, cap=100)
        add(base + "-quick", f"{tp}: quick explainers (under 10 min)", tp, [v for v in pool if v["d"] < 600])
        add(base + "-long", f"{tp}: full courses (over 1 hour)", tp, [v for v in pool if v["d"] > 3600], minn=5)
        for label, pat in LANGS:
            add(f"{base}-{slug(label)}", f"{tp} {label}", tp, [v for v in pool if re.search(pat, v["t"], re.I)])
    for tp, terms in TOPICS.items():
        for term in terms:
            tl = term.lower()
            pool = [v for v in vids if tl in v["t"].lower()]
            add(f"c-{slug(term)}", f"{nice(term)}: complete collection", tp, pool)
            for label, pat in FLAVORS:
                add(f"c-{slug(term)}-{slug(label)}", f"{nice(term)} {label}", tp,
                    [v for v in pool if re.search(pat, v["t"], re.I)])
    by_ch = collections.defaultdict(list)
    for v in vids:
        if len(v["c"]) > 1:
            by_ch[v["c"]].append(v)
    for ch, items in by_ch.items():
        top = collections.Counter(v["tp"] for v in items).most_common(1)[0][0]
        add(f"c-ch-{slug(ch)}", f"{ch}: DSA videos", top, items, minn=8, cap=80)
        per = collections.defaultdict(list)
        for v in items:
            per[v["tp"]].append(v)
        for tp, sub in per.items():
            add(f"c-ch-{slug(ch)}-{slug(tp)}", f"{ch}: {tp}", tp, sub, minn=6)
    best = sorted(out.values(), key=lambda p: -p["_w"])[:limit]
    for p in best:
        del p["_w"]
    return best

# ---- Main ---------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", type=int, default=12000, help="stop video search at this many videos")
    ap.add_argument("--per-query", type=int, default=60, help="results requested per video search")
    ap.add_argument("--playlists", type=int, default=500, help="how many real YouTube playlists to fetch")
    ap.add_argument("--pl-videos", type=int, default=60, help="max videos taken from one playlist")
    ap.add_argument("--max-collections", type=int, default=1500, help="cap on generated collections")
    ap.add_argument("--max-queries", type=int, default=0, help="0 = no limit")
    ap.add_argument("--max-minutes", type=float, default=0, help="0 = no limit")
    ap.add_argument("--skip-playlists", action="store_true", help="don't fetch real YouTube playlists")
    ap.add_argument("--reset", action="store_true", help="forget finished searches, search everything again")
    args = ap.parse_args()

    db = {v["id"]: v for v in load(VIDEOS, {}).get("videos", [])}
    old = load(PLAYLISTS, {}).get("playlists", [])
    real = {p["id"]: p for p in old if p.get("k") == "yt"}
    auto_prev = [p for p in old if p.get("k") == "auto"]
    st = {} if args.reset else load(STATE, {})
    done, pl_q, pl_seen = set(st.get("done", [])), set(st.get("pl_q", [])), set(st.get("pl_seen", []))
    start = time.time()
    out_of_time = lambda: bool(args.max_minutes and time.time() - start > args.max_minutes * 60)
    base = {"quiet": True, "no_warnings": True, "extract_flat": True, "skip_download": True,
            "ignoreerrors": True, "socket_timeout": 20}
    ydl = YoutubeDL(base)

    def save(autos):
        save_json(VIDEOS, {"updated": int(time.time()),
                           "videos": sorted(db.values(), key=lambda v: -v["v"])})
        pls = [dict(p, v=[i for i in p["v"] if i in db]) for p in list(real.values()) + autos]
        save_json(PLAYLISTS, {"updated": int(time.time()), "playlists": [p for p in pls if len(p["v"]) >= 3]})
        save_json(STATE, {"done": sorted(done), "pl_q": sorted(pl_q), "pl_seen": sorted(pl_seen)})

    def run(url, y=None):
        try:
            return (y or ydl).extract_info(url, download=False) or {}
        except Exception as e:
            print(f"  failed: {str(e)[:80]}")
            return {}

    autos = auto_prev
    try:
        # 1. videos
        jobs = [(f"{t} {m}", tp, t) for tp, terms in TOPICS.items() for t in terms for m in MODS]
        random.Random(7).shuffle(jobs)
        jobs = [(u, "General", "") for u in CHANNELS] + jobs
        todo = [j for j in jobs if j[0] not in done]
        print(f"{len(db)} videos stored, {len(todo)} video searches left.")
        empty = 0
        for i, (q, topic, term) in enumerate(todo, 1):
            if len(db) >= args.target:
                print(f"Reached {args.target} videos."); break
            if (args.max_queries and i > args.max_queries) or out_of_time():
                print("Limit reached."); break
            entries = [e for e in (run(q if q.startswith("http") else f"ytsearch{args.per_query}:{q}")
                                    .get("entries") or []) if e]
            if not q.startswith("http"):          # a bad channel URL must not look like a rate limit
                empty = empty + 1 if not entries else 0
            if empty >= 6:
                print("YouTube returned nothing 6 times in a row (rate limit?). Wait a while and run again."); break
            added = 0
            for e in entries:
                v = keep(e, topic, term)
                if v and v["id"] not in db:
                    db[v["id"]] = v; added += 1
            if entries: done.add(q)
            print(f"[{i}/{len(todo)}] {q[:46]:46} +{added:<3} videos {len(db)}")
            if i % 10 == 0: save(autos)
            time.sleep(random.uniform(0.8, 1.8))

        # 2. real YouTube playlists
        if not args.skip_playlists and len(real) < args.playlists and not out_of_time():
            print(f"\nFetching real playlists ({len(real)}/{args.playlists})...")
            lister = YoutubeDL(dict(base, playlistend=40))
            reader = YoutubeDL(dict(base, playlistend=args.pl_videos))
            pjobs = [(f"{t} {m}", tp, t) for tp, terms in TOPICS.items() for t in terms
                     for m in ("playlist", "full course playlist")]
            random.Random(11).shuffle(pjobs)
            empty = 0
            for q, tp, term in [j for j in pjobs if j[0] not in pl_q]:
                if len(real) >= args.playlists or out_of_time(): break
                url = "https://www.youtube.com/results?search_query=" + urllib.parse.quote_plus(q) + "&sp=EgIQAw%253D%253D"
                found = [e for e in (run(url, lister).get("entries") or []) if e]
                empty = empty + 1 if not found else 0
                if empty >= 6:
                    print("YouTube returned nothing 6 times in a row (rate limit?). Run again later."); break
                pl_q.add(q)
                for e in found:
                    pid = e.get("id") or ""
                    if not re.fullmatch(r"(PL|OLAK5uy_|FL)[\w-]{10,}", pid) or pid in pl_seen:
                        continue
                    pl_seen.add(pid)
                    if not relevant(e.get("title") or "", term):
                        continue
                    info = run("https://www.youtube.com/playlist?list=" + pid, reader)
                    ids = []
                    for ve in info.get("entries") or []:
                        v = keep(ve or {}, tp, strict=False) if ve else None
                        if v:
                            db.setdefault(v["id"], v); ids.append(v["id"])
                    if len(ids) >= 5:
                        real[pid] = dict(id=pid, t=info.get("title") or e.get("title"), k="yt", tp=tp, v=ids,
                                         c=info.get("channel") or info.get("uploader") or e.get("uploader") or "")
                        print(f"  playlist {len(real)}/{args.playlists}: {real[pid]['t'][:50]} ({len(ids)} videos)")
                    if out_of_time() or len(real) >= args.playlists: break
                    time.sleep(random.uniform(0.5, 1.2))
                time.sleep(random.uniform(0.8, 1.6))
                save(autos)
    except KeyboardInterrupt:
        print("\nStopped. Saving progress...")
    finally:
        autos = build_collections(db, args.max_collections)
        save(autos)
        total = len(real) + len(autos)
        print(f"\nDone. {len(db)} videos, {total} playlists ({len(real)} from YouTube, {len(autos)} collections).")
        if total < 1000:
            print("Fewer than 1000 playlists: collect more videos first (run again), or raise --max-collections.")

if __name__ == "__main__":
    main()
