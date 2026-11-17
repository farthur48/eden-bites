import Image from "next/image";
import Link from "next/link";

const categories = [
  { label: "Rice", href: "/menu?category=rice", image: "/categories/rice.jpg" },
  { label: "Local Meals", href: "/menu?category=local-meals", image: "/categories/local-meals.jpg" },
  { label: "Chicken", href: "/menu?category=chicken", image: "/categories/chicken.jpg" },
  { label: "Sides", href: "/menu?category=sides", image: "/categories/sides.jpg" },
];

export function CategoryShortcuts() {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {categories.map((cat) => (
        <Link
          key={cat.label}
          href={cat.href}
          className="flex flex-col items-center justify-center rounded-2xl border border-[#14532D]/10 bg-[#F4F6EE] px-1.5 py-3 text-center shadow-sm transition-all hover:border-[#14532D]/20 hover:shadow-md"
        >
          <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-full bg-white">
            <Image src={cat.image} alt={cat.label} fill sizes="40px" className="object-cover" />
          </span>
          <span className="mt-1.5 whitespace-nowrap text-[13px] font-semibold text-gray-900">{cat.label}</span>
        </Link>
      ))}
    </div>
  );
}
