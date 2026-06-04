import { Link } from "react-router-dom";

const PublicFooter = () => {
  return (
    <footer className="w-full bg-[#2B2B2B] text-gray-400 py-10 px-6 md:px-16 fixed bottom-0 z-40 shadow-sm font-sans">
      <div className="w-full mx-auto flex flex-col gap-8">
        {/* BLOQUE SUPERIOR: Logo + Enlaces */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Izquierda: Logo y Eslogan */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <img
                src="/logo-pistache.png"
                alt="Pistache"
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-gray-500">
              Menos Gestión, Más Desarrollo.
            </p>
          </div>

          {/* Derecha: Enlaces de navegación */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
            {/*<a
              href="#funcionalidades"
              className="hover:text-[#4db6ac] transition-colors"
            >
              Funcionalidades
            </a>
            <a
              href="#como-funciona"
              className="hover:text-[#4db6ac] transition-colors"
            >
              Cómo funciona
            </a>
            <a href="#roles" className="hover:text-[#4db6ac] transition-colors">
              Roles
            </a>*/}
            <Link
              to="/login"
              className="hover:text-[#4db6ac] transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>

        {/* BLOQUE INFERIOR: Línea y Copyright */}
        <div className="w-full flex flex-col gap-4 divide-y divide-gray-600">
          {/* Línea divisoria muy tenue */}
          <div className="w-full h-[1px] bg-gray-800" />

          {/* Copyright Centrado */}
          <p className="text-center text-xs text-gray-600 tracking-wide">
            &copy; {new Date().getFullYear()} Pistache. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
