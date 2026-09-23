export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  
  // Splits by any whitespace character sequence (space, tab, newline, non-breaking space, zero-width spaces, etc.)
  const tokens = trimmed.split(/\s+/).filter(token => token.length > 0);
  return tokens.length;
}

export type WordCountStatus = "empty" | "under" | "valid" | "over";

export interface WordCountFeedback {
  count: number;
  minWords: number;
  maxWords: number;
  status: WordCountStatus;
  isValid: boolean;
  message: string;
  remainingToMin: number;
  excessOverMax: number;
}

export function getWordCountFeedback(
  text: string | null | undefined,
  minWords: number = 150,
  maxWords: number = 180
): WordCountFeedback {
  const count = countWords(text);
  const effectiveMin = minWords > 0 ? minWords : 150;
  const effectiveMax = maxWords > 0 ? maxWords : 180;

  if (count === 0) {
    return {
      count: 0,
      minWords: effectiveMin,
      maxWords: effectiveMax,
      status: "empty",
      isValid: false,
      message: `المطلوب كتابة برجراف يحتوي على ${effectiveMin} إلى ${effectiveMax} كلمة.`,
      remainingToMin: effectiveMin,
      excessOverMax: 0,
    };
  }

  if (count < effectiveMin) {
    const diff = effectiveMin - count;
    return {
      count,
      minWords: effectiveMin,
      maxWords: effectiveMax,
      status: "under",
      isValid: false,
      message: `متبقي ${diff} ${diff === 1 ? "كلمة واحدة" : diff === 2 ? "كلمتان" : diff <= 10 ? "كلمات" : "كلمة"} للوصول للحد الأدنى المطلوب (${effectiveMin} كلمة).`,
      remainingToMin: diff,
      excessOverMax: 0,
    };
  }

  if (count > effectiveMax) {
    const diff = count - effectiveMax;
    return {
      count,
      minWords: effectiveMin,
      maxWords: effectiveMax,
      status: "over",
      isValid: false,
      message: `تجاوزت الحد الأقصى بـ ${diff} ${diff === 1 ? "كلمة واحدة" : diff === 2 ? "كلمتان" : diff <= 10 ? "كلمات" : "كلمة"} (الحد الأقصى: ${effectiveMax} كلمة).`,
      remainingToMin: 0,
      excessOverMax: diff,
    };
  }

  return {
    count,
    minWords: effectiveMin,
    maxWords: effectiveMax,
    status: "valid",
    isValid: true,
    message: `✓ عدد الكلمات ممتاز ومطابق للشروط (${count} كلمة).`,
    remainingToMin: 0,
    excessOverMax: 0,
  };
}
