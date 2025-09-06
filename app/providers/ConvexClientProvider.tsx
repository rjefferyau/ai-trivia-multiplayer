"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { ReactNode, useMemo } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoaded } = useAuth();

  const convexWithAuth = useMemo(
    () => ({
      client: convex,
      auth: async () => {
        if (!isLoaded) return null;
        const token = await getToken({ template: "convex" });
        return token ?? null;
      },
    }),
    [getToken, isLoaded]
  );

  return (
    <ConvexProvider client={convexWithAuth.client}>
      {children}
    </ConvexProvider>
  );
}