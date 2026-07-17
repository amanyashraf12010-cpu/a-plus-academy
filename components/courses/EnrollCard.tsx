import Link from "next/link";
export default function EnrollCard({ course }: any) {
  return (
    <div className="bg-white rounded-3xl shadow-lg border p-6 sticky top-24">

      <div className="text-center">

        <h2 className="text-4xl font-bold text-[#7D79F1]">
          {course.price} جنيه
        </h2>

        <Link href={`/courses/${course.id}/checkout`}>
  <button className="w-full mt-4 bg-[#7D79F1] hover:bg-[#655EF0] text-white text-lg font-bold py-4 rounded-2xl transition duration-300 shadow-md hover:shadow-lg">
    اشترك الآن
  </button>
</Link>

      </div>

      <hr className="my-6"/>

      <div className="space-y-4 text-gray-600">

        <div className="flex justify-between">
          <span>مدة الكورس</span>
          <span>{course.duration}</span>
        </div>

        <div className="flex justify-between">
          <span>عدد الدروس</span>
          <span>{course.lessons}</span>
        </div>

        <div className="flex justify-between">
          <span>الصف</span>
          <span>{course.grade}</span>
        </div>

        <div className="flex justify-between">
          <span>المدرس</span>
          <span>{course.teacher}</span>
        </div>

      </div>

    </div>
  );
}