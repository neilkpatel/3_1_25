import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

interface CountdownTimerProps {
  duration: number;
  onComplete: () => void;
}

export function CountdownTimer({ duration, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const progress = (timeLeft / duration) * 100;

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  return (
    <div className="space-y-2">
      <Progress value={progress} className="w-full" />
      <p className="text-center text-sm text-muted-foreground">
        {timeLeft} seconds remaining
      </p>
    </div>
  );
}
