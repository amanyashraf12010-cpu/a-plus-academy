export default function ProgressBar({
  progress,
}: {
  progress: number;
}) {
  return (
    <div className="w-full">

      <div className="flex justify-between text-sm mb-2">

        <span className="text-gray-500">
          التقدم
        </span>

        <span className="font-semibold text-[#7D79F1]">
          {progress}%
        </span>

      </div>

      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">

        <div
          className="h-full bg-[#7D79F1] rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

    </div>
  );
}