import Card from "@/components/shared/Card";

export default function WhyAplusCard({
  item,
}: {
  item: { title: string; desc: string };
}) {
  return (
    <Card className="text-right group">

      <h3 className="text-xl font-bold text-[#02343F] group-hover:text-[#7D79F1] transition">
        {item.title}
      </h3>

      <p className="text-gray-600 mt-2 leading-relaxed">
        {item.desc}
      </p>

    </Card>
  );
}