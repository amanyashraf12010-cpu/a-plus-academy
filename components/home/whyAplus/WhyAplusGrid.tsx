import WhyAplusCard from "./WhyAplusCard";

const data = [
  {
    title: "شرح مبسط",
    desc: "كل درس بيتشرح بطريقة سهلة تناسب مستواك",
  },
  {
    title: "متابعة مستمرة",
    desc: "بنقيس تقدمك خطوة بخطوة لحد الامتحان",
  },
  {
    title: "اختبارات ذكية",
    desc: "تدريب عملي على شكل امتحانات حقيقية",
  },
  {
    title: "هدفنا A+",
    desc: "كل المحتوى معمول عشان توصّل لأعلى درجة",
  },
];

export default function WhyAplusGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
      {data.map((item, index) => (
        <WhyAplusCard key={index} item={item} />
      ))}
    </div>
  );
}