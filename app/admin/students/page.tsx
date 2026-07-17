import { students } from "@/data/students";

export default function AdminStudentsPage() {
  return (
    <div>

      <h1 className="text-3xl font-bold text-[#2D2B7A]">
        👨‍🎓 الطلاب
      </h1>

      <p className="text-gray-500 mt-2">
        متابعة الطلاب والمدفوعات
      </p>

      {/* Table */}
      <div className="bg-white rounded-2xl border shadow-sm mt-8 overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-100 text-gray-600">

            <tr>

              <th className="p-4 text-right">الاسم</th>
              <th className="p-4 text-right">الهاتف</th>
              <th className="p-4 text-right">الكورس</th>
              <th className="p-4 text-right">طريقة الدفع</th>
              <th className="p-4 text-right">الحالة</th>

            </tr>

          </thead>

          <tbody>

            {students.map((s) => (
              <tr key={s.id} className="border-t">

                <td className="p-4">{s.name}</td>

                <td className="p-4 text-gray-600">
                  {s.phone}
                </td>

                <td className="p-4">
                  {s.course}
                </td>

                <td className="p-4">
                  {s.method}
                </td>

                <td className="p-4">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      s.status === "paid"
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {s.status === "paid"
                      ? "مدفوع"
                      : "في الانتظار"}
                  </span>

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}