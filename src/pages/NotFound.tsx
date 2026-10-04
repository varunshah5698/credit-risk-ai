import { motion } from "framer-motion";
import { Link } from "react-router";
import { ArrowLeft, Radar } from "lucide-react";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative flex min-h-screen flex-col items-center justify-center px-6"
    >
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-40 [mask-image:radial-gradient(60%_50%_at_50%_40%,black,transparent)]" />
      <div className="relative text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
          <Radar className="size-6" />
        </div>
        <h1 className="num mt-6 text-6xl font-bold tracking-tight text-glow text-primary">
          404
        </h1>
        <p className="mt-3 font-display text-xl font-semibold tracking-tight">
          Signal lost
        </p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          This page isn&apos;t in the scanned universe. The Risk Terminal, however, is
          right where you left it.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <ArrowLeft className="size-4" /> Back to base
        </Link>
      </div>
    </motion.div>
  );
}
