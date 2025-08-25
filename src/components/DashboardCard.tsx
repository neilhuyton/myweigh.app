// src/components/DashboardCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';
import { useRouter } from '@tanstack/react-router';

type DashboardCardProps = {
  title: string;
  icon: LucideIcon;
  value: string | null;
  description: string | null;
  buttonText: string;
  buttonLink: string;
  testId?: string; // Optional for testing purposes
};

export function DashboardCard({
  title,
  icon: Icon,
  value,
  description,
  buttonText,
  buttonLink,
  testId,
}: DashboardCardProps) {
  const router = useRouter();

  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value ?? 'No data'}</div>
        <p className="text-xs text-muted-foreground">{description ?? 'No description'}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => router.navigate({ to: buttonLink })}
          data-testid={testId ? `${testId}-button` : undefined}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}