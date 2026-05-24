import {
  Film,
  Sparkles,
  Palette,
  Scissors,
  Share2,
  Music,
  type LucideIcon,
} from "lucide-react";
import type { ServiceIcon } from "@/lib/content";

const MAP: Record<ServiceIcon, LucideIcon> = {
  film: Film,
  sparkles: Sparkles,
  palette: Palette,
  scissors: Scissors,
  share: Share2,
  music: Music,
};

export function ServiceGlyph({
  name,
  className,
}: {
  name: ServiceIcon;
  className?: string;
}) {
  const Icon = MAP[name];
  return <Icon className={className} aria-hidden="true" />;
}
