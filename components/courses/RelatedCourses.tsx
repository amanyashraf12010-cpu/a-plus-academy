import CourseCard from "../home/courses/CourseCard";

interface RelatedCoursesProps {
  courses: any[];
}

export default function RelatedCourses({ courses }: RelatedCoursesProps) {
  if (!courses || courses.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-8">
      <h2 className="text-2xl font-bold text-[#2D2B7A] mb-6">
        كورسات قد تعجبك
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
    </div>
  );
}