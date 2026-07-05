export function Loading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  );
}

export function ErrorAlert({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-start gap-3">
      <span className="mt-0.5 shrink-0">⚠️</span>
      <div className="flex-1">{message}</div>
      {onRetry && (
        <button onClick={onRetry} className="text-red-600 underline hover:no-underline shrink-0">重试</button>
      )}
    </div>
  );
}

export function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 text-sm flex items-center gap-3">
      <span>✅</span> {message}
    </div>
  );
}
