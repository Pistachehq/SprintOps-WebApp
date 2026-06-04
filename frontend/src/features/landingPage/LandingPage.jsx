import PublicNavbar from "../../components/public_components/publicNavbar";
import Layour from "../../components/Layout";
import imageNav from "../../../public/ignore/image.png";
import imageFoot from "../../../public/ignore/fut.png";
import PublicFooter from "../../components/public_components/publicFooter";
//<img src={imageNav} alt="Landing" className="w-full h-auto" />

const LandingPage = () => {
  return (
    <div>
      <header>
        <PublicNavbar />
        <img src={imageFoot} alt="Footer" className="w-full h-auto" />;
      </header>
      <main></main>
      <footer>
        <PublicFooter />
      </footer>
    </div>
  );
};

export default LandingPage;
