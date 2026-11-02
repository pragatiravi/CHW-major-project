export function SkeletonCard({ count = 1 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx} 
          className="p-4 rounded-xl border border-slate-200 bg-white animate-pulse space-y-2.5"
          aria-hidden="true"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-200 rounded w-1/6" />
          </div>
          <div className="h-3 bg-slate-100 rounded w-2/3" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTableRow({ rows = 4, cols = 5 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="animate-pulse border-b border-slate-100">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="p-3">
              <div className="h-3.5 bg-slate-200 rounded w-4/5" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export default function SkeletonLoader({ type = 'card', count = 3 }) {
  if (type === 'table') {
    return <SkeletonTableRow rows={count} />;
  }
  return <SkeletonCard count={count} />;
}
