import * as T from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = T.Root;

export const TabsList = ({ className, ...p }) => (
  <T.List className={cn("inline-flex h-9 items-center gap-0.5 rounded-lg bg-muted p-[3px]", className)} {...p} />
);

export const TabsTrigger = ({ className, ...p }) => (
  <T.Trigger
    className={cn(
      "inline-flex h-[calc(100%-1px)] cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-medium text-muted-foreground outline-none transition-all hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-accent",
      className
    )}
    {...p}
  />
);
