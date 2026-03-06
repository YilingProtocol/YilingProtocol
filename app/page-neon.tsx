"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useInView,
} from "framer-motion";
import FloatingDice from "./components/Dice3D";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Code2,
  Cpu,
  Dices,
  ExternalLink,
  FileText,
  Github,
  Globe,
  LineChart,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

// ─── Animations ─────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};
const slideLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
};
const slideRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

// ─── Decorative Elements ────────────────────────────────────────────────────

function GlowOrb({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={`absolute rounded-full pointer-events-none ${className}`} style={style} />;
}

function MouseGlow() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 25, damping: 18 });
  const sy = useSpring(y, { stiffness: 25, damping: 18 });
  useEffect(() => {
    const h = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, [x, y]);
  return (
    <motion.div
      className="fixed w-[700px] h-[700px] rounded-full pointer-events-none z-0"
      style={{
        x: sx, y: sy, translateX: "-50%", translateY: "-50%",
        background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, rgba(168,85,247,0.04) 30%, transparent 65%)",
      }}
    />
  );
}

// ─── Animated Mesh Blob ─────────────────────────────────────────────────────

function MeshBlob() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] pointer-events-none">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: "conic-gradient(from 0deg, #00d4ff, #a855f7, #ec4899, #00d4ff)",
          filter: "blur(100px)",
          animation: "mesh-rotate 20s linear infinite, mesh-morph 15s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-[15%] opacity-20"
        style={{
          background: "conic-gradient(from 180deg, #a855f7, #00d4ff, #ec4899, #a855f7)",
          filter: "blur(80px)",
          animation: "mesh-rotate 25s linear infinite reverse, mesh-morph 12s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}

// ─── Pixel Grid Decoration ──────────────────────────────────────────────────

// Seeded pseudo-random for deterministic SSR/client output
function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function PixelGrid({ className, seed = 1 }: { className?: string; seed?: number }) {
  const pixels = useMemo(() => {
    const rand = seededRandom(seed);
    const result: { x: number; y: number; delay: number; color: string; dur: number }[] = [];
    const colors = ["#00d4ff", "#a855f7", "#ec4899"];
    for (let i = 0; i < 24; i++) {
      result.push({
        x: Math.floor(rand() * 8) * 12,
        y: Math.floor(rand() * 8) * 12,
        delay: Math.round(rand() * 400) / 100,
        dur: Math.round((200 + rand() * 300)) / 100,
        color: colors[Math.floor(rand() * colors.length)],
      });
    }
    return result;
  }, [seed]);

  return (
    <div className={`pointer-events-none ${className || ""}`}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        {pixels.map((p, i) => (
          <rect
            key={i}
            x={p.x} y={p.y}
            width="8" height="8"
            fill={p.color}
            opacity="0.2"
            style={{ animation: `pixel-fade ${p.dur}s ease-in-out ${p.delay}s infinite` }}
          />
        ))}
      </svg>
    </div>
  );
}

// ─── Marquee Band ───────────────────────────────────────────────────────────

function MarqueeBand({ items, reverse, className }: { items: string[]; reverse?: boolean; className?: string }) {
  const content = items.join(" \u00B7 ") + " \u00B7 ";
  return (
    <div className={`overflow-hidden border-y border-border/50 ${className || ""}`}>
      <div
        className="marquee-track whitespace-nowrap py-3.5 text-[13px] font-mono uppercase tracking-[0.2em] text-text-muted/60"
        style={{ animationDirection: reverse ? "reverse" : "normal", animationDuration: "40s" }}
      >
        <span>{content}</span>
        <span>{content}</span>
      </div>
    </div>
  );
}

// ─── Section Divider ────────────────────────────────────────────────────────

function SectionDivider() {
  return <div className="section-divider mx-auto max-w-4xl" />;
}

// ─── Counter ────────────────────────────────────────────────────────────────

function Counter({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) { setCount(0); return; }
    let c = 0;
    const s = Math.ceil(value / 30);
    const t = setInterval(() => { c += s; if (c >= value) { setCount(value); clearInterval(t); } else setCount(c); }, 30);
    return () => clearInterval(t);
  }, [inView, value]);
  return (
    <div ref={ref} className="text-center">
      <span className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight tabular-nums text-gradient">{count}{suffix}</span>
      <p className="text-[12px] text-text-muted mt-2 tracking-[0.15em] uppercase font-medium">{label}</p>
    </div>
  );
}

// ─── Navigation ─────────────────────────────────────────────────────────────

function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "border-b border-border/60 bg-bg/70 backdrop-blur-2xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-[72px]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan to-violet flex items-center justify-center shadow-lg shadow-cyan/25">
            <Dices className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-heading font-bold text-[17px] tracking-tight text-text">Yiling Protocol</span>
        </div>

        <div className="hidden md:flex items-center gap-9 text-[14px] text-text-muted font-medium">
          {["Protocol", "Infrastructure", "Build", "Docs"].map((i) => (
            <a key={i} href={`#${i.toLowerCase()}`} className="hover:text-text transition-colors duration-300 relative group">
              {i}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        <a
          href="#"
          className="hidden sm:flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-[13px] font-semibold transition-all duration-300 relative overflow-hidden group"
          style={{ background: "linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)" }}
        >
          <span className="relative z-10 flex items-center gap-2">
            Launch App <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-violet to-pink opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </a>
      </div>
    </nav>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.7], [0, -80]);
  const scale = useTransform(scrollYProgress, [0, 0.7], [1, 0.95]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Mesh gradient blob */}
      <MeshBlob />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Pixel decorations */}
      <PixelGrid className="absolute top-[15%] left-[8%] opacity-40" seed={42} />
      <PixelGrid className="absolute bottom-[20%] right-[6%] opacity-30" seed={137} />

      <FloatingDice />

      <motion.div style={{ opacity, y, scale }} className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-10">
          <motion.div variants={fadeUp} className="flex justify-center">
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-cyan/20 bg-cyan/[0.06] backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-cyan shadow-[0_0_8px_rgba(0,212,255,0.6)]" />
              <span className="text-cyan text-[13px] font-semibold tracking-wide">Built on Harvard Research</span>
            </div>
          </motion.div>

          <motion.h1 variants={fadeUp} className="font-heading font-extrabold text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] tracking-[-0.04em] leading-[0.95]">
            <span className="text-text">The Self-Resolving</span>
            <br />
            <span className="text-gradient">Truth Layer</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="max-w-lg mx-auto text-[18px] text-text-secondary leading-relaxed">
            Oracle-free prediction markets where truth emerges
            from game theory. Deploy on any chain.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a href="#"
              className="group relative flex items-center gap-3 px-9 py-4 rounded-full text-white text-[15px] font-bold overflow-hidden transition-all duration-300 hover:scale-[1.03]"
              style={{ background: "linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)" }}>
              <span className="relative z-10 flex items-center gap-3">
                Launch App
                <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet to-pink opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan via-violet to-pink opacity-30 blur-xl group-hover:opacity-50 transition-opacity" />
            </a>
            <a href="https://arxiv.org/abs/2306.04305" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-9 py-4 rounded-full glass-card text-text-secondary hover:text-text text-[15px] font-medium transition-all duration-300 hover:border-cyan/20">
              Read the Paper <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center justify-center gap-14 sm:gap-20 pt-12">
            <Counter value={0} label="Oracles Needed" />
            <div className="w-px h-14 bg-gradient-to-b from-transparent via-border-light to-transparent" />
            <Counter value={100} label="EVM Compatible" suffix="%" />
            <div className="w-px h-14 bg-gradient-to-b from-transparent via-border-light to-transparent" />
            <Counter value={100} label="Open Source" suffix="%" />
          </motion.div>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-bg via-bg/80 to-transparent" />
    </section>
  );
}

// ─── Problem ────────────────────────────────────────────────────────────────

function Problem() {
  return (
    <section className="relative py-36 px-6">
      <div className="mx-auto max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, margin: "-80px" }} variants={stagger}
          className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Problem */}
          <motion.div variants={slideLeft}
            className="relative p-10 rounded-3xl glass-card border-rose/10 overflow-hidden group hover:border-rose/20 transition-colors duration-500">
            <GlowOrb className="w-[250px] h-[250px] -top-24 -right-24 bg-rose/[0.15] blur-[80px] group-hover:bg-rose/[0.25] transition-all duration-700" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-rose/[0.12] border border-rose/20">
                <span className="w-2 h-2 rounded-full bg-rose shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                <span className="text-rose text-[13px] font-semibold">The Problem</span>
              </div>
              <h2 className="font-heading font-extrabold text-[28px] sm:text-[32px] leading-[1.1] tracking-tight text-text">
                Oracles are the<br />single point of failure
              </h2>
              <p className="text-text-secondary text-[15px] leading-[1.7]">
                Every prediction market today depends on an external oracle.
                For subjective or long-horizon questions, no reliable oracle exists.
              </p>
              <div className="flex items-center gap-2.5 pt-2">
                {["Oracle", "Trust", "Centralization"].map((item, i) => (
                  <motion.span key={item} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ delay: 0.3 + i * 0.1 }}
                    className="px-3.5 py-1.5 rounded-lg bg-rose/[0.08] border border-rose/15 text-rose/70 text-[13px] font-medium line-through decoration-rose/40">
                    {item}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Solution */}
          <motion.div variants={slideRight}
            className="relative p-10 rounded-3xl glass-card border-cyan/10 overflow-hidden group hover:border-cyan/20 transition-colors duration-500">
            <GlowOrb className="w-[250px] h-[250px] -top-24 -left-24 bg-cyan/[0.15] blur-[80px] group-hover:bg-cyan/[0.25] transition-all duration-700" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-success/[0.12] border border-success/20">
                <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="text-success text-[13px] font-semibold">The Solution</span>
              </div>
              <h2 className="font-heading font-extrabold text-[28px] sm:text-[32px] leading-[1.1] tracking-tight text-text">
                The market resolves<br /><span className="text-gradient">itself</span>
              </h2>
              <p className="text-text-secondary text-[15px] leading-[1.7]">
                Yiling Protocol implements the <span className="text-text font-semibold">SKC mechanism</span> —
                truth emerges from mathematics.
                Honest reporting is a <span className="text-text font-semibold">Perfect Bayesian Equilibrium</span>.
              </p>
              <div className="flex items-center gap-2.5 pt-2">
                {["Game Theory", "Math", "Autonomous"].map((item, i) => (
                  <motion.span key={item} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ delay: 0.3 + i * 0.1 }}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan/[0.08] border border-cyan/15 text-cyan text-[13px] font-semibold">
                    {item}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Border Beam ────────────────────────────────────────────────────────────

function BorderBeam({ index }: { index: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tailRef = useRef<SVGRectElement>(null);
  const headRef = useRef<SVGRectElement>(null);
  const frameRef = useRef<number>(0);
  const [dims, setDims] = useState({ w: 0, h: 0, perim: 0 });

  useEffect(() => {
    const measure = () => {
      const parent = svgRef.current?.parentElement;
      if (!parent) return;
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      const r = 20;
      const perim = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
      setDims({ w, h, perim });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (dims.perim === 0) return;
    const tail = tailRef.current;
    const head = headRef.current;
    if (!tail || !head) return;

    let offset = 0;
    const speed = 220;
    let lastTime = 0;
    const animate = (time: number) => {
      if (lastTime) {
        const dt = (time - lastTime) / 1000;
        offset = (offset - speed * dt) % dims.perim;
      }
      lastTime = time;
      tail.style.strokeDashoffset = `${offset}`;
      head.style.strokeDashoffset = `${offset}`;
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [dims.perim]);

  if (dims.perim === 0) return <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none" />;

  const headLen = dims.perim * 0.08;
  const tailLen = dims.perim * 0.18;
  const headGap = dims.perim - headLen;
  const tailGap = dims.perim - tailLen;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
    >
      <rect ref={tailRef} x="1" y="1" width={dims.w - 2} height={dims.h - 2} rx="20" ry="20"
        fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray={`${tailLen} ${tailGap}`} strokeLinecap="round"
        opacity="0.35" style={{ filter: "drop-shadow(0 0 10px rgba(168,85,247,0.4))" }} />
      <rect ref={headRef} x="1" y="1" width={dims.w - 2} height={dims.h - 2} rx="20" ry="20"
        fill="none" stroke="#00d4ff" strokeWidth="2.5" strokeDasharray={`${headLen} ${headGap}`} strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 8px rgba(0,212,255,0.8)) drop-shadow(0 0 16px rgba(168,85,247,0.5))" }} />
    </svg>
  );
}

// ─── How It Works (System Diagram) ──────────────────────────────────────────

const colorStyles = {
  cyan: { iconBg: "rgba(0,212,255,0.1)", iconBorder: "rgba(0,212,255,0.2)", iconColor: "#00d4ff" },
  violet: { iconBg: "rgba(168,85,247,0.1)", iconBorder: "rgba(168,85,247,0.2)", iconColor: "#a855f7" },
  pink: { iconBg: "rgba(236,72,153,0.1)", iconBorder: "rgba(236,72,153,0.2)", iconColor: "#ec4899" },
  success: { iconBg: "rgba(16,185,129,0.1)", iconBorder: "rgba(16,185,129,0.2)", iconColor: "#10b981" },
};

// Animated pulse dot traveling along a path
function PulseDot({ color, duration, delay, vertical }: { color: string; duration: number; delay: number; vertical?: boolean }) {
  return (
    <motion.div
      className="absolute rounded-full z-20"
      style={{
        width: 6, height: 6,
        backgroundColor: color,
        boxShadow: `0 0 8px ${color}, 0 0 16px ${color}60`,
      }}
      animate={vertical
        ? { top: ["-6px", "calc(100% + 6px)"], left: "50%", x: "-50%" }
        : { left: ["-6px", "calc(100% + 6px)"], top: "50%", y: "-50%" }
      }
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    />
  );
}

// Neon-bordered module box (like Hyperlane's system components)
function DiagramModule({ label, icon: Icon, color, number, desc, className = "" }: {
  label: string; icon: React.ElementType; color: string; number: string; desc?: string; className?: string;
}) {
  const borderColor = color === "#00d4ff" ? "rgba(0,212,255,0.3)" :
                      color === "#a855f7" ? "rgba(168,85,247,0.3)" :
                      color === "#ec4899" ? "rgba(236,72,153,0.3)" : "rgba(16,185,129,0.3)";
  const bgColor = color === "#00d4ff" ? "rgba(0,212,255,0.04)" :
                  color === "#a855f7" ? "rgba(168,85,247,0.04)" :
                  color === "#ec4899" ? "rgba(236,72,153,0.04)" : "rgba(16,185,129,0.04)";
  const glowColor = color === "#00d4ff" ? "rgba(0,212,255,0.08)" :
                    color === "#a855f7" ? "rgba(168,85,247,0.08)" :
                    color === "#ec4899" ? "rgba(236,72,153,0.08)" : "rgba(16,185,129,0.08)";

  return (
    <div className={`relative group ${className}`}>
      {/* Number label */}
      <span className="absolute -top-3 -right-1 font-mono text-[10px] font-bold z-10"
        style={{ color: `${color}50` }}>{number}</span>

      <div className="relative rounded-2xl p-5 transition-all duration-500 hover:scale-[1.03]" style={{
        border: `1px solid ${borderColor}`,
        background: `linear-gradient(135deg, ${bgColor} 0%, rgba(5,5,16,0.8) 100%)`,
        backdropFilter: "blur(12px)",
        boxShadow: `0 0 30px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}>
        {/* Inner top glow line */}
        <div className="absolute top-0 left-4 right-4 h-px" style={{
          background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
        }} />

        <div className="flex items-center gap-3 mb-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{
            background: `${color}15`, border: `1px solid ${color}25`,
          }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <span className="font-heading font-bold text-[13px] uppercase tracking-[0.08em] text-text">{label}</span>
        </div>
        {desc && <p className="text-text-muted text-[12px] leading-[1.6] pl-12">{desc}</p>}
      </div>
    </div>
  );
}

// The central processing block with schematic internal pattern
function CoreProcessor({ label, icon: Icon, color, number, desc }: {
  label: string; icon: React.ElementType; color: string; number: string; desc: string;
}) {
  return (
    <div className="relative">
      <span className="absolute -top-3 -right-1 font-mono text-[10px] font-bold z-10"
        style={{ color: `${color}50` }}>{number}</span>

      <div className="relative rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02]" style={{
        border: `1px solid ${color}35`,
        boxShadow: `0 0 40px ${color}12, 0 0 80px ${color}06`,
      }}>
        {/* Schematic pattern background */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(${color}08 1px, transparent 1px),
            linear-gradient(90deg, ${color}08 1px, transparent 1px)
          `,
          backgroundSize: "16px 16px",
        }} />
        <div className="absolute inset-0" style={{
          background: `linear-gradient(135deg, ${color}08 0%, rgba(5,5,16,0.95) 60%, ${color}04 100%)`,
        }} />

        {/* Animated scan line */}
        <motion.div
          className="absolute left-0 right-0 h-px z-10"
          style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }}
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative p-6 z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: `${color}15`, border: `1px solid ${color}30`,
              boxShadow: `0 0 20px ${color}20`,
            }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <span className="font-heading font-bold text-[14px] uppercase tracking-[0.08em] text-text block">{label}</span>
              <span className="font-mono text-[10px]" style={{ color: `${color}60` }}>active</span>
            </div>
          </div>
          <p className="text-text-muted text-[12px] leading-[1.7]">{desc}</p>
        </div>
      </div>
    </div>
  );
}

// Horizontal connector with animated pulse
function HConnector({ color, delay = 0, reverse }: { color: string; delay?: number; reverse?: boolean }) {
  return (
    <div className="relative h-px flex-1 min-w-[24px] self-center overflow-visible">
      <div className="absolute inset-0" style={{
        background: `linear-gradient(90deg, ${color}20, ${color}50, ${color}20)`,
      }} />
      {/* Arrow head */}
      <div className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 ${reverse ? "left-0" : "right-0"}`}
        style={{
          borderTop: "4px solid transparent",
          borderBottom: "4px solid transparent",
          ...(reverse
            ? { borderRight: `6px solid ${color}80` }
            : { borderLeft: `6px solid ${color}80` }),
        }} />
      <motion.div
        className="absolute rounded-full z-20"
        style={{
          width: 6, height: 6,
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}, 0 0 16px ${color}60`,
        }}
        animate={reverse
          ? { right: ["-6px", "calc(100% + 6px)"], top: "50%", y: "-50%" }
          : { left: ["-6px", "calc(100% + 6px)"], top: "50%", y: "-50%" }
        }
        transition={{ duration: 2, delay, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// Vertical connector
function VConnector({ color, delay = 0, className = "" }: { color: string; delay?: number; className?: string }) {
  return (
    <div className={`relative w-0.5 overflow-visible ${className}`} style={{ minHeight: 32 }}>
      <div className="absolute inset-0" style={{
        background: `linear-gradient(180deg, ${color}30, ${color}60, ${color}30)`,
      }} />
      {/* Arrow head at bottom */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: `8px solid ${color}90`,
        }} />
      <PulseDot color={color} duration={1.5} delay={delay} vertical />
    </div>
  );
}

// Matrix-style reveal wrapper
function MatrixReveal({ order, step, children }: { order: number; step: number; children: React.ReactNode }) {
  const visible = step >= order;
  return (
    <motion.div
      initial={false}
      animate={visible ? {
        opacity: 1, scale: 1, filter: "brightness(1) hue-rotate(0deg)",
      } : {
        opacity: 0, scale: 0.88, filter: "brightness(2.5) hue-rotate(-50deg)",
      }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
      className="relative"
    >
      {/* Scanline flash on appear */}
      {visible && (
        <motion.div
          className="absolute inset-0 z-30 pointer-events-none rounded-2xl"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{ background: "linear-gradient(180deg, rgba(0,212,255,0.15) 0%, transparent 50%)" }}
        />
      )}
      {children}
    </motion.div>
  );
}

// Continuous canvas Matrix rain
function MatrixRain({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const dropsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let W = 0, H = 0, cols = 0;
    const FONT_SIZE = 14;
    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF";

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.floor(W / FONT_SIZE);
      // Initialize drops — random starting positions
      const newDrops: number[] = [];
      for (let i = 0; i < cols; i++) {
        newDrops[i] = dropsRef.current[i] ?? -(Math.random() * 40);
      }
      dropsRef.current = newDrops;
    };
    resize();
    window.addEventListener("resize", resize);

    let lastTime = 0;
    const FPS_INTERVAL = 1000 / 18; // ~18fps for that classic matrix feel

    const draw = (time: number) => {
      if (!active) { frameRef.current = requestAnimationFrame(draw); return; }
      const elapsed = time - lastTime;
      if (elapsed < FPS_INTERVAL) { frameRef.current = requestAnimationFrame(draw); return; }
      lastTime = time;

      // Fade trail — dark overlay each frame
      ctx.fillStyle = "rgba(5, 5, 16, 0.12)";
      ctx.fillRect(0, 0, W, H);

      ctx.font = `${FONT_SIZE}px "JetBrains Mono", monospace`;

      const drops = dropsRef.current;
      for (let i = 0; i < cols; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;

        // Head character — bright green/cyan
        if (Math.random() > 0.4) {
          ctx.fillStyle = `rgba(0, 255, 70, ${0.6 + Math.random() * 0.4})`;
          ctx.fillText(char, x, y);
        }

        // Occasional bright white head
        if (Math.random() > 0.92) {
          ctx.fillStyle = "rgba(180, 255, 180, 0.9)";
          ctx.fillText(char, x, y);
        }

        drops[i]++;

        // Reset drop to top with random chance
        if (y > H && Math.random() > 0.975) {
          drops[i] = -(Math.random() * 20);
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-[28px] pointer-events-none" style={{ opacity: 0.35 }} />;
}

function DiagramDesktop() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-120px" });
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (!isInView) { setStep(-1); return; }
    let current = 0;
    setStep(0);
    const interval = setInterval(() => {
      current++;
      if (current > 14) { clearInterval(interval); return; }
      setStep(current);
    }, 200);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <div ref={ref} className="hidden lg:block">
      <div className="relative rounded-[28px] p-8 xl:p-10 overflow-hidden" style={{
        border: "1px solid rgba(26,26,58,0.8)",
        background: "linear-gradient(180deg, rgba(8,8,24,0.95) 0%, rgba(5,5,16,0.98) 100%)",
      }}>
        {/* Blueprint grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        {/* Continuous Matrix rain — canvas-based */}
        <MatrixRain active={isInView} />

        <span className="absolute top-4 left-5 font-mono text-[10px] text-text-muted/30">00</span>

        {/* CSS Grid: 7 columns, 3 rows */}
        <div className="relative z-10" style={{
          display: "grid",
          gridTemplateColumns: "165px 36px 1fr 36px 1fr 36px 1fr",
          gridTemplateRows: "auto 64px auto",
          gap: "12px",
          alignItems: "center",
        }}>
          {/* ═══ ROW 1 (top): left → right ═══ */}
          {/* Col 1: Inputs — row 1 ONLY, no spanning */}
          <div style={{ gridRow: "1", gridColumn: "1" }} className="flex flex-col gap-2.5">
            <MatrixReveal order={0} step={step}>
              <DiagramModule label="dApp / Protocol" icon={Globe} color="#00d4ff" number="01" desc="Integrates Yiling" />
            </MatrixReveal>
            <MatrixReveal order={0} step={step}>
              <DiagramModule label="AI Agent" icon={Brain} color="#a855f7" number="02" desc="Automated reasoning" />
            </MatrixReveal>
            <MatrixReveal order={0} step={step}>
              <DiagramModule label="User" icon={Users} color="#ec4899" number="03" desc="Human participant" />
            </MatrixReveal>
          </div>

          {/* Col 2: Single connector from center of inputs */}
          <div style={{ gridRow: "1", gridColumn: "2" }} className="flex items-center">
            <MatrixReveal order={1} step={step}><HConnector color="#a855f7" delay={0.2} /></MatrixReveal>
          </div>

          {/* Col 3: Market Factory (04) */}
          <div style={{ gridRow: "1", gridColumn: "3" }}>
            <MatrixReveal order={2} step={step}>
              <CoreProcessor label="Market Factory" icon={Code2} color="#00d4ff" number="04"
                desc="Deploys and configures markets. Any question — subjective, objective, or long-horizon." />
            </MatrixReveal>
          </div>

          {/* Col 4: → */}
          <div style={{ gridRow: "1", gridColumn: "4" }}>
            <MatrixReveal order={3} step={step}><HConnector color="#a855f7" delay={0.3} /></MatrixReveal>
          </div>

          {/* Col 5: Prediction Market (05) */}
          <div style={{ gridRow: "1", gridColumn: "5" }}>
            <MatrixReveal order={4} step={step}>
              <CoreProcessor label="Prediction Market" icon={Target} color="#a855f7" number="05"
                desc="Collects predictions with bonds. Each agent shifts the probability toward their belief." />
            </MatrixReveal>
          </div>

          {/* Col 6: → */}
          <div style={{ gridRow: "1", gridColumn: "6" }}>
            <MatrixReveal order={5} step={step}><HConnector color="#ec4899" delay={0.6} /></MatrixReveal>
          </div>

          {/* Col 7: Random Stop (06) */}
          <div style={{ gridRow: "1", gridColumn: "7" }}>
            <MatrixReveal order={6} step={step}>
              <CoreProcessor label="Random Stop" icon={Dices} color="#ec4899" number="06"
                desc="After each prediction a dice rolls. If triggered, the market proceeds to resolution." />
            </MatrixReveal>
          </div>

          {/* ═══ ROW 2: Vertical connector — col 7, centered ═══ */}
          <div style={{ gridRow: "2", gridColumn: "7", justifySelf: "center", height: "100%" }}>
            <MatrixReveal order={7} step={step}>
              <div className="h-full flex justify-center">
                <VConnector color="#10b981" delay={0.5} className="h-full" />
              </div>
            </MatrixReveal>
          </div>

          {/* ═══ ROW 3 (bottom): right → left ═══ */}
          {/* Logical flow R→L: FixedPointMath(07) → SKC Engine(08) → Truth(09) → Payouts(10) */}
          {/* Visual L→R: Payouts(10) ← Truth(09) ← SKC(08) ← FixedPointMath(07) */}

          {/* Col 1: Payouts (10) — final step, bottom-left */}
          <div style={{ gridRow: "3", gridColumn: "1" }}>
            <MatrixReveal order={14} step={step}>
              <DiagramModule label="Payouts" icon={TrendingUp} color="#10b981" number="10"
                desc="Rewards distributed to accurate reporters" />
            </MatrixReveal>
          </div>

          {/* Col 2: ← */}
          <div style={{ gridRow: "3", gridColumn: "2" }}>
            <MatrixReveal order={13} step={step}><HConnector color="#10b981" delay={1.2} reverse /></MatrixReveal>
          </div>

          {/* Col 3: Truth Consensus (09) */}
          <div style={{ gridRow: "3", gridColumn: "3" }}>
            <MatrixReveal order={12} step={step}>
              <CoreProcessor label="Truth Consensus" icon={Target} color="#10b981" number="09"
                desc="Final probability emerges from game theory. No oracle dependency." />
            </MatrixReveal>
          </div>

          {/* Col 4: ← */}
          <div style={{ gridRow: "3", gridColumn: "4" }}>
            <MatrixReveal order={11} step={step}><HConnector color="#a855f7" delay={1.0} reverse /></MatrixReveal>
          </div>

          {/* Col 5: SKC Engine (08) */}
          <div style={{ gridRow: "3", gridColumn: "5" }}>
            <MatrixReveal order={10} step={step}>
              <CoreProcessor label="SKC Engine" icon={Cpu} color="#a855f7" number="08"
                desc="Cross-entropy scoring ensures honest reporting is the dominant strategy." />
            </MatrixReveal>
          </div>

          {/* Col 6: ← */}
          <div style={{ gridRow: "3", gridColumn: "6" }}>
            <MatrixReveal order={9} step={step}><HConnector color="#00d4ff" delay={0.8} reverse /></MatrixReveal>
          </div>

          {/* Col 7: FixedPointMath (07) */}
          <div style={{ gridRow: "3", gridColumn: "7" }}>
            <MatrixReveal order={8} step={step}>
              <DiagramModule label="FixedPointMath" icon={Code2} color="#00d4ff" number="07"
                desc="Precision math library powering on-chain scoring" />
            </MatrixReveal>
          </div>
        </div>

        {/* Flow label */}
        <div className="relative z-10 flex items-center justify-center mt-6 gap-3">
          <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent)" }} />
          <motion.span
            className="font-mono text-[10px] text-text-muted/40 tracking-wider"
            animate={step >= 14 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            CLOCKWISE — INPUTS → MARKET → STOP → SCORING → TRUTH → PAYOUTS
          </motion.span>
          <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent)" }} />
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="protocol" className="relative py-36 px-6 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-25" />
      <GlowOrb className="w-[600px] h-[600px] top-[5%] right-[-150px] bg-cyan/[0.05] blur-[120px]" />
      <GlowOrb className="w-[500px] h-[500px] bottom-[5%] left-[-100px] bg-violet/[0.05] blur-[100px]" />

      <div className="relative mx-auto max-w-6xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, margin: "-80px" }} variants={stagger} className="space-y-20">
          <motion.div variants={fadeUp} className="text-center space-y-5">
            <p className="text-cyan text-[13px] font-semibold tracking-[0.2em] uppercase">Protocol</p>
            <h2 className="font-heading font-extrabold text-[32px] sm:text-[40px] md:text-[48px] tracking-tight">How It Works</h2>
            <p className="text-text-secondary text-[17px] max-w-md mx-auto leading-relaxed">An open and modular prediction system — fully on-chain, fully autonomous</p>
          </motion.div>

          {/* ─── Desktop System Diagram (Clockwise U-flow, Matrix reveal) ─── */}
          <DiagramDesktop />

          {/* ─── Mobile: stacked cards ─── */}
          <div className="grid sm:grid-cols-2 lg:hidden gap-4">
            {([
              { icon: Users, number: "01", title: "Create Market", description: "A creator deploys a question to the MarketFactory contract.", color: "cyan" as const },
              { icon: Brain, number: "02", title: "Agents Predict", description: "AI agents analyze and submit probability predictions with bonds.", color: "violet" as const },
              { icon: Dices, number: "03", title: "Random Stop", description: "After each prediction, a dice rolls. If triggered, the market resolves.", color: "pink" as const },
              { icon: TrendingUp, number: "04", title: "Truth & Payouts", description: "Cross-entropy scoring rewards accuracy. Truth emerges from math.", color: "success" as const },
            ]).map((step) => {
              const cs = colorStyles[step.color];
              return (
                <motion.div key={step.number} variants={fadeUp}
                  className="group p-7 rounded-[20px] glass-card">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: cs.iconBg, border: `1px solid ${cs.iconBorder}` }}>
                        <step.icon className="w-5 h-5" style={{ color: cs.iconColor }} />
                      </div>
                      <span className="font-mono text-[13px] font-bold" style={{ color: `${cs.iconColor}50` }}>{step.number}</span>
                    </div>
                    <h3 className="font-heading font-bold text-[18px] text-text">{step.title}</h3>
                    <p className="text-text-muted text-[14px] leading-[1.7]">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Animated Price Chart ────────────────────────────────────────────────────

const chartPoints = [
  0.50, 0.50, 0.53, 0.56, 0.54, 0.59, 0.62, 0.60, 0.64, 0.61,
  0.65, 0.68, 0.66, 0.70, 0.71, 0.69, 0.72, 0.71, 0.73, 0.72,
  0.72, 0.71, 0.72, 0.72,
];

function PriceChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const inView = useInView(chartRef, { once: false, margin: "-100px" });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!inView) { setProgress(0); return; }
    let p = 0;
    const interval = setInterval(() => {
      p += 0.02;
      if (p >= 1) { setProgress(1); clearInterval(interval); } else setProgress(p);
    }, 40);
    return () => clearInterval(interval);
  }, [inView]);

  const w = 340, h = 210, padX = 40, padY = 20;
  const chartW = w - padX - 10, chartH = h - padY * 2;
  const visibleCount = Math.floor(progress * chartPoints.length);
  const getX = (i: number) => padX + (i / (chartPoints.length - 1)) * chartW;
  const getY = (v: number) => padY + (1 - (v - 0.4) / 0.45) * chartH;

  let linePath = "", areaPath = "";
  for (let i = 0; i <= visibleCount && i < chartPoints.length; i++) {
    const x = getX(i), y = getY(chartPoints[i]);
    if (i === 0) { linePath = `M${x},${y}`; areaPath = `M${x},${getY(0.4)}L${x},${y}`; }
    else { linePath += `L${x},${y}`; areaPath += `L${x},${y}`; }
  }
  if (visibleCount > 0) areaPath += `L${getX(Math.min(visibleCount, chartPoints.length - 1))},${getY(0.4)}Z`;

  const currentVal = visibleCount > 0 ? chartPoints[Math.min(visibleCount, chartPoints.length - 1)] : 0.5;
  const currentX = getX(Math.min(visibleCount, chartPoints.length - 1));
  const currentY = getY(currentVal);

  return (
    <div ref={chartRef} className="rounded-[24px] glass-card p-8 relative overflow-hidden group">
      <GlowOrb className="w-[200px] h-[200px] -top-20 -right-20 bg-cyan/[0.12] blur-[60px]" />
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="text-text-muted text-[11px] uppercase tracking-[0.2em] font-semibold">Price Convergence</div>
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-cyan/[0.08] border border-cyan/15">
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
              <Dices className="w-3.5 h-3.5 text-cyan" />
            </motion.div>
            <span className="font-mono text-[14px] text-cyan font-bold">{currentVal.toFixed(2)}</span>
          </div>
        </div>

        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 220 }}>
          {[0.40, 0.50, 0.60, 0.70, 0.80].map((v) => (
            <g key={v}>
              <line x1={padX} y1={getY(v)} x2={w - 10} y2={getY(v)} stroke="#1a1a3a" strokeWidth="0.5" strokeDasharray="4 4" />
              <text x={padX - 6} y={getY(v) + 3} textAnchor="end" fill="#5a5a7a" fontSize="9" fontFamily="var(--font-mono)">{v.toFixed(1)}</text>
            </g>
          ))}
          <line x1={padX} y1={getY(0.72)} x2={w - 10} y2={getY(0.72)} stroke="#10b981" strokeWidth="1" strokeDasharray="6 4" opacity="0.5" />
          <text x={w - 8} y={getY(0.72) - 6} textAnchor="end" fill="#10b981" fontSize="8" fontFamily="var(--font-mono)">truth</text>
          {visibleCount > 0 && <path d={areaPath} fill="url(#chart-area-grad)" />}
          {visibleCount > 0 && <path d={linePath} fill="none" stroke="url(#chart-line-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          {visibleCount > 0 && inView && (
            <>
              <circle cx={currentX} cy={currentY} r="8" fill="#00d4ff" opacity="0.15">
                <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.04;0.2" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={currentX} cy={currentY} r="4" fill="#00d4ff" stroke="#0a0a1a" strokeWidth="2.5" />
            </>
          )}
          <defs>
            <linearGradient id="chart-line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00d4ff" /><stop offset="50%" stopColor="#a855f7" /><stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.12" /><stop offset="100%" stopColor="#00d4ff" stopOpacity="0.01" />
            </linearGradient>
          </defs>
        </svg>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/60">
          {["Agent 1", "Agent 2", "Agent 3", "Agent N"].map((name, i) => {
            const show = progress > (i + 1) * 0.2;
            const colors = ["#00d4ff", "#a855f7", "#ec4899", "#00d4ff"];
            return (
              <motion.div key={name} initial={{ opacity: 0, y: 8 }} animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: 0.3 }} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i], boxShadow: `0 0 6px ${colors[i]}60` }} />
                <span className="font-mono text-[10px] text-text-muted">{name}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Mechanism() {
  return (
    <section className="relative py-36 px-6 overflow-hidden">
      <GlowOrb className="w-[600px] h-[600px] top-[20%] left-[-200px] bg-violet/[0.06] blur-[120px]" />
      <PixelGrid className="absolute top-[10%] right-[5%] opacity-20" seed={256} />

      <div className="relative mx-auto max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, margin: "-80px" }} variants={stagger}
          className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={slideLeft} className="space-y-10">
            <div className="space-y-5">
              <p className="text-violet text-[13px] font-semibold tracking-[0.2em] uppercase">Mechanism</p>
              <h2 className="font-heading font-extrabold text-[32px] sm:text-[40px] tracking-tight leading-[1.1]">The SKC Mechanism</h2>
              <p className="text-text-secondary text-[17px] leading-[1.7]">
                Based on game-theoretic research from Harvard. Cross-entropy scoring ensures honest reporting is the dominant strategy.
              </p>
            </div>

            <div className="code-block p-7 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan/[0.06] to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="text-cyan text-[11px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  Cross-Entropy Scoring
                </div>
                <div className="text-[#e4e4f0] font-medium text-[15px]">
                  payoff<span className="text-[#6b7194]">i</span> = bond + <span className="text-cyan">b</span> &times; [S(q<span className="text-[#6b7194]">final</span>, p<span className="text-[#6b7194]">after</span>) - S(q<span className="text-[#6b7194]">final</span>, p<span className="text-[#6b7194]">before</span>)]
                </div>
                <div className="border-t border-[#1e1e40] pt-4 mt-4 space-y-1.5 text-[13px]">
                  <p className="text-[#6b7194]">S(q, p) = q &middot; ln(p) + (1-q) &middot; ln(1-p)</p>
                  <p className="text-emerald-400">Move toward truth &rarr; reward</p>
                  <p className="text-rose-400">Move away from truth &rarr; penalty</p>
                </div>
              </div>
            </div>

            <a href="https://arxiv.org/abs/2306.04305" target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-4 p-6 rounded-2xl glass-card group hover:border-cyan/20 transition-all duration-500">
              <div className="w-11 h-11 rounded-xl bg-cyan/[0.1] border border-cyan/20 flex items-center justify-center shrink-0 group-hover:bg-cyan/[0.15] transition-colors">
                <FileText className="w-5 h-5 text-cyan" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-text group-hover:text-cyan transition-colors">Self-Resolving Prediction Markets</p>
                <p className="text-[14px] text-text-muted mt-1">Srinivasan, Karger, Chen — Harvard, 2023</p>
                <span className="inline-flex items-center gap-1.5 text-[14px] text-cyan mt-2 font-semibold">
                  Read on arXiv <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </a>
          </motion.div>

          <motion.div variants={slideRight}>
            <PriceChart />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Infrastructure (3D DNA Helix) ───────────────────────────────────────────

const infraFeatures = [
  { icon: Brain, title: "Open Agent Framework", desc: "Plug in any agent — AI, human, or algorithmic. Define your own reasoning strategy with our SDK.", color: "cyan" as const },
  { icon: Globe, title: "Chain-Agnostic Deployment", desc: "Deploy on any EVM chain with a single config change. Foundry scripts and guides included.", color: "violet" as const },
  { icon: Zap, title: "Self-Resolving Markets", desc: "No oracle dependency. Truth emerges from game theory via the SKC mechanism.", color: "pink" as const },
  { icon: Code2, title: "Modular Smart Contracts", desc: "MarketFactory, PredictionMarket, and FixedPointMath — composable and auditable.", color: "cyan" as const },
  { icon: Users, title: "Permissionless Participation", desc: "Anyone can create markets, build agents, or integrate the protocol. No gatekeepers.", color: "violet" as const },
  { icon: LineChart, title: "Cross-Entropy Scoring", desc: "Mathematically proven incentive layer. Honest reporting is always the dominant strategy.", color: "pink" as const },
];

// Canvas-based 3D DNA double helix with depth rendering and rotation
function DNA3DCanvas({ height }: { height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let W = 0, H = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      phaseRef.current += 0.006;
      const phase0 = phaseRef.current;

      const TURNS = 4;
      const RADIUS = Math.min(W * 0.13, 100);
      const STEPS = 350;

      // Diagonal axis: top-left → bottom-right
      const sX = W * 0.32, eX = W * 0.68;
      const sY = -30, eY = H + 30;

      // Perpendicular direction to the axis (for helix oscillation in screen-X)
      const axDx = eX - sX, axDy = eY - sY;
      const axLen = Math.sqrt(axDx * axDx + axDy * axDy);
      const perpX = -axDy / axLen;
      const perpY = axDx / axLen;

      type DrawItem = { z: number; fn: () => void };
      const items: DrawItem[] = [];

      // Vertical fade factor (fade at top/bottom edges)
      const vFade = (t: number) => {
        if (t < 0.05) return t / 0.05;
        if (t > 0.95) return (1 - t) / 0.05;
        return 1;
      };

      // ── Strand segments ──
      for (let i = 0; i < STEPS; i++) {
        const t1 = i / STEPS;
        const t2 = (i + 1) / STEPS;
        const fade = vFade(t1);

        for (let strand = 0; strand < 2; strand++) {
          const po = strand * Math.PI; // phase offset: 0 or π
          const cx1 = sX + t1 * axDx, cy1 = sY + t1 * axDy;
          const cx2 = sX + t2 * axDx, cy2 = sY + t2 * axDy;

          const p1 = t1 * TURNS * Math.PI * 2 + phase0 + po;
          const p2 = t2 * TURNS * Math.PI * 2 + phase0 + po;

          // 3D helix: cos = screen displacement along perp, sin = depth
          const x1 = cx1 + RADIUS * Math.cos(p1) * perpX;
          const y1 = cy1 + RADIUS * Math.cos(p1) * perpY;
          const z1 = Math.sin(p1);
          const x2 = cx2 + RADIUS * Math.cos(p2) * perpX;
          const y2 = cy2 + RADIUS * Math.cos(p2) * perpY;
          const avgZ = (z1 + Math.sin(p2)) / 2;

          const colors = ["0,212,255", "168,85,247"];
          const glowColors = ["rgba(0,212,255,", "rgba(168,85,247,"];
          const c = colors[strand];
          const gc = glowColors[strand];

          items.push({
            z: avgZ,
            fn: () => {
              const depthNorm = (avgZ + 1) / 2; // 0 (back) to 1 (front)
              const width = 1.5 + depthNorm * 3.5; // 1.5 to 5
              const alpha = (0.1 + depthNorm * 0.7) * fade;

              ctx.strokeStyle = `rgba(${c},${alpha})`;
              ctx.lineWidth = width;
              ctx.lineCap = "round";

              if (avgZ > 0.15) {
                ctx.shadowColor = `${gc}${(0.5 * fade).toFixed(2)})`;
                ctx.shadowBlur = 10 + depthNorm * 8;
              }
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
              ctx.shadowBlur = 0;
            },
          });
        }
      }

      // ── Rungs (base pairs) ──
      const NUM_RUNGS = 28;
      for (let r = 0; r < NUM_RUNGS; r++) {
        const t = (r + 0.5) / NUM_RUNGS;
        const fade = vFade(t);
        const cx = sX + t * axDx, cy = sY + t * axDy;
        const phase = t * TURNS * Math.PI * 2 + phase0;

        const cosA = Math.cos(phase);
        const cosB = Math.cos(phase + Math.PI);
        const ax = cx + RADIUS * cosA * perpX;
        const ay = cy + RADIUS * cosA * perpY;
        const bx = cx + RADIUS * cosB * perpX;
        const by = cy + RADIUS * cosB * perpY;

        // Rung line at middle depth
        items.push({
          z: -0.05,
          fn: () => {
            const grad = ctx.createLinearGradient(ax, ay, bx, by);
            grad.addColorStop(0, `rgba(0,212,255,${0.2 * fade})`);
            grad.addColorStop(0.5, `rgba(236,72,153,${0.3 * fade})`);
            grad.addColorStop(1, `rgba(168,85,247,${0.2 * fade})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          },
        });

        // Sphere nodes at each rung end
        const spheres: [number, number, number, string][] = [
          [ax, ay, Math.sin(phase), "#00d4ff"],
          [bx, by, -Math.sin(phase), "#a855f7"],
        ];
        for (const [sx, sy, sz, sc] of spheres) {
          const depthNorm = (sz + 1) / 2;
          const sphereR = 2.5 + depthNorm * 4;
          items.push({
            z: sz + 0.01,
            fn: () => {
              const grad = ctx.createRadialGradient(
                sx - sphereR * 0.35, sy - sphereR * 0.35, sphereR * 0.1,
                sx, sy, sphereR
              );
              grad.addColorStop(0, sc + "ee");
              grad.addColorStop(0.45, sc + "88");
              grad.addColorStop(1, sc + "08");
              ctx.fillStyle = grad;
              if (sz > 0) {
                ctx.shadowColor = sc;
                ctx.shadowBlur = 8 + depthNorm * 6;
              }
              ctx.beginPath();
              ctx.arc(sx, sy, sphereR * fade, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            },
          });
        }
      }

      // Depth-sort and draw everything
      items.sort((a, b) => a.z - b.z);
      for (const item of items) item.fn();

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ height }}
    />
  );
}

function Infrastructure() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const ITEM_H = 220;
  const totalH = infraFeatures.length * ITEM_H;

  return (
    <section id="infrastructure" ref={sectionRef} className="relative py-36 px-6 overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-20" />
      <GlowOrb className="w-[600px] h-[600px] top-[10%] left-[55%] bg-violet/[0.05] blur-[120px]" />
      <GlowOrb className="w-[500px] h-[500px] bottom-[10%] right-[60%] bg-cyan/[0.04] blur-[100px]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, margin: "-80px" }} variants={stagger}
          className="text-center space-y-5 mb-24">
          <motion.p variants={fadeUp} className="text-pink text-[13px] font-semibold tracking-[0.2em] uppercase">Infrastructure</motion.p>
          <motion.h2 variants={fadeUp} className="font-heading font-extrabold text-[32px] sm:text-[40px] md:text-[48px] tracking-tight">Protocol Infrastructure</motion.h2>
          <motion.p variants={fadeUp} className="text-text-secondary text-[17px] max-w-lg mx-auto leading-relaxed">The building blocks that make Yiling Protocol modular, open, and unstoppable</motion.p>
        </motion.div>

        {/* 3D DNA Double Helix + Cards */}
        <div className="relative hidden md:block" style={{ height: totalH }}>
          {/* Canvas 3D Helix */}
          <DNA3DCanvas height={totalH} />

          {/* Feature cards on alternating sides */}
          {infraFeatures.map((feature, i) => {
            const isLeft = i % 2 === 0;
            const cs = colorStyles[feature.color];
            const yPos = (i + 0.5) / infraFeatures.length * totalH;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: isLeft ? -50 : 50, y: 10 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: false, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const }}
                className="absolute"
                style={{
                  top: yPos - 85,
                  left: isLeft ? 0 : "auto",
                  right: isLeft ? "auto" : 0,
                  width: "calc(50% - 160px)",
                }}
              >
                <div className="group p-6 rounded-[20px] glass-card hover:border-white/[0.08] transition-all duration-500 relative overflow-hidden cursor-default">
                  <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{ background: `radial-gradient(circle, ${cs.iconColor}12, transparent 70%)` }} />
                  <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{ background: `radial-gradient(circle, ${cs.iconColor}08, transparent 70%)` }} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                        style={{ background: cs.iconBg, border: `1px solid ${cs.iconBorder}` }}>
                        <feature.icon className="w-5 h-5" style={{ color: cs.iconColor }} />
                      </div>
                      <span className="font-mono text-[12px] font-bold tracking-wider" style={{ color: `${cs.iconColor}40` }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-[17px] text-text mb-2">{feature.title}</h3>
                    <p className="text-text-muted text-[14px] leading-[1.7] group-hover:text-text-secondary transition-colors duration-500">{feature.desc}</p>
                    <div className="mt-4 h-px w-full opacity-30" style={{
                      background: `linear-gradient(90deg, ${cs.iconColor}60, transparent)`
                    }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile fallback — stacked cards */}
        <div className="md:hidden space-y-6">
          {infraFeatures.map((feature, i) => {
            const cs = colorStyles[feature.color];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const }}
              >
                <div className="group p-7 rounded-[20px] glass-card hover:border-white/[0.08] transition-all duration-500 relative overflow-hidden cursor-default">
                  <div className="relative">
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: cs.iconBg, border: `1px solid ${cs.iconBorder}` }}>
                        <feature.icon className="w-5 h-5" style={{ color: cs.iconColor }} />
                      </div>
                      <span className="font-mono text-[12px] font-bold tracking-wider" style={{ color: `${cs.iconColor}40` }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-[17px] text-text mb-2">{feature.title}</h3>
                    <p className="text-text-muted text-[14px] leading-[1.8]">{feature.desc}</p>
                    <div className="mt-5 h-px w-full opacity-30" style={{
                      background: `linear-gradient(90deg, ${cs.iconColor}60, transparent)`
                    }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Code Typewriter ────────────────────────────────────────────────────────

interface CodeToken { text: string; color: string }
type CodeLine = CodeToken[];

const codeLines: CodeLine[] = [
  [{ text: "from", color: "#c084fc" }, { text: " web3 ", color: "#e4e4f0" }, { text: "import", color: "#c084fc" }, { text: " Web3", color: "#e4e4f0" }],
  [{ text: "from", color: "#c084fc" }, { text: " openai ", color: "#e4e4f0" }, { text: "import", color: "#c084fc" }, { text: " OpenAI", color: "#e4e4f0" }],
  [],
  [{ text: "# Connect to any EVM chain", color: "#4a4a6a" }],
  [{ text: "w3 ", color: "#e4e4f0" }, { text: "= ", color: "#60a5fa" }, { text: "Web3", color: "#e4e4f0" }, { text: "(", color: "#60a5fa" }, { text: "Web3", color: "#e4e4f0" }, { text: ".", color: "#60a5fa" }, { text: "HTTPProvider", color: "#60a5fa" }, { text: "(", color: "#60a5fa" }],
  [{ text: '  "https://mainnet.base.org"', color: "#86efac" }],
  [{ text: "))", color: "#60a5fa" }],
  [],
  [{ text: "# Submit prediction", color: "#4a4a6a" }],
  [{ text: "contract", color: "#e4e4f0" }, { text: ".", color: "#60a5fa" }, { text: "functions", color: "#e4e4f0" }, { text: ".", color: "#60a5fa" }, { text: "predict", color: "#60a5fa" }, { text: "(", color: "#60a5fa" }],
  [{ text: "  market_id", color: "#e4e4f0" }, { text: "=", color: "#60a5fa" }, { text: "42", color: "#fb923c" }, { text: ",", color: "#60a5fa" }],
  [{ text: "  probability", color: "#e4e4f0" }, { text: "=", color: "#60a5fa" }, { text: "0.73e18", color: "#fb923c" }],
  [{ text: ")", color: "#60a5fa" }],
];

function CodeTypewriter() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-100px" });
  const [visibleChars, setVisibleChars] = useState(0);

  const totalChars = codeLines.reduce((sum, line) => {
    if (line.length === 0) return sum + 1;
    return sum + line.reduce((s, tok) => s + tok.text.length, 0);
  }, 0);

  useEffect(() => {
    if (!inView) { setVisibleChars(0); return; }
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current >= totalChars) { setVisibleChars(totalChars); clearInterval(interval); }
      else setVisibleChars(current);
    }, 25);
    return () => clearInterval(interval);
  }, [inView, totalChars]);

  const cursor = (
    <span className="inline-block w-[2px] h-[14px] bg-cyan align-middle"
      style={{ animation: "cursor-blink 0.8s step-end infinite", marginLeft: 1, boxShadow: "0 0 6px rgba(0,212,255,0.5)" }} />
  );

  const stillTyping = visibleChars < totalChars;
  let charIndex = 0;
  let cursorPlaced = false;
  const renderedLines = codeLines.map((line, lineIdx) => {
    if (line.length === 0) {
      const show = charIndex < visibleChars;
      const placeCursorHere = !cursorPlaced && show && charIndex + 1 >= visibleChars && stillTyping;
      charIndex += 1;
      if (placeCursorHere) { cursorPlaced = true; return <div key={lineIdx}>{cursor}</div>; }
      return show ? <br key={lineIdx} /> : null;
    }
    const tokens = line.map((token, tokIdx) => {
      const chars = token.text.split("").map((ch, chIdx) => {
        const show = charIndex < visibleChars;
        const isLastVisible = !cursorPlaced && show && charIndex + 1 >= visibleChars && stillTyping;
        charIndex += 1;
        if (!show) return null;
        if (isLastVisible) { cursorPlaced = true; return <span key={chIdx}>{ch}{cursor}</span>; }
        return <span key={chIdx}>{ch}</span>;
      });
      return <span key={tokIdx} style={{ color: token.color }}>{chars}</span>;
    });
    if (!tokens.some(t => t)) return null;
    return <div key={lineIdx}>{tokens}</div>;
  });

  if (!cursorPlaced && inView && stillTyping) renderedLines.unshift(<span key="cursor-start">{cursor}</span>);

  return (
    <div ref={ref} className="code-block overflow-hidden h-full relative">
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-cyan/[0.04] to-transparent rounded-bl-full pointer-events-none" />
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#1e1e40] bg-[#08081a]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#eab308]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/80" />
        </div>
        <span className="text-cyan/80 text-[12px] ml-2 font-semibold">my_agent.py</span>
      </div>
      <div className="p-6 text-[13px] leading-[1.9] font-mono">{renderedLines}</div>
    </div>
  );
}

// ─── Builders ───────────────────────────────────────────────────────────────

const builderCards = [
  { icon: Brain, title: "Connect an Agent", desc: "Plug in any agent via webhook or standalone. Use any LLM, any language, any strategy.", link: "Agent SDK", color: "cyan" as const },
  { icon: Globe, title: "Deploy the Protocol", desc: "Deploy the full contract suite on any EVM chain. One config, one command.", link: "Deployment Guide", color: "violet" as const },
  { icon: Cpu, title: "Integrate via API", desc: "REST API and WebSocket feeds. Build your own interface on top of Yiling Protocol.", link: "API Reference", color: "pink" as const },
];

function Builders() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  const terminalOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1]);
  const terminalX = useTransform(scrollYProgress, [0, 0.15], [-60, 0]);
  const cardAnims = [
    { opacity: useTransform(scrollYProgress, [0.25, 0.4], [0, 1]), y: useTransform(scrollYProgress, [0.25, 0.4], [50, 0]) },
    { opacity: useTransform(scrollYProgress, [0.45, 0.6], [0, 1]), y: useTransform(scrollYProgress, [0.45, 0.6], [50, 0]) },
    { opacity: useTransform(scrollYProgress, [0.65, 0.8], [0, 1]), y: useTransform(scrollYProgress, [0.65, 0.8], [50, 0]) },
  ];

  return (
    <div ref={sectionRef} className="relative" style={{ height: "300vh" }}>
      <section id="build" className="sticky top-0 min-h-screen flex items-center px-6 overflow-hidden">
        <GlowOrb className="w-[500px] h-[500px] bottom-[5%] right-[-120px] bg-violet/[0.06] blur-[100px]" />
        <div className="absolute inset-0 grid-pattern opacity-15" />

        <div className="relative mx-auto max-w-5xl w-full py-20">
          <div className="text-center space-y-5 mb-20">
            <p className="text-cyan text-[13px] font-semibold tracking-[0.2em] uppercase">Developers</p>
            <h2 className="font-heading font-extrabold text-[32px] sm:text-[40px] md:text-[48px] tracking-tight">Built for Builders</h2>
            <p className="text-text-secondary text-[17px] max-w-md mx-auto leading-relaxed">Connect your agent, deploy on your chain, or build on top</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            <motion.div style={{ opacity: terminalOpacity, x: terminalX }}>
              <CodeTypewriter />
            </motion.div>

            <div className="space-y-5">
              {builderCards.map((p, i) => {
                const cs = colorStyles[p.color];
                return (
                  <motion.div key={p.title}
                    style={{ opacity: cardAnims[i].opacity, y: cardAnims[i].y }}
                    whileHover={{ x: 8, transition: { duration: 0.3 } }}
                    className="group p-7 rounded-[20px] glass-card hover:border-white/[0.08] transition-all duration-500 relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `radial-gradient(circle, ${cs.iconColor}12, transparent 70%)` }} />
                    <div className="relative flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110"
                        style={{ background: cs.iconBg, border: `1px solid ${cs.iconBorder}` }}>
                        <p.icon className="w-5 h-5" style={{ color: cs.iconColor }} />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-[16px] text-text">{p.title}</h3>
                        <p className="text-text-muted text-[14px] mt-1.5 leading-[1.7] group-hover:text-text-secondary transition-colors">{p.desc}</p>
                        <span className="inline-flex items-center gap-1 text-[14px] font-semibold mt-3 transition-colors"
                          style={{ color: cs.iconColor }}>{p.link} <ArrowRight className="w-3.5 h-3.5" /></span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Chains ─────────────────────────────────────────────────────────────────

const chains = [
  { name: "Monad", active: true }, { name: "Base", active: true },
  { name: "Ethereum", active: false }, { name: "Arbitrum", active: false },
  { name: "Polygon", active: false }, { name: "Optimism", active: false },
  { name: "Avalanche", active: false }, { name: "BNB Chain", active: false },
];

function ChainAgnostic() {
  return (
    <section className="relative py-36 px-6 overflow-hidden">
      <div className="absolute inset-0 opacity-15" style={{
        backgroundImage: "linear-gradient(rgba(0,212,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.12) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />
      <GlowOrb className="w-[700px] h-[700px] top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-cyan/[0.06] blur-[140px]" />

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, margin: "-80px" }} variants={stagger} className="space-y-12">
          <motion.div variants={fadeUp} className="space-y-5">
            <p className="text-violet text-[13px] font-semibold tracking-[0.2em] uppercase">Deployment</p>
            <h2 className="font-heading font-extrabold text-[32px] sm:text-[40px] md:text-[48px] tracking-tight text-glow-subtle">Deploy on Any EVM Chain</h2>
            <p className="text-text-secondary text-[17px]">One protocol. Every chain. Your rules.</p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3">
            {chains.map((c, i) => (
              <motion.div key={c.name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4, scale: 1.05 }}
                className={`px-6 py-3 rounded-xl border text-[14px] font-semibold transition-all cursor-default backdrop-blur-md ${
                  c.active
                    ? "border-cyan/30 bg-cyan/[0.1] text-cyan shadow-[0_0_20px_rgba(0,212,255,0.1)]"
                    : "border-border glass-card text-text-muted hover:border-border-light hover:text-text-secondary"
                }`}>
                {c.name}
                {c.active && <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ml-2.5 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />}
                {!c.active && <span className="text-[12px] ml-2 opacity-40 font-medium">soon</span>}
              </motion.div>
            ))}
          </motion.div>
          <motion.p variants={fadeUp} className="text-text-muted text-[14px] tracking-wide">EVM-compatible &middot; Foundry scripts included &middot; One-line chain config</motion.p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="relative py-36 px-6 overflow-hidden">
      <div className="relative mx-auto max-w-3xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: false }} variants={stagger}
          className="relative rounded-[28px] p-14 text-center overflow-hidden glass-card border-border-light/50">
          {/* Internal glow */}
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(ellipse at 30% 50%, rgba(0,212,255,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(168,85,247,0.1) 0%, transparent 50%)"
          }} />
          <div className="absolute inset-0 dot-pattern opacity-8" />

          <div className="relative space-y-8">
            <motion.h2 variants={fadeUp} className="font-heading font-extrabold text-[32px] sm:text-[42px] tracking-tight text-text">
              Ready to build the<br />
              <span className="text-gradient">future of truth?</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-text-secondary text-[17px] max-w-md mx-auto leading-relaxed">
              Deploy the protocol on your chain, connect your agents, and create self-resolving markets.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <a href="#"
                className="group relative flex items-center gap-3 px-9 py-4 rounded-full text-white text-[15px] font-bold overflow-hidden transition-all duration-300 hover:scale-[1.03]"
                style={{ background: "linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)" }}>
                <span className="relative z-10 flex items-center gap-3">
                  Start Building <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet to-pink opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </a>
              <a href="#"
                className="flex items-center gap-2.5 px-9 py-4 rounded-full border border-border-light text-text-secondary hover:text-text hover:border-cyan/25 text-[15px] font-medium transition-all duration-300">
                <Github className="w-4.5 h-4.5" /> View on GitHub
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Pixel Text (Canvas flip-card pixels) ───────────────────────────────────

interface FlipPixel {
  x: number;
  y: number;
  frontColor: string;
  backColor: string;
  flipAngle: number;   // 0 = front face, PI = back face
  flipTarget: number;  // target angle: 0 or PI
  flipSpeed: number;   // current angular velocity
  triggerTime: number;  // when the flip was triggered (for auto-revert)
}

function PixelText({ text }: { text: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<FlipPixel[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pixelSizeRef = useRef(4);
  const timeRef = useRef(0);

  const buildPixels = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const cw = rect.width;
    const ch = 200;

    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const offscreen = document.createElement("canvas");
    const oc = offscreen.getContext("2d");
    if (!oc) return;

    let fontSize = Math.min(cw / (text.length * 0.58), 120);
    fontSize = Math.max(fontSize, 32);

    offscreen.width = cw;
    offscreen.height = ch;
    oc.fillStyle = "#000";
    oc.fillRect(0, 0, cw, ch);
    oc.font = `900 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
    oc.textAlign = "center";
    oc.textBaseline = "middle";
    oc.fillStyle = "#fff";
    oc.fillText(text, cw / 2, ch / 2);

    const imageData = oc.getImageData(0, 0, cw, ch);
    const data = imageData.data;

    const pxSize = Math.max(3, Math.round(fontSize / 20));
    pixelSizeRef.current = pxSize;
    const gap = pxSize + 1;
    const pixels: FlipPixel[] = [];

    // Front colors: cyan → violet → pink gradient
    // Back colors: contrasting neon
    const frontColors = ["#00d4ff", "#40e0ff", "#a855f7", "#c084fc", "#ec4899", "#f472b6"];
    const backColors  = ["#ec4899", "#f472b6", "#10b981", "#34d399", "#00d4ff", "#40e0ff"];

    for (let y = 0; y < ch; y += gap) {
      for (let x = 0; x < cw; x += gap) {
        const idx = (y * cw + x) * 4;
        if (data[idx] > 128) {
          const t = x / cw;
          let ci: number;
          if (t < 0.33) ci = Math.random() > 0.3 ? 0 : 1;
          else if (t < 0.66) ci = Math.random() > 0.3 ? 2 : 3;
          else ci = Math.random() > 0.3 ? 4 : 5;

          pixels.push({
            x, y,
            frontColor: frontColors[ci],
            backColor: backColors[ci],
            flipAngle: 0,
            flipTarget: 0,
            flipSpeed: 0,
            triggerTime: -9999,
          });
        }
      }
    }

    pixelsRef.current = pixels;
  }, [text]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMove);
      container.addEventListener("mouseleave", handleLeave);
    }
    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMove);
        container.removeEventListener("mouseleave", handleLeave);
      }
    };
  }, []);

  useEffect(() => {
    buildPixels();
    const handleResize = () => buildPixels();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [buildPixels]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    const animate = () => {
      const pixels = pixelsRef.current;
      if (pixels.length === 0) { animRef.current = requestAnimationFrame(animate); return; }

      timeRef.current += 1;
      const now = timeRef.current;
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;
      ctx.clearRect(0, 0, cw, ch);

      const mouse = mouseRef.current;
      const triggerRadius = 60;
      const pxSize = pixelSizeRef.current;
      const REVERT_DELAY = 90; // frames before auto-flipping back

      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];

        // Check mouse proximity — trigger flip to back
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < triggerRadius && p.flipTarget === 0) {
          p.flipTarget = Math.PI;
          p.triggerTime = now;
        }

        // Auto-revert after delay
        if (p.flipTarget === Math.PI && now - p.triggerTime > REVERT_DELAY) {
          // Only revert if mouse is far enough away
          const dx2 = p.x - mouse.x;
          const dy2 = p.y - mouse.y;
          if (Math.sqrt(dx2 * dx2 + dy2 * dy2) > triggerRadius * 1.2) {
            p.flipTarget = 0;
          }
        }

        // Animate flip angle towards target with spring physics
        const diff = p.flipTarget - p.flipAngle;
        p.flipSpeed += diff * 0.15;
        p.flipSpeed *= 0.75;
        p.flipAngle += p.flipSpeed;

        // Clamp
        if (p.flipAngle < 0) { p.flipAngle = 0; p.flipSpeed = 0; }
        if (p.flipAngle > Math.PI) { p.flipAngle = Math.PI; p.flipSpeed = 0; }

        // Draw the pixel with flip effect
        // |cos(flipAngle)| gives the visual width scaling (1 → 0 → 1)
        const cosA = Math.cos(p.flipAngle);
        const widthScale = Math.abs(cosA);
        const showBack = cosA < 0; // past 90° means we see the back

        // Skip drawing if pixel is edge-on (too thin)
        if (widthScale < 0.05) continue;

        const drawW = pxSize * widthScale;
        const drawX = p.x + (pxSize - drawW) / 2; // center the narrower pixel

        const color = showBack ? p.backColor : p.frontColor;

        // Add a subtle brightness boost during flip
        const flipProgress = Math.sin(p.flipAngle); // peaks at PI/2
        const alpha = 0.85 + flipProgress * 0.15;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(drawX), p.y, Math.max(1, Math.round(drawW)), pxSize);

        // Add a subtle glow/highlight on the flipping edge when mid-flip
        if (flipProgress > 0.3) {
          ctx.globalAlpha = flipProgress * 0.4;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(Math.round(drawX), p.y, Math.max(1, Math.round(drawW)), 1);
        }
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [text]);

  return (
    <div ref={containerRef} className="w-full cursor-pointer select-none" style={{ height: 200 }}>
      <canvas ref={canvasRef} className="block w-full" style={{ height: 200 }} />
    </div>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Pixel text - interactive */}
      <div className="relative py-10 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[900px] h-[300px] bg-gradient-to-r from-cyan/[0.04] via-violet/[0.06] to-pink/[0.04] blur-[120px] rounded-full" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <PixelText text="YILING PROTOCOL" />
        </div>
      </div>

      <SectionDivider />

      <div className="relative py-16 px-6">
        <div className="absolute inset-0 grid-pattern opacity-8" />

        <div className="relative mx-auto max-w-5xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan to-violet flex items-center justify-center shadow-lg shadow-cyan/20">
                  <Dices className="w-5 h-5 text-white" />
                </div>
                <span className="font-heading font-bold text-[18px] text-text">Yiling Protocol</span>
              </div>
              <p className="text-text-muted text-[14px] leading-[1.8] max-w-xs">The Self-Resolving Truth Layer. Open protocol for oracle-free prediction markets on any EVM chain.</p>
              <div className="flex items-center gap-3 pt-1">
                <a href="#" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-text-muted hover:text-cyan hover:border-cyan/25 transition-all duration-300">
                  <Github className="w-4.5 h-4.5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-text-muted hover:text-cyan hover:border-cyan/25 transition-all duration-300">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
              </div>
            </div>
            {[
              { title: "Protocol", links: ["Overview", "Mechanism", "Infrastructure", "Chains"] },
              { title: "Developers", links: ["SDK Docs", "Agent API", "Contracts", "GitHub"] },
              { title: "Resources", links: ["SKC Paper", "Blog", "FAQ"] },
            ].map((col) => (
              <div key={col.title} className="space-y-5">
                <h4 className="text-[12px] text-text-muted uppercase tracking-[0.2em] font-semibold">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l}><a href="#" className="text-[14px] text-text-muted hover:text-cyan transition-colors duration-300">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="section-divider mt-14 mb-8" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-text-muted text-[13px]">MIT License &middot; Built on Harvard Research</p>
            <p className="text-text-muted text-[13px]">&copy; 2025 Yiling Protocol</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="noise">
      <MouseGlow />
      <Navigation />
      <Hero />

      <MarqueeBand items={[
        "ORACLE-FREE", "SELF-RESOLVING", "CHAIN-AGNOSTIC", "GAME THEORY",
        "SKC MECHANISM", "CROSS-ENTROPY", "OPEN SOURCE", "EVM COMPATIBLE",
        "PERMISSIONLESS", "PREDICTION MARKETS", "TRUTH LAYER"
      ]} />

      <Problem />
      <SectionDivider />
      <HowItWorks />
      <SectionDivider />
      <Mechanism />

      <MarqueeBand
        reverse
        items={[
          "DEPLOY ANYWHERE", "ANY AGENT", "ANY CHAIN", "ANY QUESTION",
          "MODULAR CONTRACTS", "REST API", "WEBSOCKET", "FOUNDRY",
          "HARVARD RESEARCH", "BAYESIAN EQUILIBRIUM"
        ]}
      />

      <Infrastructure />
      <SectionDivider />
      <Builders />
      <SectionDivider />
      <ChainAgnostic />
      <CTA />
      <Footer />
    </main>
  );
}
