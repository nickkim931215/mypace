"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PricingTable } from "@/components/ads/pricing-table";
import { BannerSlotPicker } from "@/components/ads/banner-slot-picker";
import { isValidYoutubeUrl, type BannerSlot } from "@/lib/inquiry";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; delivered: boolean }
  | { kind: "error"; message: string };

export function InquiryForm() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bannerSlot, setBannerSlot] = useState<BannerSlot>(1);
  const [durationDays, setDurationDays] = useState<30 | 60 | 90>(30);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const ytTouched = youtubeUrl.length > 0;
  const ytValid = isValidYoutubeUrl(youtubeUrl);

  const canSubmit =
    youtubeUrl &&
    ytValid &&
    name.trim().length > 0 &&
    phone.trim().length >= 9 &&
    status.kind !== "submitting";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl,
          name: name.trim(),
          phone: phone.trim(),
          bannerSlot,
          durationDays,
          message: message.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({
          kind: "error",
          message: data?.error ?? "전송 중 오류가 발생했습니다.",
        });
        return;
      }
      setStatus({ kind: "success", delivered: !!data.delivered });
      setYoutubeUrl("");
      setName("");
      setPhone("");
      setMessage("");
    } catch {
      setStatus({
        kind: "error",
        message: "네트워크 오류가 발생했습니다.",
      });
    }
  }

  if (status.kind === "success") {
    return (
      <div className="card-premium p-8 sm:p-10 flex flex-col items-center text-center">
        <div className="h-14 w-14 rounded-full bg-accent/15 text-accent flex items-center justify-center">
          <CheckCircle2 size={28} />
        </div>
        <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">
          문의가 접수되었습니다
        </h3>
        <p className="mt-3 text-foreground-muted text-[14px] leading-relaxed max-w-md">
          관리자가 영업일 기준 1~2일 내에 입력하신 번호로 연락드리고,
          <br className="hidden sm:block" />
          계좌이체 안내와 배너 노출 일정을 함께 전달드릴게요.
        </p>
        {!status.delivered && (
          <p className="mt-4 text-[12px] text-foreground-dim">
            (개발 모드 — 실제 이메일은 전송되지 않았습니다)
          </p>
        )}
        <Button
          variant="secondary"
          size="md"
          className="mt-8"
          onClick={() => setStatus({ kind: "idle" })}
        >
          새 문의 작성
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <Section label="노출 기간" hint="원하는 기간을 선택하세요">
        <PricingTable selected={durationDays} onSelect={setDurationDays} />
      </Section>

      <Section label="희망 배너 위치" hint="홈 화면 4개 슬롯 중">
        <BannerSlotPicker selected={bannerSlot} onSelect={setBannerSlot} />
      </Section>

      <Section label="YouTube URL" hint="배너에서 재생될 영상">
        <Input
          type="url"
          inputMode="url"
          placeholder="https://youtube.com/watch?v=..."
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          invalid={ytTouched && !ytValid}
          required
        />
        {ytTouched && !ytValid && (
          <p className="mt-2 text-[12px] text-danger">
            올바른 YouTube 링크를 입력해주세요.
          </p>
        )}
      </Section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Section label="이름 / 채널명">
          <Input
            placeholder="홍길동"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            required
          />
        </Section>
        <Section label="핸드폰 번호">
          <Input
            type="tel"
            inputMode="tel"
            placeholder="010-1234-5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </Section>
      </div>

      <Section label="메시지" hint="선택">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="문의사항이나 영상 소개를 자유롭게 적어주세요."
          className="w-full bg-surface-1 border border-border-subtle rounded-2xl px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/30 transition-all resize-none"
        />
      </Section>

      {status.kind === "error" && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-danger/10 border border-danger/30 text-danger">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="text-[14px]">{status.message}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={!canSubmit}
        className="w-full sm:w-auto sm:self-start"
      >
        <Send size={16} />
        {status.kind === "submitting" ? "전송 중..." : "문의 접수하기"}
      </Button>

      <p className="text-[12px] text-foreground-dim leading-relaxed">
        결제는 <span className="text-foreground-muted">계좌이체</span>로 진행되며,
        관리자가 문의 확인 후 입금 안내와 노출 일정을 안내해드립니다.
      </p>
    </form>
  );
}

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline gap-2 px-1">
        <span className="text-[11px] uppercase tracking-[0.18em] text-foreground-dim">
          {label}
        </span>
        {hint && (
          <span className="text-[11px] text-foreground-dim">— {hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Input({
  invalid,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      className={cn(
        "h-12 w-full bg-surface-1 border rounded-full px-5 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all",
        invalid
          ? "border-danger/60"
          : "border-border-subtle focus:border-border-strong",
        className,
      )}
    />
  );
}
