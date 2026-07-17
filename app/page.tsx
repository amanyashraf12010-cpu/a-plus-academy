import Hero from "@/components/home/hero/Hero";
import TeachersSection from "@/components/home/teachers/TeachersSection";
import WhyAplusSection from "@/components/home/whyAplus/WhyAplusSection";
import CoursesSection from "@/components/home/courses/CoursesSection";
import CTASection from "@/components/home/cta/CTASection";
import Footer from "@/components/layout/footer/Footer";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section id="hero">
        <Hero />
      </section>

      {/* Teachers Section */}
      <section id="teachers">
        <TeachersSection />
      </section>

      {/* Why A+ Section */}
      <section id="why">
        <WhyAplusSection />
      </section>

      {/* Courses Section */}
      <section id="courses">
        <CoursesSection />
      </section>

      {/* CTA Section */}
      <section id="cta">
        <CTASection />
      </section>

      {/* Footer / Contact */}
      <section id="contact">
        <Footer />
      </section>
    </>
  );
}
