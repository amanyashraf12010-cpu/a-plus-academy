import Container from "@/components/shared/Container";
import HeroContent from "./HeroContent";
import HeroImage from "./HeroImage";

export default function Hero() {
  return (
    <section className="pt-28 pb-16 bg-white">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          
          <HeroContent />
          <HeroImage />

        </div>
      </Container>
    </section>
  );
}