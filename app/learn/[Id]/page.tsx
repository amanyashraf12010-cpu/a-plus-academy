import { learnCourse } from "@/data/learnCourse";
import LessonNavigation from "@/components/learn/LessonNavigation";
import CompleteLessonButton from "@/components/learn/CompleteLessonButton";
import LessonTabs from "@/components/learn/LessonTabs";
import VideoPlayer from "@/components/learn/VideoPlayer";
import LessonSidebar from "@/components/learn/LessonSidebar";
import CourseProgress from "@/components/learn/CourseProgress";

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FD]">

      <div className="max-w-7xl mx-auto px-6 py-10">

        <div className="bg-white rounded-3xl shadow-sm border p-8 mb-8">

  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

    <div>

      <h1 className="text-4xl font-bold text-[#2D2B7A]">
        {learnCourse.title}
      </h1>

      <p className="text-gray-500 mt-3 text-lg">
        👨‍🏫 {learnCourse.teacher}
      </p>

    </div>

    <div className="flex gap-6">

      <div className="bg-[#F3F2FF] px-6 py-4 rounded-2xl text-center">

        <p className="text-sm text-gray-500">
          نسبة الإنجاز
        </p>

        <h3 className="text-3xl font-bold text-[#7D79F1]">
          {learnCourse.progress}%
        </h3>

      </div>

      <div className="bg-[#F8F9FD] px-6 py-4 rounded-2xl text-center">

        <p className="text-sm text-gray-500">
          الدرس الحالي
        </p>

        <h3 className="font-bold text-[#2D2B7A]">
          {learnCourse.currentLesson}
        </h3>

      </div>

    </div>

  </div>

</div>
        <CourseProgress
          progress={learnCourse.progress}
        />

        <div className="grid lg:grid-cols-3 gap-8 mt-8">

          <div className="lg:col-span-2">

            <VideoPlayer />
            <LessonTabs />
            <CompleteLessonButton />
            <LessonNavigation />

          </div>

          <LessonSidebar
            course={learnCourse}
          />

        </div>

      </div>

    </div>
  );
}