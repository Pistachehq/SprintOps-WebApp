import CustomBadge from "../../components/public_components/customBadge";
import PublicNavbar from "../../components/public_components/publicNavbar";
import PublicFooter from "../../components/public_components/publicFooter";
import TextDescription from "../../components/public_components/textDescription";
import TextTitle from "../../components/public_components/textTitle";

const LandingPage = () => {
  return (
    <div>
      <header>
        <PublicNavbar />
      </header>
      <main
        className="w-full h-screen bg-[#f2eded] relative"
        style={{
          // Patrón de fondo de cuadros
          backgroundImage: `
          linear-gradient(to right, #e2e8f0 1px, transparent 1px),
          linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
        `,
          backgroundSize: "40px 40px", // Controla el tamaño de cada cuadro
        }}
      >
        <section>
          <CustomBadge
            backgroundColor="#d7f3f1"
            textColor="#4db6ac"
            text=":) Bienvenido a nuestro sitio web"
          />

          <TextTitle
            mainText="Organiza tus Sprints"
            highlightText="con claridad total"
          />

          <TextDescription text="Pistache reúne a Product Owners y equipos de desarrollo en un solo espacio colaborativo — planifica, asigna y entrega con confianza, sprint a sprint." />
        </section>
      </main>
      <footer>
        <PublicFooter />
        {/*Tengo que arreglar el footer para que no se mantenga estático*/}
      </footer>
    </div>
  );
};

export default LandingPage;
