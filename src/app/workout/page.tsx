import { Suspense } from "react";
import { WorkoutPageInner } from "./workout-content";

export default function WorkoutPage() {
  return (
    <Suspense fallback={null}>
      <WorkoutPageInner />
    </Suspense>
  );
}
