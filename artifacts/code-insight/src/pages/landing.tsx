import { useRef, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, Code2, Zap, GitBranch, Lock, Eye, ChevronRight, Terminal, AlertTriangle, CheckCircle } from "lucide-react";
import { SiGithub, SiGoogle } from "react-icons/si";
import { useSignIn } from "@clerk/react";
import { Button } from "@/components/ui/button";

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.12 * (1 - d / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

const features = [
  {
    icon: Shield,
    title: "Security Analysis",
    desc: "AI detects vulnerabilities, injection risks, and authentication flaws before they reach production.",
    color: "text-red-400",
    glow: "group-hover:shadow-red-500/20",
  },
  {
    icon: Code2,
    title: "Code Quality",
    desc: "Identify code smells, antipatterns, and maintainability issues with detailed explanations.",
    color: "text-purple-400",
    glow: "group-hover:shadow-purple-500/20",
  },
  {
    icon: Zap,
    title: "Architecture Review",
    desc: "Get high-level feedback on system design, coupling, and architectural patterns.",
    color: "text-blue-400",
    glow: "group-hover:shadow-blue-500/20",
  },
  {
    icon: GitBranch,
    title: "PR Diff Analysis",
    desc: "Review only what changed. Submit a PR URL for focused, diff-aware analysis.",
    color: "text-green-400",
    glow: "group-hover:shadow-green-500/20",
  },
];

const steps = [
  { icon: Lock, label: "Sign in with GitHub or Google" },
  { icon: GitBranch, label: "Submit your repo or PR URL" },
  { icon: Eye, label: "Watch real-time AI analysis" },
  { icon: CheckCircle, label: "Review issues with fix patches" },
];

const exampleIssues = [
  { severity: "critical", category: "security", title: "SQL Injection Vulnerability", file: "src/db/queries.ts", line: 42 },
  { severity: "high", category: "security", title: "Hardcoded API Secret", file: "src/config/env.ts", line: 8 },
  { severity: "medium", category: "code_smell", title: "God Function — 200+ Lines", file: "src/utils/process.ts", line: 15 },
  { severity: "low", category: "architecture", title: "Tight Coupling to ORM", file: "src/models/user.ts", line: 1 },
];

const severityColors: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { signIn } = useSignIn();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 400], [0, -60]);

  const handleGithubSignIn = async () => {
    try {
      await signIn?.authenticateWithRedirect({
        strategy: "oauth_github",
        redirectUrl: `${window.location.origin}${import.meta.env.BASE_URL}sign-in/sso-callback`,
        redirectUrlComplete: `${window.location.origin}${import.meta.env.BASE_URL}dashboard`,
      });
    } catch {
      setLocation("/sign-in");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <ParticleCanvas />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          style={{ y: heroY }}
          className="relative z-10 text-center px-6 max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium mb-8"
          >
            <Zap size={14} />
            AI-powered code intelligence
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-6xl md:text-8xl font-bold tracking-tight mb-6"
          >
            <span className="text-gradient-purple">Code Insight</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            AI-powered Code Review Agent — security, quality, and architecture analysis in seconds.
          </motion.p>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="glass-purple rounded-2xl p-8 max-w-sm mx-auto"
            style={{ boxShadow: "0 0 40px rgba(139,92,246,0.15), 0 0 80px rgba(139,92,246,0.05)" }}
          >
            <h2 className="text-lg font-semibold mb-2 text-white">Get started for free</h2>
            <p className="text-muted-foreground text-sm mb-6">Sign in to start analyzing your code</p>
            <div className="space-y-3">
              <button
                onClick={handleGithubSignIn}
                data-testid="button-github-signin"
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0d1117] border border-white/10 rounded-lg text-white text-sm font-medium hover:bg-white/5 hover:border-purple-500/30 transition-all duration-200"
              >
                <SiGithub size={18} />
                Continue with GitHub
              </button>
              <button
                onClick={() => setLocation("/sign-in")}
                data-testid="button-google-signin"
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0d1117] border border-white/10 rounded-lg text-white text-sm font-medium hover:bg-white/5 hover:border-purple-500/30 transition-all duration-200"
              >
                <SiGoogle size={16} />
                Continue with Google
              </button>
            </div>
            <p className="text-muted-foreground text-xs mt-4 text-center">
              Free tier. No credit card required.
            </p>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground text-xs"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-purple-500/50" />
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">What we analyze</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Three specialized AI agents examine your code from different angles simultaneously.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`group glass rounded-xl p-6 hover:border-white/15 transition-all duration-300 ${f.glow} hover:shadow-lg`}
              >
                <f.icon className={`${f.color} mb-4`} size={24} />
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live preview of issues */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/10 via-transparent to-blue-950/10" />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-4">Real issues. Real fixes.</h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Every issue comes with a line-level location, detailed explanation, and a ready-to-apply patch. Not suggestions — solutions.
              </p>
              <ul className="space-y-3 text-muted-foreground">
                {["File path and exact line number", "Old vs. new code diff", "Detailed explanation", "One-click patch download"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle size={16} className="text-green-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl overflow-hidden"
            >
              <div className="border-b border-white/5 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-muted-foreground text-xs ml-2 font-mono">Issues — example-repo</span>
              </div>
              <div className="p-4 space-y-2">
                {exampleIssues.map((issue, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium shrink-0 ${severityColors[issue.severity]}`}>
                      {issue.severity}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{issue.title}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{issue.file}:{issue.line}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-white mb-16"
          >
            How it works
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                  <step.icon size={20} className="text-purple-400" />
                </div>
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </div>
                <p className="text-sm text-muted-foreground text-center leading-relaxed">{step.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Terminal demo */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 0 40px rgba(139,92,246,0.1)" }}
          >
            <div className="border-b border-white/5 px-4 py-3 flex items-center gap-2">
              <Terminal size={14} className="text-purple-400" />
              <span className="text-muted-foreground text-xs font-mono">Analysis in progress...</span>
            </div>
            <div className="p-6 font-mono text-sm space-y-2">
              {[
                { icon: "✓", text: "Cloning repository...", color: "text-green-400" },
                { icon: "✓", text: "Parsing 47 files (8,234 lines)", color: "text-green-400" },
                { icon: "✓", text: "Detected: TypeScript, Python", color: "text-green-400" },
                { icon: "►", text: "Running security analysis...", color: "text-purple-400" },
                { icon: " ", text: "Scanning for injection vulnerabilities", color: "text-muted-foreground" },
                { icon: " ", text: "Checking authentication flows", color: "text-muted-foreground" },
              ].map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-center gap-3"
                >
                  <span className={line.color}>{line.icon}</span>
                  <span className={line.color === "text-muted-foreground" ? "text-muted-foreground" : "text-foreground"}>
                    {line.text}
                  </span>
                </motion.div>
              ))}
              <motion.div
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="w-2 h-4 bg-purple-400 inline-block"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-2xl mx-auto"
        >
          <h2 className="text-5xl font-bold text-white mb-6">Ship safer code today</h2>
          <p className="text-muted-foreground text-lg mb-10">
            Join developers who use Code Insight to catch bugs before their users do.
          </p>
          <Button
            onClick={() => setLocation("/sign-up")}
            data-testid="button-cta-signup"
            className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 text-base font-semibold rounded-xl glow-purple transition-all duration-200 h-auto"
          >
            Start reviewing code <ChevronRight size={18} className="ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-muted-foreground text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Code2 size={16} className="text-purple-400" />
          <span className="text-white font-semibold">Code Insight</span>
        </div>
        <p>AI-powered code review for serious developers.</p>
      </footer>
    </div>
  );
}
