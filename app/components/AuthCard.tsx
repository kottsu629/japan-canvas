export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold tracking-widest text-center mb-8">
          JAPAN CANVAS
        </h1>
        {children}
      </div>
    </div>
  );
}
