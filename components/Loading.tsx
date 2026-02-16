"use client";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200"></div>
            <div className="w-16 h-16 rounded-full border-4 border-gray-900 border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>

          {/* Loading text */}
          <p className="text-gray-500 font-light tracking-wide">
            Please wait...
          </p>
        </div>
      </div>
    </div>
  );
}
