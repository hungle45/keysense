interface CountdownSplashProps {
  value: number;  // 3, 2, 1
}

export function CountdownSplash({ value }: CountdownSplashProps) {
  return (
    <div className="fixed inset-0 bg-background/95 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="text-9xl font-bold animate-pulse">
          {value}
        </div>
        <p className="text-xl text-muted-foreground mt-4">
          Get ready...
        </p>
      </div>
    </div>
  );
}
