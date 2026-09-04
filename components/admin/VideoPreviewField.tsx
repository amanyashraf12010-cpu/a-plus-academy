"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Video, 
  RefreshCw, 
  ShieldCheck, 
  Info, 
  Clock, 
  ExternalLink,
  HelpCircle,
  Eye
} from "lucide-react";

export type VideoProvider = "bunny" | "youtube" | "vimeo" | "direct" | "unknown";

export type VideoStatus = 
  | "UNREVIEWED"        // 🟡 لم تتم المراجعة
  | "LOADING"           // 🔵 جاري تحميل المعاينة
  | "READY_FOR_CONFIRM" // 🟣 قيد المعاينة
  | "VERIFIED"          // 🟢 تم التأكد من الفيديو
  | "ERROR"             // 🔴 خطأ في تحميل الفيديو
  | "EXISTING";         // ⚪ فيديو محفوظ مسبقاً

interface ParsedVideo {
  valid: boolean;
  provider: VideoProvider;
  providerLabel: string;
  embedUrl: string | null;
  videoId: string | null;
  libraryId?: string | null;
  error?: string;
}

interface VideoPreviewFieldProps {
  value: string;
  onChange: (url: string) => void;
  isVerified: boolean;
  onVerifiedChange: (verified: boolean) => void;
  initialVerified?: boolean;
  disabled?: boolean;
}

// Helper to format seconds to MM:SS or HH:MM:SS
function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function parseVideoDetails(rawUrl: string): ParsedVideo {
  if (!rawUrl || !rawUrl.trim()) {
    return {
      valid: false,
      provider: "unknown",
      providerLabel: "غير محدد",
      embedUrl: null,
      videoId: null,
      error: "الرابط فارغ",
    };
  }

  let cleanUrl = rawUrl.trim();

  // 1. If full <iframe> snippet was pasted, extract the src attribute
  if (cleanUrl.startsWith("<iframe") || cleanUrl.includes("<iframe")) {
    const srcMatch = cleanUrl.match(/src=["']([^"']+)["']/);
    if (srcMatch && srcMatch[1]) {
      cleanUrl = srcMatch[1].trim();
    }
  }

  // 2. Bunny Stream Embed / Play Links
  if (
    cleanUrl.includes("iframe.mediadelivery.net") ||
    cleanUrl.includes("mediadelivery.net") ||
    cleanUrl.includes("bunnycdn.com") ||
    cleanUrl.includes("bunny.net")
  ) {
    // Normalization: replace video.bunnycdn.com with iframe.mediadelivery.net
    cleanUrl = cleanUrl.replace("video.bunnycdn.com", "iframe.mediadelivery.net");
    
    // Convert /play/ to /embed/
    if (cleanUrl.includes("/play/")) {
      cleanUrl = cleanUrl.replace("/play/", "/embed/");
    }

    // Match libraryId and videoId: /embed/{libraryId}/{videoId} or /play/{libraryId}/{videoId}
    const bunnyMatch = cleanUrl.match(/(?:embed|play)\/(\d+)\/([a-zA-Z0-9-]+)/);
    const libraryId = bunnyMatch ? bunnyMatch[1] : null;
    const videoId = bunnyMatch ? bunnyMatch[2] : null;

    // Ensure it starts with https://
    let embedUrl = cleanUrl;
    if (!embedUrl.startsWith("http://") && !embedUrl.startsWith("https://")) {
      embedUrl = `https://${embedUrl}`;
    }

    return {
      valid: true,
      provider: "bunny",
      providerLabel: "Bunny Stream 🐰",
      embedUrl,
      videoId: videoId || "متاح",
      libraryId: libraryId || undefined,
    };
  }

  // 3. YouTube Links
  const ytReg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = cleanUrl.match(ytReg);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      valid: true,
      provider: "youtube",
      providerLabel: "YouTube ▶️",
      embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`,
      videoId,
    };
  }

  // 4. Vimeo Links
  const vimeoReg = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
  const vimeoMatch = cleanUrl.match(vimeoReg);
  if (vimeoMatch && vimeoMatch[3]) {
    const videoId = vimeoMatch[3];
    return {
      valid: true,
      provider: "vimeo",
      providerLabel: "Vimeo 🎬",
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      videoId,
    };
  }

  // 5. Direct Video Link (MP4, WEBM, OGG, M3U8 or Supabase Storage relative/absolute path)
  if (
    cleanUrl.startsWith("http://") ||
    cleanUrl.startsWith("https://") ||
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".webm") ||
    cleanUrl.endsWith(".m3u8")
  ) {
    return {
      valid: true,
      provider: "direct",
      providerLabel: "فيديو مباشر (Direct/MP4) 📁",
      embedUrl: cleanUrl,
      videoId: cleanUrl.split("/").pop() || "direct_file",
    };
  }

  // If none matched
  return {
    valid: false,
    provider: "unknown",
    providerLabel: "غير مدعوم",
    embedUrl: null,
    videoId: null,
    error: "صيغة الرابط غير مدعومة. يرجى إدخال رابط Bunny Stream أو YouTube أو Vimeo صالح.",
  };
}

export default function VideoPreviewField({
  value,
  onChange,
  isVerified,
  onVerifiedChange,
  initialVerified = false,
  disabled = false,
}: VideoPreviewFieldProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [status, setStatus] = useState<VideoStatus>(() => {
    if (!value || !value.trim()) return "UNREVIEWED";
    return isVerified ? "VERIFIED" : initialVerified ? "EXISTING" : "UNREVIEWED";
  });
  const [duration, setDuration] = useState<number | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedVideo>(() => parseVideoDetails(value));

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync parsed whenever value changes
  useEffect(() => {
    const nextParsed = parseVideoDetails(value);
    setParsed(nextParsed);
    setDuration(null);
    setLoadError(null);

    // If value changes, invalidate verification if it doesn't match verified state
    if (!value.trim()) {
      setStatus("UNREVIEWED");
      setShowPlayer(false);
      onVerifiedChange(false);
    }
  }, [value]);

  // Handle URL change from text input
  const handleInputChange = (newUrl: string) => {
    onChange(newUrl);
    setShowPlayer(false);
    setDuration(null);
    setLoadError(null);

    if (newUrl.trim() === "") {
      setStatus("UNREVIEWED");
      onVerifiedChange(false);
      return;
    }

    const testParsed = parseVideoDetails(newUrl);
    if (!testParsed.valid) {
      setStatus("ERROR");
      setLoadError(testParsed.error || "رابط الفيديو غير صالح.");
      onVerifiedChange(false);
    } else {
      setStatus("UNREVIEWED");
      onVerifiedChange(false);
    }
  };

  // Trigger preview loading
  const handleStartPreview = () => {
    if (!value.trim()) {
      setLoadError("من فضلك أدخل رابط الفيديو أولاً.");
      setStatus("ERROR");
      return;
    }

    const currentParsed = parseVideoDetails(value);
    setParsed(currentParsed);

    if (!currentParsed.valid || !currentParsed.embedUrl) {
      setLoadError(currentParsed.error || "رابط الفيديو غير صالح، يرجى التأكد من الرابط.");
      setStatus("ERROR");
      return;
    }

    setLoadError(null);
    setPlayerLoading(true);
    setStatus("LOADING");
    setShowPlayer(true);

    // Give iframe a moment to mount and initialize player listeners
    setTimeout(() => {
      setPlayerLoading(false);
      if (status !== "VERIFIED") {
        setStatus("READY_FOR_CONFIRM");
      }
    }, 1200);
  };

  // Bunny / PlayerJS setup for duration & events
  useEffect(() => {
    if (!showPlayer || !parsed.embedUrl) return;

    if (parsed.provider === "bunny") {
      const loadBunnyPlayerJs = () => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const setup = () => {
          try {
            if ((window as any).playerjs) {
              const player = new (window as any).playerjs.Player(iframe);
              player.on("ready", () => {
                setPlayerLoading(false);
                player.getDuration((d: number) => {
                  if (d && d > 0) setDuration(d);
                });
              });
              player.on("timeupdate", (data: any) => {
                if (data.duration && data.duration > 0) {
                  setDuration(data.duration);
                }
              });
              player.on("error", (err: any) => {
                console.error("Bunny Player error:", err);
                setLoadError("تعذر تشغيل فيديو Bunny Stream. تأكد من إعدادات الخصوصية والـ Library ID.");
                setStatus("ERROR");
              });
            }
          } catch (e) {
            console.warn("playerjs init error:", e);
          }
        };

        if (!(window as any).playerjs) {
          const script = document.createElement("script");
          script.src = "https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js";
          script.onload = setup;
          document.body.appendChild(script);
        } else {
          setup();
        }
      };

      const timer = setTimeout(loadBunnyPlayerJs, 800);
      return () => clearTimeout(timer);
    } else if (parsed.provider === "youtube") {
      const loadYt = () => {
        if (!(window as any).YT) {
          const tag = document.createElement("script");
          tag.src = "https://www.youtube.com/iframe_api";
          document.body.appendChild(tag);
        }
      };
      loadYt();
    }
  }, [showPlayer, parsed]);

  // Confirm verification
  const handleConfirmVideo = () => {
    setStatus("VERIFIED");
    onVerifiedChange(true);
  };

  // Reset verification
  const handleResetVerification = () => {
    setStatus("UNREVIEWED");
    onVerifiedChange(false);
    setShowPlayer(false);
  };

  return (
    <div className="space-y-3.5" dir="rtl">
      
      {/* Label and Live Status Badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
          <Video size={15} className="text-[#7D79F1]" />
          <span>رابط الفيديو (Bunny Stream / Embed URL) *</span>
        </label>

        {/* Status Badge */}
        <div>
          {status === "VERIFIED" && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-black border border-emerald-200 shadow-sm animate-in fade-in duration-200">
              <CheckCircle2 size={14} className="text-emerald-600" />
              🟢 تم التأكد من الفيديو
            </span>
          )}

          {status === "LOADING" && (
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 animate-pulse">
              <Loader2 size={14} className="animate-spin text-blue-600" />
              🔵 جاري تحميل المعاينة...
            </span>
          )}

          {status === "READY_FOR_CONFIRM" && (
            <span className="inline-flex items-center gap-1.5 bg-purple-50 text-[#7D79F1] px-3 py-1 rounded-full text-xs font-bold border border-purple-200">
              <Eye size={14} className="text-[#7D79F1]" />
              🟣 قيد المعاينة والمشاهدة
            </span>
          )}

          {status === "UNREVIEWED" && value.trim() !== "" && (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
              <AlertCircle size={14} className="text-amber-600" />
              🟡 لم تتم المراجعة بعد
            </span>
          )}

          {status === "EXISTING" && (
            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
              <CheckCircle2 size={14} className="text-gray-500" />
              ⚪ فيديو محفوظ مسبقاً
            </span>
          )}

          {status === "ERROR" && (
            <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-bold border border-rose-200">
              <AlertCircle size={14} className="text-rose-600" />
              🔴 خطأ في رابط الفيديو
            </span>
          )}
        </div>
      </div>

      {/* URL Input Bar & Quick Preview Trigger */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              required
              disabled={disabled}
              placeholder="الصق رابط Bunny Stream (مثال: https://iframe.mediadelivery.net/play/...)"
              className={`w-full px-4 py-3 rounded-xl border outline-none text-[#2D2B7A] transition font-mono text-xs ${
                status === "VERIFIED"
                  ? "border-emerald-300 bg-emerald-50/20 focus:border-emerald-500"
                  : status === "ERROR"
                  ? "border-rose-300 bg-rose-50/20 focus:border-rose-500"
                  : "border-gray-200 bg-white focus:border-[#7D79F1] focus:ring-2 focus:ring-[#7D79F1]/20"
              }`}
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={handleStartPreview}
            disabled={disabled || !value.trim()}
            className="px-4 py-3 bg-[#7D79F1] hover:bg-[#655EF0] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-bold transition text-xs shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Play size={14} />
            🔍 معاينة الفيديو
          </button>
        </div>

        <p className="text-[11px] text-gray-400 font-medium">
          يدعم روابط <strong>Bunny Stream</strong> المباشرة وكود الـ iframe، بالإضافة إلى YouTube و Vimeo.
        </p>
      </div>

      {/* Error Message Display */}
      {loadError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-rose-700 text-xs font-bold flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>⚠️ {loadError}</p>
            <p className="text-[11px] text-rose-500 font-normal">
              يرجى فحص رابط الفيديو والتأكد من نسخه بالكامل من لوحة Bunny Stream.
            </p>
          </div>
        </div>
      )}

      {/* Video Preview Box */}
      {showPlayer && parsed.valid && parsed.embedUrl && (
        <div className="bg-[#101018] rounded-2xl overflow-hidden border border-gray-800 shadow-xl space-y-0 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Player Header Bar */}
          <div className="bg-[#1A1A28] px-4 py-2.5 border-b border-gray-800 flex items-center justify-between text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-white">مشغل المعاينة المباشر</span>
              <span className="bg-purple-900/60 text-purple-200 text-[10px] px-2 py-0.5 rounded-md font-mono border border-purple-700/50">
                {parsed.providerLabel}
              </span>
            </div>

            {duration ? (
              <span className="text-[11px] text-yellow-300 font-mono flex items-center gap-1">
                <Clock size={12} />
                المدة: {formatDuration(duration)}
              </span>
            ) : null}
          </div>

          {/* Actual 16:9 Video Canvas */}
          <div className="aspect-video relative flex items-center justify-center bg-black">
            {playerLoading ? (
              <div className="text-center text-white space-y-2 p-6">
                <Loader2 className="animate-spin text-[#7D79F1] mx-auto" size={36} />
                <p className="text-xs font-bold text-gray-300">جاري تحميل مشغل الفيديو...</p>
              </div>
            ) : parsed.provider === "direct" ? (
              <video
                ref={videoRef}
                src={parsed.embedUrl}
                controls
                className="w-full h-full object-contain"
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration;
                  if (d && d > 0) setDuration(d);
                }}
                onError={() => {
                  setLoadError("تعذر تشغيل ملف الفيديو المباشر. تأكد من صحة الرابط والصيغة.");
                  setStatus("ERROR");
                }}
              />
            ) : (
              <iframe
                ref={iframeRef}
                id="admin-video-preview-iframe"
                src={parsed.embedUrl}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Admin Video Preview"
              />
            )}
          </div>

          {/* Video Information & Confirmation Actions Bar */}
          <div className="p-4 bg-[#141422] border-t border-gray-800 space-y-3">
            
            {/* Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="bg-[#1C1C30] p-2 rounded-xl border border-gray-700/50">
                <span className="text-gray-400 block text-[10px]">المنصة:</span>
                <span className="text-white font-bold">{parsed.providerLabel}</span>
              </div>
              <div className="bg-[#1C1C30] p-2 rounded-xl border border-gray-700/50">
                <span className="text-gray-400 block text-[10px]">معرف الفيديو (ID):</span>
                <span className="text-purple-300 font-mono font-bold truncate block">
                  {parsed.videoId || "-"}
                </span>
              </div>
              <div className="bg-[#1C1C30] p-2 rounded-xl border border-gray-700/50 col-span-2 sm:col-span-1">
                <span className="text-gray-400 block text-[10px]">مدة الفيديو:</span>
                <span className="text-yellow-300 font-bold">
                  {duration ? `${formatDuration(duration)} دقيقة` : "متاح داخل المشغل"}
                </span>
              </div>
            </div>

            {/* Confirmation Banner & Buttons */}
            <div className="pt-2 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs">
                {status === "VERIFIED" ? (
                  <p className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={16} />
                    تم تأكيد هذا الفيديو وجاهز للحفظ ✅
                  </p>
                ) : (
                  <p className="text-amber-300 font-semibold text-[11px]">
                    👉 بعد مشاهدة والتأكد من الفيديو، اضغط على زر التأكيد:
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {status !== "VERIFIED" ? (
                  <button
                    type="button"
                    onClick={handleConfirmVideo}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30 cursor-pointer"
                  >
                    <CheckCircle2 size={15} />
                    ✅ الفيديو صحيح — تأكيد
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetVerification}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium text-xs transition flex items-center gap-1"
                    title="إعادة فحص الفيديو"
                  >
                    <RefreshCw size={13} />
                    إعادة الفحص
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Warning Notice if unverified with entered text */}
      {!isVerified && value.trim() !== "" && status !== "ERROR" && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-amber-800 text-[11px] font-semibold flex items-center gap-2">
          <Info size={15} className="text-amber-600 shrink-0" />
          <span>
            ⚠️ يرجى الضغط على <strong>«معاينة الفيديو»</strong> ومشاهدته، ثم الضغط على <strong>«تأكيد»</strong> لتتمكن من حفظ الدرس.
          </span>
        </div>
      )}

    </div>
  );
}
