import BallLoader from "@/components/ui/BallLoader";

export default function Loading() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-6">
      <BallLoader size={48} />
      <p className="font-body text-caption uppercase tracking-[0.28em] text-chalk/50">
        Checking the roster…
      </p>
    </div>
  );
}
