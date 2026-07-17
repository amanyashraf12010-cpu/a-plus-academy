import TeacherCard from "./TeacherCard";

interface Props {
  teachers: any[];
}

export default function TeachersGrid({ teachers }: Props) {
  if (!teachers) return null;
  if (!teachers.length) {
    return (
      <div className="text-center py-20 text-gray-500">
        مفيش مدرسين دلوقتي
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {teachers.map((teacher: any) => (
        <TeacherCard key={teacher.id} teacher={teacher} />
      ))}
    </div>
  );
}