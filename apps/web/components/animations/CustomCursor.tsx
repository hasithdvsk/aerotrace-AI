"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import { useLenis } from "lenis/react";
import {
  Navigation,
  Satellite,
  Flame,
  HeartPulse,
  Eye,
  Sparkles,
} from "lucide-react";

/**
 * Configuration presets for contextual glass badge morphing
 */
const CONTEXT_BADGE_PRESETS: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    borderColor: string;
    glowClass: string;
    bgClass: string;
    textColor: string;
  }
> = {
  NAVIGATE: {
    icon: Navigation,
    accentColor: "#22d3ee",
    borderColor: "border-cyan-400/70",
    glowClass: "shadow-[0_0_24px_rgba(34,211,238,0.45)]",
    bgClass: "bg-slate-950/85",
    textColor: "text-cyan-300",
  },
  INSPECT: {
    icon: Satellite,
    accentColor: "#a78bfa",
    borderColor: "border-violet-400/70",
    glowClass: "shadow-[0_0_24px_rgba(167,139,250,0.45)]",
    bgClass: "bg-obsidian-950/85",
    textColor: "text-violet-300",
  },
  DOSAGE: {
    icon: HeartPulse,
    accentColor: "#34d399",
    borderColor: "border-emerald-400/70",
    glowClass: "shadow-[0_0_24px_rgba(52,211,153,0.45)]",
    bgClass: "bg-emerald-950/80",
    textColor: "text-emerald-300",
  },
  ALERT: {
    icon: Flame,
    accentColor: "#f43f5e",
    borderColor: "border-rose-500/80",
    glowClass: "shadow-[0_0_26px_rgba(244,63,94,0.55)]",
    bgClass: "bg-rose-950/85",
    textColor: "text-rose-300",
  },
  VIEW: {
    icon: Eye,
    accentColor: "#38bdf8",
    borderColor: "border-sky-400/70",
    glowClass: "shadow-[0_0_24px_rgba(56,189,248,0.45)]",
    bgClass: "bg-slate-950/85",
    textColor: "text-sky-300",
  },
};

const DEFAULT_PRESET = {
  icon: Sparkles,
  accentColor: "#10b981",
  borderColor: "border-emerald-400/60",
  glowClass: "shadow-[0_0_20px_rgba(16,185,129,0.35)]",
  bgClass: "bg-obsidian-950/85",
  textColor: "text-emerald-300",
};

/**
 * Creative Custom Smooth Follower Cursor
 *
 * Features:
 * - High-precision lead dot tracking instantaneous mouse coordinates (zero lag)
 * - Spring-smoothed follower ring with organic inertia physics
 * - Lenis-synchronized scroll-direction sensing with dynamic rotation tilt transitions (up/down)
 * - Context morphing badge triggered by [data-cursor="LABEL"] attributes
 * - Automatic hover state detection for interactive elements (buttons, links, inputs)
 * - Desktop-only activation with fine pointer media query support
 */
export default function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [isInteractiveHover, setIsInteractiveHover] = useState(false);
  const [cursorText, setCursorText] = useState<string | null>(null);

  // High-precision mouse coordinates for the lead dot
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth spring physics for follower ring
  const followerSpringConfig = { damping: 26, stiffness: 320, mass: 0.55 };
  const followerX = useSpring(mouseX, followerSpringConfig);
  const followerY = useSpring(mouseY, followerSpringConfig);

  // Dynamic scroll-direction tilt angle with smooth spring easing
  const tiltAngle = useMotionValue(0);
  const tiltSpring = useSpring(tiltAngle, { damping: 18, stiffness: 240 });
  const tiltTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Smoothly decay tilt to 0 after scrolling pauses
  const scheduleTiltReset = useCallback(() => {
    if (tiltTimerRef.current) clearTimeout(tiltTimerRef.current);
    tiltTimerRef.current = setTimeout(() => {
      tiltAngle.set(0);
    }, 150);
  }, [tiltAngle]);

  // Hook into Lenis scroll listener for 60fps direction and velocity sensing
  useLenis((lenis) => {
    if (!lenis) return;
    const dir = lenis.direction; // 1 = down, -1 = up, 0 = idle
    const velocity = lenis.velocity || 0;

    if (dir === 1 || velocity > 0.1) {
      // Scrolling down -> dynamic tilt forward/down (+14deg with velocity boost)
      const targetTilt = Math.min(12 + Math.abs(velocity) * 1.5, 24);
      tiltAngle.set(targetTilt);
      scheduleTiltReset();
    } else if (dir === -1 || velocity < -0.1) {
      // Scrolling up -> dynamic tilt backward/up (-14deg with velocity boost)
      const targetTilt = -Math.min(12 + Math.abs(velocity) * 1.5, 24);
      tiltAngle.set(targetTilt);
      scheduleTiltReset();
    }
  });

  // Native window scroll fallback to guarantee tilt sensing in all environments
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleWindowScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (Math.abs(delta) > 1.5) {
        const targetTilt = delta > 0 ? 12 : -12;
        tiltAngle.set(targetTilt);
        scheduleTiltReset();
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
      if (tiltTimerRef.current) clearTimeout(tiltTimerRef.current);
    };
  }, [tiltAngle, scheduleTiltReset]);

  // Check desktop screen size and fine pointer capability
  useEffect(() => {
    setMounted(true);

    const checkDevice = () => {
      const isFinePointer = window.matchMedia("(pointer: fine)").matches;
      const isDesktopWidth = window.innerWidth >= 768;
      setIsDesktop(isFinePointer && isDesktopWidth);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Global mouse event listeners for coordinates, context morphing, and clicks
  useEffect(() => {
    if (!isDesktop) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Detect [data-cursor] attribute on target or any ancestor element
      const contextEl = target.closest<HTMLElement>("[data-cursor]");
      if (contextEl) {
        const label = contextEl.getAttribute("data-cursor");
        if (label && label.trim().length > 0) {
          setCursorText(label.trim());
          setIsInteractiveHover(true);
          return;
        }
      }

      setCursorText(null);

      // Detect standard interactive elements
      const isInteractive = Boolean(
        target.closest(
          "button, a, input, select, textarea, [role='button'], [tabindex='0']"
        )
      );
      setIsInteractiveHover(isInteractive);
    };

    const handleMouseDown = () => setIsPointerDown(true);
    const handleMouseUp = () => setIsPointerDown(false);

    const handleMouseLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        setIsVisible(false);
      }
    };

    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [isDesktop, isVisible, mouseX, mouseY]);

  // Render nothing on SSR or on mobile/touch devices
  if (!mounted || !isDesktop) return null;

  // Resolve current context theme preset
  const activePresetKey = cursorText ? cursorText.toUpperCase() : null;
  const currentPreset = activePresetKey
    ? CONTEXT_BADGE_PRESETS[activePresetKey] || DEFAULT_PRESET
    : DEFAULT_PRESET;
  const IconComponent = currentPreset.icon;

  const isMorphActive = Boolean(cursorText);

  return (
    <>
      {/* 1. High-Precision Lead Dot (Direct 0-latency tracking) */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[999999] select-none"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: !isVisible ? 0 : isMorphActive ? 0 : isPointerDown ? 0.6 : 1,
          opacity: isVisible && !isMorphActive ? 1 : 0,
        }}
        transition={{
          scale: { type: "spring", stiffness: 400, damping: 25 },
          opacity: { duration: 0.15 },
        }}
      >
        <div className="relative flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
          {/* Subtle micro ping ring */}
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400/40 animate-ping" />
        </div>
      </motion.div>

      {/* 2. Spring-Smoothed Follower Ring & Context Glass Morphing Badge */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[999998] select-none flex items-center justify-center"
        style={{
          x: followerX,
          y: followerY,
          translateX: "-50%",
          translateY: "-50%",
          rotate: tiltSpring,
        }}
        animate={{
          scale: !isVisible ? 0 : isPointerDown ? 0.9 : 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          scale: { type: "spring", stiffness: 350, damping: 22 },
          opacity: { duration: 0.18 },
        }}
      >
        <AnimatePresence mode="wait">
          {isMorphActive ? (
            /* Context Morphing Glass Badge */
            <motion.div
              key={`badge-${cursorText}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 24,
                mass: 0.6,
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-xl border ${currentPreset.borderColor} ${currentPreset.bgClass} ${currentPreset.glowClass} shadow-2xl`}
            >
              <div
                className="w-1.5 h-1.5 rounded-full animate-ping"
                style={{ backgroundColor: currentPreset.accentColor }}
              />
              <IconComponent className={`h-3 w-3 ${currentPreset.textColor}`} />
              <span
                className={`text-[10px] font-mono font-black tracking-widest uppercase ${currentPreset.textColor}`}
              >
                {cursorText}
              </span>
            </motion.div>
          ) : isInteractiveHover ? (
            /* Interactive Hover Subtle Expansion Ring */
            <motion.div
              key="interactive-ring"
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 1.35, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 20,
              }}
              className="w-11 h-11 rounded-full border border-cyan-400/80 bg-cyan-500/10 backdrop-blur-[2px] shadow-[0_0_18px_rgba(34,211,238,0.4)] flex items-center justify-center"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
            </motion.div>
          ) : (
            /* Default Sleek Follower Ring */
            <motion.div
              key="default-ring"
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 22,
              }}
              className="w-9 h-9 rounded-full border border-emerald-400/50 bg-emerald-500/5 backdrop-blur-[1px] shadow-[0_0_14px_rgba(16,185,129,0.22)]"
            />
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
