import LoaderSkeleton from './LoaderSkeleton';

export default function Skeleton({ className = '', ...props }) {
  return <LoaderSkeleton className={`rounded-xl ${className}`} {...props} />;
}
