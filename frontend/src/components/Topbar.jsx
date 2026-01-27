export function Topbar({ title }) {
  return (
    <div className="h-16 border-b border-border bg-white px-6 flex items-center">
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}
