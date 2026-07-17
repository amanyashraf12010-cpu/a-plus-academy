"use client";

import { useState } from "react";
import Container from "@/components/shared/Container";
import SectionTitle from "@/components/shared/SectionTitle";
import CoursesTabs from "./CoursesTabs";
import CoursesGrid from "./CoursesGrid";

export default function CoursesSection() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <section className="py-24 bg-white">
      <Container>

        <SectionTitle
          title="كورساتنا"
          subtitle="اختر الكورس المناسب وابدأ رحلة التفوق"
        />

        <CoursesTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <CoursesGrid activeTab={activeTab} />

      </Container>
    </section>
  );
}