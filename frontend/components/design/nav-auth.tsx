"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NavAuth() {
  return (
    <div className="flex items-center gap-4">
      <Link
        href="/dashboard"
        className="font-mono text-[12px] tracking-[0.06em] text-text-2 hover:text-text transition-colors"
      >
        Sign In
      </Link>
      
      <Link 
        href="/dashboard" 
        className="hidden sm:inline-flex items-center gap-2 font-mono text-[12px] font-semibold tracking-[0.04em] px-4 py-2 rounded-[7px] bg-cobalt text-white shadow-[0_0_0_1px_var(--cobalt-deep),0_6px_18px_-10px_var(--cobalt-glow)] hover:bg-cobalt-bright transition-all hover:-translate-y-[1px] group"
      >
        Launch Planner
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-[3px] transition-transform" />
      </Link>
    </div>
  );
}