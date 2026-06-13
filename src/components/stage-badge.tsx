import type { Stage } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { STAGE_COLOR, STAGE_SHORT } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StageBadge({
  stage,
  group,
  className,
}: {
  stage: Stage;
  group?: string | null;
  className?: string;
}) {
  const label =
    stage === "GROUP" && group
      ? group.replace("Group", "Groupe")
      : STAGE_SHORT[stage];
  return (
    <Badge className={cn(STAGE_COLOR[stage], className)}>{label}</Badge>
  );
}
