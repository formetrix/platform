import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Large recommendation surface. Engine not implemented — placeholder only (FM-0013).
 */
export function RecommendationCard() {
  return (
    <Card className="shadow-soft border-primary/20 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-xl">Recommendation</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-[140px] flex-col justify-center gap-2">
        <p className="text-lg font-medium tracking-tight">
          Recommendation engine not yet implemented.
        </p>
        <p className="text-muted text-sm">
          Later tickets will populate this card with an explainable Property-level recommendation.
          It will never be presented as a verified fact.
        </p>
      </CardContent>
    </Card>
  );
}
