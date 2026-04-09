# Contexto del Proyecto: SprintOps-WebApp-Mockup

Este documento describe la estructura actual, las páginas principales, los flujos de datos y el funcionamiento general de la aplicación **SprintOps-WebApp-Mockup**. Está diseñado para proporcionar un contexto claro y detallado a cualquier IA o desarrollador que necesite comprender la arquitectura, las características existentes y cómo interactúan entre sí.

## 1. Arquitectura General y Estructura de Directorios

La aplicación es una Single Page Application (SPA) construida con **React**. Utiliza `react-router-dom` para la navegación y `tailwindcss` para los estilos. Se maneja un diseño basado en roles (Scrum Master, Product Owner, Developer) para ocultar o mostrar ciertas secciones de la interfaz.

La estructura de carpetas en `src/` está organizada por características (Features) acoplando lógica y vistas en módulos.

- **`src/features/`**: Contiene los módulos principales de la aplicación divididos en carpetas como home, planning, issues, project, reflection, sprint, sprintManager, standup y login.
- **`src/components/`**: Componentes UI compartidos y genéricos (`Layout.jsx`, `Modal.jsx`, `Navbar.jsx`, `Sidebar.jsx`, etc.).
- **`src/context/`**: Manejador del estado global de la aplicación (`IssuesContext.jsx`).
- **`src/hooks/`**: Custom hooks compartidos, destacando `useAuth` para la autenticación y los controles de roles.
- **`src/mock/`**: Datos estáticos predefinidos para simular una base de datos (`issues.js`, `projects.js`, `tasks.js`, `sprints.js`).
- **`src/router/`**: Configuración de `AppRouter.jsx` donde se definen las rutas generales y privadas (`PrivateRoute`).

## 2. Gestión de Estados Global y Autenticación

- **`useAuth` (Hook)**: Maneja la autenticación simulada. Expone si el usuario está autenticado y el objeto `user` que contiene información clave como el `role` ('scrumMaster', 'productOwner', 'developer'). Esto es recurrente a lo largo de las vistas para renderizados condicionales (ej. un Scrum Master puede ver un botón de "Crear Proyecto/Issue" mientras que un Desarrollador no).
- **`IssuesContext` (Context)**: Inicializado con los datos de `mock/issues.js`. Provee una lista de `issues`, y las funciones modificadoras `setIssues` y `addIssue`. Gracias a esto, cuando se crea un "issue" en la vista de planeación (`PlanningPage`), su creación repercute en el tablero de Kanban global (`IssuesPage`).

## 3. Páginas y Funcionamiento Detallado

A continuación se describe cada una de las páginas mapeadas en el enrutamiento:

### A. Home / Dashboard (`/home` o `/projects`) - `HomePage.jsx`
Es la página principal tras la autenticación. Su función es servir como catálogo de proyectos.
- **Funcionamiento**: Permite ver una cuadrícula de proyectos (`ProjectGrid`). Al presionar uno, abre un panel lateral (`ProjectSidebar`) que describe brevemente el proyecto y ofrece navegar a sus *Sprints*.
- **Roles**: Exclusivamente los usuarios con rol *Scrum Master* poseen el botón para la creación de proyectos (`CreateProjectModal`). 
- **Estado**: Muestra dinámicamente un estado temporal cargado desde los Mock. Toda nueva creación de proyecto se muestra, pero se pierde si la app recarga.

### B. Módulo de Sprints de Proyecto (`/project/:projectId/sprints`) - `SprintsPage.jsx`
Despliega los Sprints correspondientes a un proyecto objetivo (sacando la ID base desde la URL).
- **Funcionamiento**: Contiene una forma enlazada (`SprintFlow`) de ver visualmente la cronología actual y pasadas de Sprints asignados al proyecto. 
- **Roles**: El *Scrum Master* visualiza un botón en el header superior donde pueden invocar a `AddUserModal` para adjuntar miembros del equipo. Las integraciones de estos perfiles se listan debajo del encabezado de nombre del proyecto.
- **Redirección**: Al dar click en cualquier Sprint del Timeline, se redirige inmediatamente al entorno de trabajo (`SprintManagerPage`).

### C. Gestor del Sprint Actual (`/sprint/:id`) - `SprintManagerPage.jsx`
Es la antesala a un sprint en curso; titulada genéricamente "Product BackLog (Issues)".
- **Funcionamiento**: Posee otro diagrama direccional (`SprintFlow`) a modo de pasos a seguir dentro de la etapa de software. Destaca mucho su pestaña persistente flotante en lateral de "Daily Standup Meeting" la cual detona el `StandupSidebar` para efectuar las interacciones de chequeo diario durante un *Sprint*.

### D. Planiación / Planning (`/sprint/:id/planning`) - `PlanningPage.jsx`
La hoja base para destinar tareas entre todo el equipo.
- **Developer View**: Es directo, un marco amplio que contiene la tabla de actividades únicamente delegadas a su perfil (`DevTasksView`).
- **SM / PO View**: Usan una estructura dividida. Por la izquierda ven las mesas globales de tareas `TaskList` y en la zona derecha se visualizan paneles contextuales de `SprintMetrics` (KPIs).
- **Creación de Issues**: Todos los administradores ven el botón "Crear Issue" para detonar `CreateIssueModal`, inyectando la información fresca al State del Global `Context` a fines prácticos que todo el ambiente (Como el Dashboard Kanban) consuma los cambios.

### E. Tablero Kanban / Issues (`/sprint/:id/issues`) - `IssuesPage.jsx`
La zona en movimiento general de la aplicación, el "Trabajo en proceso".
- **Visualización**: Renderiza el `KanbanBoard` compuesto por múltiples estados (ToDo, InProgress, Review, etc). Las tarjetas arrastrables mueven la lógica.
- **Roles**: Los 'developers' entran viendo el listado que matchee un filtro de nombre propio respecto al objeto (`assignee === username`). Todo otro rol ve todo y recibe un panel intermedio (`BlockedIssuesCard` y `SprintMetrics`) para vigilar trabas (blockers). Al igual que *Planning*, permite "Crear Issue".

### F. Reflexión o Restrospectiva (`/sprint/:id/reflection`) - `ReflectionPage.jsx`
El espacio seguro de crítica tras el cierre del Sprint iterativo.
- **Developer**: Se concentran en retroalimentar su estado utilizando el `RetrospectiveForm` (Donde se llenan áreas de mejora, etc) y el check-up `HealthCheckCard`.
- **Managers / PO**: Aparte del material de los perfiles bajos, disponen en una fila superior de `VelocityChart` (velocidad de los issues cerrados en base a puntuaciones), `StandupParticipationCard` (medición cualitativa de quienes atendían a las "Daily") y tarjetas de evaluación.

## Conclusión Ténica y Estado
Toda su funcionalidad actual fluye en torno de los valores *mockeados* inyectados a nivel Context/Provider y al localState que se almacena según la jerarquía del módulo (Manejo de variables internas en React). El control por Roles condiciona exitosamente quién consume qué a partir de datos del local storage u hooks.
