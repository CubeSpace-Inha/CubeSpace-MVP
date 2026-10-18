import logo from "../assets/logo.svg";

// 로고(시안 I · LED 글자): 점 글꼴로 쓴 CUBE / SPACE. 마크가 곧 이름이다. 48 px 안팎부터 읽힌다.
export function Logo({ size, className }: { size: number; className?: string }) {
  return <img src={logo} alt="CUBE SPACE" width={size} height={size} className={className} draggable={false} />;
}
