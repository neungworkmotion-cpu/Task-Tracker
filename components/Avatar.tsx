import type { UserDoc } from "@/lib/types";

const SIZES = { sm: "h-6 w-6 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-10 w-10 text-sm" };

export default function Avatar({
  user,
  size = "md",
  title,
}: {
  user: UserDoc | null | undefined;
  size?: keyof typeof SIZES;
  title?: string;
}) {
  const cls = `${SIZES[size]} shrink-0 rounded-full object-cover`;
  if (!user) {
    return (
      <span
        className={`${cls} inline-flex items-center justify-center bg-slate-200 text-slate-400`}
        title={title ?? "ยังไม่มีคนรับ"}
      >
        ?
      </span>
    );
  }
  if (user.photoURL) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.photoURL} alt={user.displayName} title={title ?? user.displayName} className={cls} referrerPolicy="no-referrer" />;
  }
  return (
    <span
      className={`${cls} inline-flex items-center justify-center bg-indigo-500 font-semibold text-white`}
      title={title ?? user.displayName}
    >
      {user.displayName.slice(0, 2).toUpperCase()}
    </span>
  );
}
