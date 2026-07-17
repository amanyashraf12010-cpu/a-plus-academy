export const courses = [
  {
    id: 1,
    teacherId: 1,

    image: "/courses/math.jpg",

    title: "كورس الرياضيات الشامل",
    description: "شرح كامل المنهج + تدريبات مكثفة + امتحانات",

    grade: "أولى ثانوي",
    system: "عام",
    track: "علمي",

    price: 350,
    duration: "45 ساعة",
    lessons: 120,

    students: 2500,
    rating: 4.8,
    reviews: 320,

    level: "Beginner",

    language: "Arabic",

    isBestseller: true,

    tags: ["رياضيات", "جبر", "هندسة"],

    features: [
      "شرح كامل المنهج بطريقة مبسطة",
      "حل آلاف الأسئلة",
      "امتحانات شهرية",
      "مراجعة نهائية قبل الامتحان"
    ],

    curriculum: [
      {
        section: "الأعداد الحقيقية",
        lessons: 10
      },
      {
        section: "المعادلات والمتباينات",
        lessons: 15
      },
      {
        section: "الهندسة التحليلية",
        lessons: 12
      }
    ],

    requirements: [
      "أساسيات الرياضيات",
      "طالب في أولى ثانوي"
    ],

    descriptionLong:
      "الكورس ده معمول مخصوص لطلبة أولى ثانوي عشان يفهموا الرياضيات بطريقة بسيطة وسهلة مع تطبيقات كثيرة وتمارين محلولة خطوة بخطوة."
  },

  {
    id: 2,
    teacherId: 1,

    image: "/courses/math2.jpg",

    title: "تفاضل وتكامل",
    description: "شرح شامل التفاضل والتكامل + امتحانات",

    grade: "تانية ثانوي",
    system: "عام",
    track: "علمي",

    price: 400,
    duration: "38 ساعة",
    lessons: 95,

    students: 1800,
    rating: 4.7,
    reviews: 210,

    level: "Intermediate",

    language: "Arabic",

    isBestseller: false,

    tags: ["تفاضل", "تكامل"],

    features: [
      "شرح القوانين بالتفصيل",
      "حل مسائل متنوعة",
      "تدريبات امتحانات"
    ],

    curriculum: [
      {
        section: "النهايات",
        lessons: 8
      },
      {
        section: "المشتقات",
        lessons: 14
      }
    ],

    requirements: [
      "فهم أساسيات الرياضيات"
    ],

    descriptionLong:
      "شرح تفصيلي لمادة التفاضل والتكامل مع تطبيقات عملية وأسئلة امتحانات فعلية."
  }
];