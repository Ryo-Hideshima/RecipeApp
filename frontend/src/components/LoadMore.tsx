export function LoadMore({
  show,
  loading,
  onClick,
}: {
  show: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  if (!show) return null;
  return (
    <div className="mt-6 text-center">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="rounded-[10px] border border-line bg-white px-5 py-2.5 text-sm font-bold hover:border-accent disabled:opacity-60"
      >
        {loading ? "読み込み中…" : "もっと見る"}
      </button>
    </div>
  );
}
