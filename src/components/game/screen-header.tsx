import { Moon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "src/lib/utils";

/**
 * The strip above every screen: where the game is, how far along, and the options menu.
 * @param props.label - The phase name, shown at the left unless `leading` replaces it; omit for a header with only the menu.
 * @param props.progress - Optional centred progress text, such as "Step 1 / 2".
 * @param props.leading - Optional control that takes the label's place, such as a Back button.
 * @param props.menu - Optional options menu, pinned to the right.
 * @returns The header row.
 */
export function ScreenHeader({
  label,
  progress,
  leading,
  menu,
}: {
  label?: string;
  progress?: string;
  leading?: ReactNode;
  menu?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "min-h-11 gap-2",
        "grid grid-cols-[1fr_auto_1fr] items-center",
      )}
    >
      <div className={cn("justify-self-start")}>
        {leading ??
          (label === undefined ? null : (
            <div className={cn("gap-2.5", "flex items-center")}>
              <Moon aria-hidden="true" className="size-5 text-phase-name" />
              <span className="font-heading font-bold text-xl">{label}</span>
            </div>
          ))}
      </div>
      <span className="text-muted-foreground text-sm">{progress}</span>
      <div className={cn("justify-self-end")}>{menu}</div>
    </header>
  );
}
