import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Compass,
  Copy,
  FileSearch,
  Gauge,
  Globe,
  Landmark,
  LineChart,
  Loader2,
  MapPin,
  Maximize2,
  MoveRight,
  Notification,
  Palette,
  PenLine,
  PlayCircle,
  Plus,
  Radar,
  RefreshCw,
  Save,
  ScanSearch,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Terminal,
  TrendingUp,
  Trophy,
  User,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  assessRisk,
  CREDITS,
  fmtMoney,
  fmtPct,
  fmtTonnes,
  scoredCredits,
  type Credit,
} from "@/lib/credits";
import { cn } from "@/lib/utils";
import { RiskFactorCard, ComparableCredits, CreditDetailCard } from "@/components/dashboard-shell";

const SCAN_KINDS = [
  { id: "mispricing", label: "Mispricing radar", icon: <Radar className="size-4" /> },
  { id: "negotiation", label: "Negotiation intelligence", icon: <PenLine className="size-4" /> },
  { id: "portfolio", label: "Portfolio optimization", icon: <TrendingUp className="size-4" /> },
  { id: "fraud", label: "Fraud detection", icon: <ShieldCheck className="size-4" /> },
  { id: "whatif", label: "What-if simulator", icon: <PlayCircle className="size-4" /> },
  { id: "alerts", label: "Regulatory alerts", icon: <Notification className="size-4" /> },
  { id: "env", label: "Environmental / satellite", icon: <Globe className="size-4" /> },
  { id: "activity", label: "AI agent timeline", icon: <Sparkles className="size-4" /> },
  { id: "analytics", label: "Marketplace analytics", icon: <BarChart3 className="size-4" /> },
  { id: "nlp", label: "NLP financial terminal", icon: <Terminal className="size-4" /> },
  { id: "waterfall", label: "Valuation waterfall", icon: <Gauge className="size-4" /> },
  { id: "decomposition", label: "Risk decomposition", icon: <ArrowRight className="size-4" /> },
  { id: "graph", label: "Evidence graph", icon: <Code className="size-4" /> },
  { id: "heatmap", label: "Portfolio heatmap", icon: <LayoutDashboard className="size-4" /> },
  { id: "audit", label: "Transaction audit trail", icon: <FileSearch className="size-4" /> },
  { id: "receipt", label: "Digital ownership receipt", icon: <Star className="size-4" /> },
];
