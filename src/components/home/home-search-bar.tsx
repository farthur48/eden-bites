"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function HomeSearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/menu?q=${encodeURIComponent(q)}` : "/menu");
      }}
      className="relative"
      role="search"
    >
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-500" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search for meals..."
        autoComplete="off"
        enterKeyHint="search"
        className="h-11 w-full rounded-full bg-gray-100 px-4 pl-11 pr-4 text-sm text-foreground placeholder:text-gray-500 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A3E635]/50"
        aria-label="Search for meals"
      />
    </form>
  );
}
