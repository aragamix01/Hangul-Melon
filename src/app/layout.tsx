import type { Metadata, Viewport } from "next";
import { Nunito, Noto_Sans_Thai, Gowun_Dodum, Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-latin",
  display: "swap",
});

const notoThai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-thai",
  display: "swap",
});

const gowun = Gowun_Dodum({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-ko",
  display: "swap",
});

const notoKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-ko-sans",
  display: "swap",
});

/**
 * A third Korean face, used only by the quiz.
 *
 * A letter drilled in one typeface for a fortnight is learned as that
 * typeface's drawing of it, which is no use in front of a shop sign. The
 * serif's strokes thicken, taper and carry serifs the rounded faces do not,
 * so recognising a letter across all three means recognising the letter.
 */
const notoSerifKr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-ko-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hangul Melon · เรียนพยัญชนะและสระเกาหลี",
  description:
    "เรียนพยัญชนะและสระเกาหลีครบ 40 ตัว เรียงตามลำดับที่จำง่าย พร้อมเสียงอ่านเจ้าของภาษา บัตรคำ ผสมคำ และเกมฝึก",
  applicationName: "Hangul Melon",
  manifest: undefined,
};

export const viewport: Viewport = {
  themeColor: "#FBF0F4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      className={`${nunito.variable} ${notoThai.variable} ${gowun.variable} ${notoKr.variable} ${notoSerifKr.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
