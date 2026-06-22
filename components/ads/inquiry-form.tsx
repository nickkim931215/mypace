"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PricingTable } from "@/components/ads/pricing-table";
import { BannerSlotPicker } from "@/components/ads/banner-slot-picker";
import {
  isValidYoutubeUrl,
  type BannerSlot,
  type InquiryErrorCode,
} from "@/lib/inquiry";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT, type TranslateFn } from "@/lib/i18n";

function errorMessage(code: InquiryErrorCode | undefined, t: TranslateFn): string {
  switch (code) {
    case "bad_format":
      return t("잘못된 요청 형식입니다.", "Invalid request format.");
    case "bad_youtube":
      return t("유효한 YouTube URL을 입력해주세요.", "Please enter a valid YouTube URL.");
    case "bad_name":
      return t("이름을 입력해주세요.", "Please enter your name.");
    case "bad_phone":
      return t("유효한 핸드폰 번호를 입력해주세요.", "Please enter a valid phone number.");
    case "bad_slot":
      return t("배너 번호는 1~4 중 선택해주세요.", "Please choose a banner from 1 to 4.");
    case "bad_duration":
      return t("노출 기간을 선택해주세요.", "Please select a display period.");
    default:
      return t("전송 중 오류가 발생했습니다.", "Something went wrong while submitting.");
  }
}

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; delivered: boolean }
  | { kind: "error"; message: string };

export function InquiryForm() {
  const t = useT();
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
          message: errorMessage(data?.code, t),
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
        message: t("네트워크 오류가 발생했습니다.", "A network error occurred."),
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
          {t("문의가 접수되었습니다", "Your inquiry has been received")}
        </h3>
        <p className="mt-3 text-foreground-muted text-[14px] leading-relaxed max-w-md">
          {t(
            "관리자가 영업일 기준 1~2일 내에 입력하신 번호로 연락드리고,",
            "We'll contact you at the number you provided within 1–2 business days,",
          )}
          <br className="hidden sm:block" />
          {t(
            "계좌이체 안내와 배너 노출 일정을 함께 전달드릴게요.",
            "along with bank transfer details and your banner schedule.",
          )}
        </p>
        {!status.delivered && (
          <p className="mt-4 text-[12px] text-foreground-dim">
            {t(
              "(개발 모드 — 실제 이메일은 전송되지 않았습니다)",
              "(Dev mode — no email was actually sent)",
            )}
          </p>
        )}
        <Button
          variant="secondary"
          size="md"
          className="mt-8"
          onClick={() => setStatus({ kind: "idle" })}
        >
          {t("새 문의 작성", "Write a new inquiry")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <Section
        label={t("노출 기간", "Display period")}
        hint={t("원하는 기간을 선택하세요", "Choose your preferred period")}
      >
        <PricingTable selected={durationDays} onSelect={setDurationDays} />
      </Section>

      <Section
        label={t("희망 배너 위치", "Preferred banner position")}
        hint={t("홈 화면 4개 슬롯 중", "One of 4 home screen slots")}
      >
        <BannerSlotPicker selected={bannerSlot} onSelect={setBannerSlot} />
      </Section>

      <Section
        label="YouTube URL"
        hint={t("배너에서 재생될 영상", "Video that plays in the banner")}
      >
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
            {t("올바른 YouTube 링크를 입력해주세요.", "Please enter a valid YouTube link.")}
          </p>
        )}
      </Section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Section label={t("이름 / 채널명", "Name / channel name")}>
          <Input
            placeholder={t("홍길동", "Jane Doe")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            required
          />
        </Section>
        <Section label={t("핸드폰 번호", "Phone number")}>
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

      <Section label={t("메시지", "Message")} hint={t("선택", "Optional")}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder={t(
            "문의사항이나 영상 소개를 자유롭게 적어주세요.",
            "Feel free to add any questions or a description of your video.",
          )}
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
        {status.kind === "submitting"
          ? t("전송 중...", "Submitting...")
          : t("문의 접수하기", "Submit inquiry")}
      </Button>

      <p className="text-[12px] text-foreground-dim leading-relaxed">
        {t("결제는 ", "Payment is made via ")}
        <span className="text-foreground-muted">{t("계좌이체", "bank transfer")}</span>
        {t(
          "로 진행되며, 관리자가 문의 확인 후 입금 안내와 노출 일정을 안내해드립니다.",
          ". After we review your inquiry, we'll share deposit details and your display schedule.",
        )}
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
