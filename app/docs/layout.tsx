import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yiling Docs — Oracle-Free Truth Discovery Infrastructure",
  description:
    "Documentation for Yiling Protocol. Learn how to build with oracle-free truth discovery powered by game theory.",
  openGraph: {
    title: "Yiling Docs — Oracle-Free Truth Discovery Infrastructure",
    description:
      "Documentation for Yiling Protocol. Learn how to build with oracle-free truth discovery powered by game theory.",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
