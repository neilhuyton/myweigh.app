// src/components/ColorThemeToggle.tsx
import { useCustomTheme } from "../hooks/useCustomTheme";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ColorThemeToggle() {
  const { setColorTheme } = useCustomTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" data-testid="color-theme-toggle">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle color theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setColorTheme("default")}>
          Default
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorTheme("red")}>
          Red
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorTheme("rose")}>
          Rose
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorTheme("orange")}>
          Orange
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorTheme("green")}>
          Green
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorTheme("blue")}>
          Blue
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorTheme("yellow")}>
          Yellow
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorTheme("violet")}>
          Violet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
