import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check,
  ChevronRight,
  Cloud,
  Clock3,
  Crown,
  History,
  Lightbulb,
  LockKeyhole,
  LogIn,
  LogOut,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  TriangleAlert,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTeam } from "@/context/TeamContext";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { apiGet, apiPost, apiPut, ApiError } from "@/lib/api";

const SIZE = 11;
const STORAGE_KEY = "queen-puzzle-guest-progress";

export interface Cell {
  row: number;
  col: number;
}

export interface SolvedEntry {
  date: string;
  elapsed_seconds: number;
  moves: number;
}

export interface Progress {
  cells: Cell[];
  current_streak: number;
  best_streak: number;
  solved_count: number;
  history: SolvedEntry[];
  saved_at: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

interface AuthResponse {
  user: User;
}

interface HintResponse {
  cell: Cell | null;
  message: string;
}

interface BoardPayload {
  cells: Cell[];
  elapsed_seconds: number;
}

const emptyProgress: Progress = {
  cells: [],
  current_streak: 0,
  best_streak: 0,
  solved_count: 0,
  history: [],
  saved_at: null,
};

function readGuestProgress(): Progress {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...emptyProgress, ...JSON.parse(saved) } : emptyProgress;
  } catch {
    return emptyProgress;
  }
}

function sameCell(first: Cell, second: Cell) {
  return first.row === second.row && first.col === second.col;
}

function conflictsFor(cells: Cell[]) {
  const conflicts = new Set<string>();
  cells.forEach((first, firstIndex) => {
    cells.slice(firstIndex + 1).forEach((second) => {
      if (
        first.row === second.row ||
        first.col === second.col ||
        Math.abs(first.row - second.row) === Math.abs(first.col - second.col)
      ) {
        conflicts.add(`${first.row}-${first.col}`);
        conflicts.add(`${second.row}-${second.col}`);
      }
    });
  });
  return conflicts;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function formatApiError(error: unknown) {
  if (error instanceof ApiError && typeof error.body === "object" && error.body !== null) {
    const detail = (error.body as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((item) => (item as { msg?: string }).msg ?? "").join(" ");
  }
  return "Something went wrong. Please try again.";
}

export default function Home() {
  const queryClient = useQueryClient();
  const { teamName, logoutTeam } = useTeam();
  const navigate = useNavigate();

  function handleLogoutTeam() {
    logoutTeam();
    toast.info("Logged out from team. Returning to login...");
    navigate("/");
  }

  const [guestProgress, setGuestProgress] = useState<Progress>(readGuestProgress);
  const [cells, setCells] = useState<Cell[]>(() => readGuestProgress().cells);
  const [hintCell, setHintCell] = useState<Cell | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authOpen, setAuthOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiGet<User | null>("/auth/me"),
    retry: false,
  });
  const user = meQuery.data ?? null;
  const progressQuery = useQuery({
    queryKey: ["puzzle", "progress"],
    queryFn: () => apiGet<Progress>("/puzzle/progress"),
    enabled: Boolean(user),
    retry: false,
  });
  const hydratedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (user && progressQuery.data && hydratedUserRef.current !== user.id) {
      hydratedUserRef.current = user.id;
      setCells(progressQuery.data.cells);
      setGuestProgress(progressQuery.data);
      setIsSolved(false);
    }
  }, [progressQuery.data, user]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("queen-puzzle-theme");
    const dark = storedTheme === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  useEffect(() => {
    if (!startedAt) return undefined;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const saveProgressMutation = useMutation({
    mutationFn: (payload: BoardPayload) => apiPut<Progress>("/puzzle/progress", payload),
    onSuccess: (saved) => {
      setGuestProgress(saved);
      queryClient.setQueryData(["puzzle", "progress"], saved);
    },
  });
  const completeMutation = useMutation({
    mutationFn: (payload: BoardPayload) => apiPost<Progress>("/puzzle/complete", payload),
    onSuccess: (saved) => {
      setGuestProgress(saved);
      queryClient.setQueryData(["puzzle", "progress"], saved);
      setIsSolved(true);
      setStartedAt(null);
      toast.success("A clean 11-queen solution. Your streak is safe.");
    },
    onError: (error) => toast.error(formatApiError(error)),
  });
  const hintMutation = useMutation({
    mutationFn: (payload: BoardPayload) => apiPost<HintResponse>("/puzzle/hint", payload),
    onSuccess: (result) => {
      setHintCell(result.cell);
      if (result.cell) toast.info(result.message);
      else toast.warning(result.message);
    },
    onError: (error) => toast.error(formatApiError(error)),
  });
  const authMutation = useMutation({
    mutationFn: () =>
      authMode === "login"
        ? apiPost<AuthResponse>("/auth/login", { email: authEmail, password: authPassword })
        : apiPost<AuthResponse>("/auth/register", { email: authEmail, password: authPassword, name: authName }),
    onSuccess: ({ user: signedInUser }) => {
      queryClient.setQueryData(["auth", "me"], signedInUser);
      queryClient.invalidateQueries({ queryKey: ["puzzle", "progress"] });
      setAuthOpen(false);
      setAuthPassword("");
      toast.success(`Welcome back, ${signedInUser.name}. Cloud save is on.`);
    },
    onError: (error) => toast.error(formatApiError(error)),
  });
  const logoutMutation = useMutation({
    mutationFn: () => apiPost<void>("/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], undefined);
      queryClient.removeQueries({ queryKey: ["puzzle", "progress"] });
      hydratedUserRef.current = null;
      toast.success("Signed out. Your guest board remains on this device.");
    },
  });

  const conflicts = useMemo(() => conflictsFor(cells), [cells]);
  const hasStarted = cells.length > 0;
  const progress = user ? progressQuery.data ?? guestProgress : guestProgress;
  const placedLabel = `${cells.length.toString().padStart(2, "0")} / 11`;

  function persistGuest(nextCells: Cell[], nextProgress = guestProgress) {
    const next = { ...nextProgress, cells: nextCells };
    setGuestProgress(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (user) saveProgressMutation.mutate({ cells: nextCells, elapsed_seconds: elapsedSeconds });
  }

  function toggleCell(row: number, col: number) {
    const clicked = { row, col };
    const nextCells = cells.some((cell) => sameCell(cell, clicked))
      ? cells.filter((cell) => !sameCell(cell, clicked))
      : cells.length >= 11
        ? cells
        : [...cells, clicked];
    if (nextCells.length === cells.length && !cells.some((cell) => sameCell(cell, clicked))) {
      toast.info("All 11 queens are placed. Validate or reset to keep exploring.");
      return;
    }
    if (!startedAt && nextCells.length > 0) setStartedAt(Date.now());
    setHintCell(null);
    setIsSolved(false);
    setCells(nextCells);
    persistGuest(nextCells);
  }

  function resetBoard() {
    setCells([]);
    setHintCell(null);
    setElapsedSeconds(0);
    setStartedAt(null);
    setIsSolved(false);
    persistGuest([]);
    toast.info("Fresh board. Place your first queen when ready.");
  }

  function validateBoard() {
    if (conflicts.size > 0) {
      toast.error("There are attacking queens. Red squares show the collisions.");
      return;
    }
    if (cells.length !== SIZE) {
      toast.info(`${SIZE - cells.length} more queen${SIZE - cells.length === 1 ? "" : "s"} to place.`);
      return;
    }
    if (user) {
      completeMutation.mutate({ cells, elapsed_seconds: elapsedSeconds });
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const history = guestProgress.history.some((entry) => entry.date === today)
        ? guestProgress.history
        : [...guestProgress.history, { date: today, elapsed_seconds: elapsedSeconds, moves: 11 }].slice(-20);
      const nextProgress = {
        ...guestProgress,
        cells: [],
        current_streak: history.length,
        best_streak: Math.max(guestProgress.best_streak, history.length),
        solved_count: history.length,
        history,
      };
      setGuestProgress(nextProgress);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress));
      setIsSolved(true);
      setStartedAt(null);
      toast.success("Solved. Create an account to carry this streak anywhere.");
    }
  }

  function revealHint() {
    hintMutation.mutate({ cells, elapsed_seconds: elapsedSeconds });
  }

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("queen-puzzle-theme", next ? "dark" : "light");
  }

  function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    authMutation.mutate();
  }

  return (
    <div className="min-h-svh bg-background text-foreground selection:bg-[#d4af37]/30">
      <Toaster />
      <header className="sticky top-0 z-40 border-b border-[#c59b27]/30 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3" data-testid="brand-lockup">
            <div className="brass-mark" aria-hidden="true"><Crown size={20} strokeWidth={1.8} /></div>
            <div>
              <div className="font-serif text-xl font-semibold tracking-tight" data-testid="brand-name">The Queen's Table</div>
              <div className="eyebrow hidden sm:block" data-testid="brand-subtitle">An 11 × 11 study in patience</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {teamName && (
              <div className="flex items-center gap-1.5" data-testid="team-lockup">
                <Badge
                  variant="outline"
                  className="border-amber-500/60 bg-amber-500/15 text-amber-300 font-medium px-2.5 py-1 text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  data-testid="team-header-badge"
                >
                  <Users size={13} className="text-amber-400" />
                  <span className="hidden sm:inline text-neutral-400 font-normal">Team:</span>
                  <span className="font-semibold text-white tracking-wide">{teamName}</span>
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoutTeam}
                  className="h-7 text-xs border-amber-500/40 text-neutral-300 hover:text-amber-300 hover:border-amber-400/80 hover:bg-amber-500/10 px-2 sm:px-2.5"
                  data-testid="logout-team-button"
                  title="Logout / Change team"
                >
                  <LogOut size={12} className="sm:mr-1 text-amber-400" />
                  <span className="hidden sm:inline">Logout / Change team</span>
                  <span className="sm:hidden">Change</span>
                </Button>
              </div>
            )}
            <Badge variant="outline" className="hidden border-[#c59b27]/50 bg-[#c59b27]/10 px-3 py-1 text-[#866b18] sm:inline-flex" data-testid="queen-count-badge">
              <Crown size={13} /> {placedLabel} queens
            </Badge>
            <Badge variant="outline" className="border-[#c59b27]/50 bg-[#c59b27]/10 px-3 py-1 text-[#866b18]" data-testid="streak-counter">
              <Sparkles size={13} /> {progress.current_streak} streak
            </Badge>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" data-testid="theme-toggle-button">
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </Button>
            {user ? (
              <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending} data-testid="sign-out-button">
                <LogOut size={15} /> <span className="hidden sm:inline">Sign out</span>
              </Button>
            ) : (
              <Button size="sm" onClick={() => setAuthOpen((open) => !open)} data-testid="sign-in-button">
                <LogIn size={15} /> <span className="hidden sm:inline">Sign in</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {authOpen && !user && (
        <div className="absolute right-4 top-[76px] z-50 w-[min(380px,calc(100vw-2rem))]" data-testid="auth-panel">
          <Card className="border-[#c59b27]/30 bg-card/95 shadow-2xl backdrop-blur-xl">
            <CardHeader className="border-b border-border/70">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="font-serif text-2xl" data-testid="auth-panel-title">{authMode === "login" ? "Welcome back" : "Keep your streak"}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground" data-testid="auth-panel-description">Sync your board and solved history across sessions.</p>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => setAuthOpen(false)} aria-label="Close sign in" data-testid="close-auth-button"><X size={16} /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <form onSubmit={submitAuth} className="space-y-3" data-testid="auth-form">
                {authMode === "register" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-name">Name</Label>
                    <Input id="auth-name" value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="Your name" required data-testid="auth-name-input" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="auth-email">Email</Label>
                  <Input id="auth-email" type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" required data-testid="auth-email-input" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="auth-password">Password</Label>
                  <Input id="auth-password" type="password" minLength={6} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="At least 6 characters" required data-testid="auth-password-input" />
                </div>
                <Button type="submit" className="w-full" disabled={authMutation.isPending} data-testid="auth-submit-button">
                  {authMutation.isPending ? "Connecting…" : authMode === "login" ? "Sign in to sync" : "Create account"}
                </Button>
              </form>
              <button className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} data-testid="auth-mode-toggle-button">
                {authMode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:pt-12">
        <div className="mb-10 max-w-3xl" data-testid="hero-copy">
          <div className="eyebrow mb-3 flex items-center gap-2" data-testid="hero-eyebrow"><span className="h-px w-8 bg-[#c59b27]" /> Free play · 11 queens</div>
          <h1 className="font-serif text-4xl font-semibold leading-[0.98] tracking-tight sm:text-6xl" data-testid="hero-title">Find room for every queen.</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg" data-testid="hero-description">Place eleven queens so no two can see one another. The board will answer in real time — no timer pressure, just a quiet contest between instinct and geometry.</p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-12">
          <aside className="order-2 space-y-5 lg:col-span-3 lg:order-1">
            <Card className="panel-card" data-testid="control-panel">
              <CardHeader>
                <div className="eyebrow" data-testid="control-eyebrow">Your instrument</div>
                <CardTitle className="font-serif text-2xl" data-testid="control-title">Make a move</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="h-11 w-full justify-between bg-[#1a1918] px-4 text-[#f8f6f0] hover:bg-[#34302a] dark:bg-[#f3efe6] dark:text-[#1a1918] dark:hover:bg-white" onClick={validateBoard} disabled={completeMutation.isPending} data-testid="validate-button">
                  <span className="flex items-center gap-2"><Check size={16} /> Validate board</span><ChevronRight size={16} />
                </Button>
                <Button variant="outline" className="h-11 w-full justify-between border-[#c59b27]/50" onClick={revealHint} disabled={hintMutation.isPending || cells.length >= 11} data-testid="hint-button">
                  <span className="flex items-center gap-2"><Lightbulb size={16} /> Reveal a hint</span><span className="eyebrow text-[#a17d16]">{cells.length >= 11 ? "FULL" : "SAFE"}</span>
                </Button>
                <Button variant="ghost" className="h-11 w-full justify-between text-muted-foreground hover:text-foreground" onClick={resetBoard} data-testid="reset-button">
                  <span className="flex items-center gap-2"><RotateCcw size={16} /> Reset board</span><span className="eyebrow">CLEAR</span>
                </Button>
              </CardContent>
            </Card>
            <Card className="panel-card overflow-visible" data-testid="status-panel">
              <CardContent className="space-y-5 pt-6">
                <div className="flex items-center justify-between" data-testid="timer-stat">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 size={15} /> Time</span>
                  <span className="font-mono text-xl font-bold" data-testid="timer-value">{formatTime(elapsedSeconds)}</span>
                </div>
                <div className="flex items-center justify-between" data-testid="placed-stat">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground"><Crown size={15} /> On the board</span>
                  <span className="font-mono text-xl font-bold" data-testid="placed-value">{cells.length}<span className="text-muted-foreground">/11</span></span>
                </div>
                <div className="border-t border-border/70 pt-4 text-sm text-muted-foreground" data-testid="board-status-copy">
                  {conflicts.size > 0 ? <span className="flex items-center gap-2 text-[#b53b32]"><TriangleAlert size={15} /> {conflicts.size} queen conflict{conflicts.size === 1 ? "" : "s"}</span> : hasStarted ? <span className="flex items-center gap-2 text-[#2b8062]"><ShieldCheck size={15} /> No attacks detected</span> : "The board is waiting for its first queen."}
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="order-1 lg:col-span-6 lg:order-2" aria-label="11 by 11 queen board">
            <div className={`board-frame ${hasStarted ? "board-active" : ""} ${isSolved ? "board-solved" : ""}`} data-testid="board-frame">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <div className="eyebrow" data-testid="board-eyebrow">The live board</div>
                  <h2 className="mt-1 font-serif text-2xl font-semibold sm:text-3xl" data-testid="board-title">Eleven by eleven</h2>
                </div>
                <div className="text-right font-mono text-[10px] tracking-[0.18em] text-muted-foreground" data-testid="board-coordinate-note">A — K<br />01 — 11</div>
              </div>
              <div className="board-shell" data-testid="queen-board">
                <div className="board-grid" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}>
                  {Array.from({ length: SIZE * SIZE }, (_, index) => {
                    const row = Math.floor(index / SIZE);
                    const col = index % SIZE;
                    const cell = { row, col };
                    const hasQueen = cells.some((placed) => sameCell(placed, cell));
                    const isConflict = conflicts.has(`${row}-${col}`);
                    const isHint = hintCell ? sameCell(hintCell, cell) : false;
                    return (
                      <button
                        key={`${row}-${col}`}
                        type="button"
                        aria-label={`Square ${String.fromCharCode(65 + col)}${row + 1}, ${hasQueen ? "Queen placed" : "Empty"}${isConflict ? ", conflict detected" : ""}`}
                        className={`board-square ${(row + col) % 2 === 0 ? "board-light" : "board-dark"} ${hasStarted ? "board-square-active" : ""} ${hasQueen ? "board-square-queen" : ""} ${isConflict ? "board-square-conflict" : ""} ${isHint ? "board-square-hint" : ""}`}
                        onClick={() => toggleCell(row, col)}
                        data-testid={`board-square-${row}-${col}`}
                      >
                        {hasQueen && <Crown className="queen-glyph" aria-hidden="true" />}
                        {isHint && !hasQueen && <span className="hint-dot" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground" data-testid="board-footer">
                <span>Click a square to place · click again to remove</span>
                <span className="hidden font-mono sm:inline">{cells.length === 0 ? "PRISTINE" : "ACTIVE MATCH"}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground" data-testid="board-live-announcement" aria-live="polite">
              {isSolved ? <><Sparkles size={15} className="text-[#c59b27]" /> Solved with a {progress.current_streak}-puzzle streak</> : conflicts.size > 0 ? <><TriangleAlert size={15} className="text-[#b53b32]" /> A queen is seeing another queen</> : hasStarted ? <><ShieldCheck size={15} className="text-[#2b8062]" /> The arrangement is currently safe</> : "Your next move changes the board's rhythm."}
            </div>
          </section>

          <aside className="order-3 space-y-5 lg:col-span-3">
            <Card className="panel-card" data-testid="cloud-panel">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="eyebrow" data-testid="cloud-eyebrow">Progress ledger</div>
                  <Cloud size={17} className={user ? "text-[#2b8062]" : "text-muted-foreground"} />
                </div>
                <CardTitle className="font-serif text-2xl" data-testid="cloud-title">{user ? "Cloud save on" : "Playing as guest"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground" data-testid="cloud-description">{user ? `Signed in as ${user.name}. Your board and history follow you.` : "Your board is saved on this device. Sign in whenever you want to keep your ledger."}</p>
                {!user && <Button variant="outline" className="mt-4 w-full justify-between border-[#c59b27]/50" onClick={() => setAuthOpen(true)} data-testid="open-cloud-save-button"><span className="flex items-center gap-2"><LockKeyhole size={15} /> Save to the cloud</span><ChevronRight size={15} /></Button>}
                {user && <div className="mt-4 flex items-center gap-2 text-xs text-[#2b8062]" data-testid="cloud-sync-status"><ShieldCheck size={14} /> Synced to your account</div>}
              </CardContent>
            </Card>
            <Card className="panel-card" data-testid="history-panel">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="eyebrow" data-testid="history-eyebrow">The ledger</div>
                  <History size={17} className="text-muted-foreground" />
                </div>
                <CardTitle className="font-serif text-2xl" data-testid="history-title">Solved history</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-5 grid grid-cols-2 gap-3">
                  <div className="stat-tile" data-testid="solved-count-stat"><div className="eyebrow">Solved</div><div className="mt-1 font-mono text-2xl font-bold">{progress.solved_count}</div></div>
                  <div className="stat-tile" data-testid="best-streak-stat"><div className="eyebrow">Best run</div><div className="mt-1 font-mono text-2xl font-bold">{progress.best_streak}</div></div>
                </div>
                {progress.history.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm leading-relaxed text-muted-foreground" data-testid="empty-history-copy">Your first solved board will appear here.</div>
                ) : (
                  <div className="space-y-2" data-testid="history-list">
                    {progress.history.slice(-3).reverse().map((entry) => (
                      <div className="flex items-center justify-between border-b border-border/60 pb-2 text-sm last:border-0 last:pb-0" key={`${entry.date}-${entry.elapsed_seconds}`} data-testid={`history-entry-${entry.date}`}>
                        <span className="font-mono text-xs text-muted-foreground">{entry.date}</span><span className="font-mono">{formatTime(entry.elapsed_seconds)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="flex items-center gap-2 px-1 text-xs leading-relaxed text-muted-foreground" data-testid="privacy-note"><UserRound size={14} /> No account? Guest progress stays in your browser.</div>
          </aside>
        </div>
      </main>
    </div>
  );
}