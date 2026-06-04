import { useNavigate, Link, useLocation } from "react-router-dom";
import FilledButton from "../../components/public_components/filled_button";

const PublicNavbar = () => {
  const navigate = useNavigate();
  const handleRegister = () => {
    navigate("/login", { state: { mode: "register" } });
  };
  return (
    <nav className="h-[70px] bg-[#2B2B2B] px-10 flex items-center sticky top-0 z-40 shadow-sm justify-between">
      <Link
        to="/landingPage"
        className="flex h-full shrink-0 items-center cursor-pointer py-1.5 pr-4"
      >
        <img
          src="/logo-pistache.png"
          alt="Pistache"
          className="h-12 w-auto max-h-[58px] object-contain object-left"
        />
      </Link>

      <div className="flex items-center gap-6 min-w-[200px] justify-end">
        <FilledButton
          text="Registrarse"
          color="#333938"
          onClick={handleRegister}
        />

        <FilledButton text="Iniciar Sesión" color="#4db6ac" path="/login" />
      </div>
    </nav>
  );
};

export default PublicNavbar;
