import { BotMessageSquare } from "lucide-react";

export default function RecommendationsCard({
  recommendation,
}: { recommendation: string }) {
  if (!recommendation) return null;
  return (
    <div
      className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-xl p-4"
      data-ocid="shield.recommendations_card"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <BotMessageSquare className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold text-primary mb-1 tracking-wide">
            AI Recommendation
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}
