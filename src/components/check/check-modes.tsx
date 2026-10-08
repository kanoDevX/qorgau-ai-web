"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MessageSquareText, PhoneIncoming, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { CallMode } from "./call-mode";
import { OmniCheck } from "./omni-check";
import { TransferCheck } from "./transfer-check";

const MODES = ["message", "call", "transfer"] as const;
type Mode = (typeof MODES)[number];

/** The three situations people are in when they open "Check" (§5.2/§5.3). The mode lives in the URL. */
export function CheckModes() {
  const t = useTranslations("check.modes");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get("mode");
  const mode: Mode = (MODES as readonly string[]).includes(raw ?? "") ? (raw as Mode) : "message";

  return (
    <Tabs
      value={mode}
      onValueChange={(v) => router.replace(v === "message" ? pathname : `${pathname}?mode=${v}`, { scroll: false })}
    >
      <TabsList className="mb-5 flex-wrap">
        <TabsTrigger value="message">
          <MessageSquareText className="size-3.5" aria-hidden /> {t("message")}
        </TabsTrigger>
        <TabsTrigger value="call">
          <PhoneIncoming className="size-3.5" aria-hidden /> {t("call")}
        </TabsTrigger>
        <TabsTrigger value="transfer">
          <Wallet className="size-3.5" aria-hidden /> {t("transfer")}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="message">
        <OmniCheck />
      </TabsContent>
      <TabsContent value="call">
        <CallMode />
      </TabsContent>
      <TabsContent value="transfer">
        <TransferCheck />
      </TabsContent>
    </Tabs>
  );
}
