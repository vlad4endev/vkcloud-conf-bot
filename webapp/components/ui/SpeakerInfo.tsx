import Image from "next/image";
import type { Speaker } from "@/lib/scheduleData";

export function SpeakerInfo({ speaker }: { speaker: Speaker }) {
  const initials = speaker.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="mt-5 flex items-center gap-4">
      <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-full border-2 border-white/12 bg-[#1e6dff]/30">
        {speaker.avatar ? (
          <Image
            src={speaker.avatar}
            alt={speaker.name}
            width={52}
            height={52}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
            {initials}
          </span>
        )}
      </div>
      <div>
        <p className="text-base font-semibold text-white">{speaker.name}</p>
        <p className="text-sm text-white/55">{speaker.title}</p>
      </div>
    </div>
  );
}
