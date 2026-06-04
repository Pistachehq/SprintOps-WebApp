import { Link } from "react-router-dom";

const PublicFooter = () => {
  return (
    <footer className="w-full h-[70px] bg-[#2B2B2B] px-10 flex items-center fixed bottom-0 z-40 shadow-sm justify-between">
      {/* Lado Izquierdo: Logo y Copyright alineados en fila */}
      <div className="flex items-center gap-6">
        <img
          src="/logo-pistache.png"
          alt="Pistache"
          className="h-10 w-auto object-contain"
        />
        <p className="text-gray-400 text-xs hidden sm:block">
          &copy; {new Date().getFullYear()} Pistache. Todos los derechos
          reservados.
        </p>
      </div>

      {/* Lado Derecho: Enlaces de navegación */}
      <div className="flex items-center gap-6 divide-y-2 divide-gray-600">
        <Link
          to="/login"
          className="text-white text-sm font-medium hover:text-[#4db6ac] transition-colors"
        >
          Inicio de sesión
        </Link>
        {/* Si necesitas agregar más enlaces en el futuro, van aquí adentro */}
      </div>
    </footer>
  );
};

export default PublicFooter;
