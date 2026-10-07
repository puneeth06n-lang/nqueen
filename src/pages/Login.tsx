import React, { useState, useId, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTeam } from "@/context/TeamContext";
import { Crown, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

/**
 * Validates a team name according to challenge requirements:
 * - Required, trimmed
 * - Length: 2 to 30 characters
 * - Characters allowed: letters, numbers, spaces, underscores, hyphens only
 */
function validateTeamName(raw: string): { isValid: boolean; error: string | null } {
  const trimmed = raw.trim();

  if (!raw || trimmed.length === 0) {
    return { isValid: false, error: "Team name is required." };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: "Team name must be at least 2 characters long." };
  }

  if (trimmed.length > 30) {
    return { isValid: false, error: "Team name cannot exceed 30 characters." };
  }

  // Allow letters (including international/latin), digits, spaces, underscores, and hyphens
  const validPattern = /^[a-zA-Z0-9_\- ]+$/;
  if (!validPattern.test(trimmed)) {
    return {
      isValid: false,
      error: "Only letters, numbers, spaces, underscores (_), and hyphens (-) are allowed.",
    };
  }

  return { isValid: true, error: null };
}

export default function Login() {
  const { teamName, loginTeam } = useTeam();
  const navigate = useNavigate();
  const inputId = useId();

  const [name, setName] = useState(teamName || "");
  const [isTouched, setIsTouched] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // If already logged in, allow them to jump straight to the challenge or change team name
  useEffect(() => {
    if (teamName) {
      setName(teamName);
    }
  }, [teamName]);

  const { isValid, error } = validateTeamName(name);
  const showError = (isTouched || isSubmitted) && !isValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    if (!isValid) return;

    const cleanName = name.trim();
    loginTeam(cleanName);
    navigate("/game");
  };

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none"
      style={{
        backgroundImage: "url('/login-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: "'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Dark semi-transparent overlay for text legibility and cinematic atmosphere */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[3px] transition-all" />

      {/* Decorative ambient radial glow accents */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />

      {/* Main Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
        <div className="relative rounded-2xl border border-amber-500/30 bg-[#0d1117]/80 p-7 sm:p-9 shadow-[0_0_50px_rgba(0,0,0,0.85),0_0_25px_rgba(212,175,55,0.18)] backdrop-blur-2xl transition-all hover:border-amber-500/40">
          
          {/* Top Emblem & Badge */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3 flex items-center justify-center">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-500/30 to-amber-300/30 blur-md animate-pulse" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-400/20 via-black/60 to-black/90 shadow-inner">
                {/* Chess-queen icon / emoji (♛) */}
                <span className="text-3xl text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" aria-hidden="true">
                  ♛
                </span>
              </div>
            </div>

            {/* Club Event Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-[11px] font-semibold tracking-wider text-amber-300 uppercase mb-2">
              <Sparkles size={12} className="text-amber-400" />
              AI Avengers Club • Tech Challenge
            </div>

            {/* Page Title & Subtitle */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
              N-Queens Challenge
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-neutral-300/80 leading-relaxed max-w-xs">
              Place 11 queens. No two can attack each other.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={inputId}
                  className="text-xs font-semibold uppercase tracking-wider text-neutral-300"
                >
                  Team Name <span className="text-amber-400">*</span>
                </label>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {name.trim().length}/30
                </span>
              </div>

              <div className="relative">
                <input
                  id={inputId}
                  type="text"
                  autoComplete="off"
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!isTouched) setIsTouched(true);
                  }}
                  onBlur={() => setIsTouched(true)}
                  placeholder="e.g. CyberKnights or Turing-11"
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-white placeholder-neutral-500 bg-neutral-900/70 transition-all duration-200 outline-none
                    ${
                      showError
                        ? "border-rose-500/80 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                        : "border-neutral-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 focus:shadow-[0_0_20px_rgba(251,191,36,0.25)] hover:border-neutral-600"
                    }`}
                />
              </div>

              {/* Inline error message */}
              {showError && (
                <div
                  className="flex items-center gap-1.5 text-xs text-rose-400 animate-in fade-in slide-in-from-top-1 duration-200 pt-0.5"
                  role="alert"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Subtle Helper info */}
              {!showError && (
                <p className="text-[11px] text-neutral-400/80">
                  2-30 characters: letters, numbers, spaces, hyphens, and underscores only.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValid}
              className={`group relative w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-5 text-sm font-semibold tracking-wide transition-all duration-300
                ${
                  isValid
                    ? "cursor-pointer bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-neutral-950 font-bold shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.65)] hover:brightness-105 active:scale-[0.99]"
                    : "cursor-not-allowed bg-neutral-800/80 text-neutral-500 border border-neutral-700/40 opacity-70"
                }`}
            >
              <span>Start Challenge</span>
              <ArrowRight
                size={16}
                className={`transition-transform duration-200 ${isValid ? "group-hover:translate-x-1" : ""}`}
              />
            </button>
          </form>

          {/* Quick Active Session Notice if returning */}
          {teamName && (
            <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
                <ShieldCheck size={14} /> Active Team: {teamName}
              </span>
              <button
                type="button"
                onClick={() => navigate("/game")}
                className="text-amber-400 hover:text-amber-300 underline font-medium transition-colors"
              >
                Resume &rarr;
              </button>
            </div>
          )}

          {/* Bottom Footer Note */}
          <div className="mt-6 text-center">
            <span className="text-[11px] text-neutral-400/80 font-mono tracking-wider">
              11×11 GRID • NO ROW, COL, OR DIAGONAL ATTACKS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
