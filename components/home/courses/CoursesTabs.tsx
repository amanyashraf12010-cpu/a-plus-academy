"use client";

interface CoursesTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  { id: "all", label: "كل الكورسات" },
  { id: "popular", label: "الأكثر طلبًا" },
  { id: "new", label: "أحدث الكورسات" },
];

export default function CoursesTabs({
  activeTab,
  setActiveTab,
}: CoursesTabsProps) {
  return (
    <div className="flex justify-center mt-10 mb-14">
      <div className="flex bg-[#F8F7FF] p-2 rounded-2xl border border-[#E8E5FF] shadow-sm">

        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-8 py-3 rounded-xl font-semibold transition-all duration-300
              ${
                activeTab === tab.id
                  ? "bg-[#7D79F1] text-white shadow-lg"
                  : "text-[#7D79F1] hover:bg-white hover:shadow-md"
              }
            `}
          >
            {tab.label}
          </button>
        ))}

      </div>
    </div>
  );
}