import Link from "next/link";
import { EN_HOME_PATH } from "@/lib/en";
import { CONTAINER, cx } from "@/lib/ui";

export default function NotFound() {
  return (
    <div className={cx(CONTAINER.page, "py-32 text-center")}>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-4"><Link href={EN_HOME_PATH} className="underline">Back to the research index</Link></p>
    </div>
  );
}
