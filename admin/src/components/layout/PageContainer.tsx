import type { ReactNode } from "react";
import { Header } from "./Header";

interface PageContainerProps {
  title: string;
  children: ReactNode;
}

export function PageContainer({ title, children }: PageContainerProps) {
  return (
    <>
      <Header title={title} />
      <main className="p-6">{children}</main>
    </>
  );
}
