import Skeleton from './Skeleton';

export default function MatchRowSkeleton() {
  return (
    <div className="grid items-center gap-3 px-5 py-3" style={{ gridTemplateColumns: '48px 1fr 14px' }}>
      <Skeleton className="h-3.5 w-10 rounded-md" />
      <div className="flex flex-col gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3 flex-1 max-w-[45%] rounded-md" />
            <Skeleton className="ml-auto h-3 w-5 rounded-md" />
          </div>
        ))}
      </div>
      <Skeleton className="h-3.5 w-3.5 rounded-md" />
    </div>
  );
}
