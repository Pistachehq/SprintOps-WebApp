# Actividad: pruebas, front/back y un poco de refactor

Lo escribí para entregar en el curso. No es teoría súper formal; son respuestas directas a lo que nos pidieron y unos ejemplos de refactor que sirven como guía (el código es ilustrativo, no es copiar-pegar de un archivo concreto del repo).

## 1. ¿Se pueden usar las mismas técnicas en front que en back?

Yo diría que no, si nos apretamos con la palabra “las mismas”.

En el backend, con Spring, lo normal es otra cosa: levantas el servidor de prueba, disparas requests HTTP, miras el JSON que regresa, a veces usas una base en memoria para no depender de MySQL, y los tests viven en el mundo Java. En el frontend, con React y Vite, casi nunca vas a hacer exactamente eso. Ahí entran otras piezas: probar componentes aislados con Vitest y Testing Library, o si quieres ver el flujo completo como usuario, abrir el navegador con Playwright o Cypress y que un script haga clic y escriba de verdad.

Lo que sí se puede repetir entre capas es la idea de fondo: quiero saber si esto se rompió cuando cambié código. Pero el lenguaje, el runner y hasta el tipo de mocks cambian. No tiene sentido pelearse para meter JUnit en el navegador ni pretender que Vitest valide tu capa de persistencia en Java. Cada lado tiene su caja de herramientas y está bien así.

## 2. ¿La interfaz manda sobre qué técnica usar?

Tampoco lo vería tan lineal. Diría que no en el sentido de “tengo pantalla, entonces todo tiene que ser prueba end to end”.

Claro que la interfaz importa para decidir dónde vas a gastar tiempo: si el riesgo es que un modal no abre o un formulario manda mal los datos, en algún momento quieres algo que vea la pantalla. Pero eso no borra el resto de la pirámide. Muchas veces conviene apretar fuerte el API o la lógica del servidor porque ahí están las reglas serias, y dejar la UI para unos pocos recorridos que te den confianza sin volverte loco manteniendo tests frágiles que se rompen por un cambio de CSS.

En resumen: la UI te orienta, no te dicta una sola técnica para todo. Mezclas lo que toque según qué tan grave es el fallo y qué tan estable quieres que sea la suite a largo plazo.

## 3. Qué es refactorizar (en una frase)

Es **cambiar cómo está escrito el código sin cambiar lo que hace afuera**, para que sea más legible o menos repetido. Lo ideal es tener tests (aunque sean pocos) antes de mover cosas, para no romper el sprint por orgullo.

Abajo van tres ejemplos típicos. Son el clásico “antes / después” de los apuntes.

### Ejemplo A — Java: validación repetida

Estás copiando el mismo `if` del título vacío en crear y en actualizar. Se cansa.

Antes:

```java
public void crearIssue(Dto dto) {
    if (dto.getTitle() == null || dto.getTitle().isBlank()) {
        throw new IllegalArgumentException("Título obligatorio");
    }
    // ...
}

public void actualizarIssue(Integer id, Dto dto) {
    if (dto.getTitle() == null || dto.getTitle().isBlank()) {
        throw new IllegalArgumentException("Título obligatorio");
    }
    // ...
}
```

Después (un solo método y listo):

```java
private void requireNonBlankTitle(String title) {
    if (title == null || title.isBlank()) {
        throw new IllegalArgumentException("Título obligatorio");
    }
}

public void crearIssue(Dto dto) {
    requireNonBlankTitle(dto.getTitle());
    // ...
}

public void actualizarIssue(Integer id, Dto dto) {
    requireNonBlankTitle(dto.getTitle());
    // ...
}
```

Si mañana el mensaje cambia o la regla se complica, lo tocas una vez.

### Ejemplo B — Java: el string "done" tirado por ahí

No es grave, pero cuando buscas en el proyecto te vuelves loco. Una constante o un enum te salva del typo.

Antes:

```java
if ("done".equalsIgnoreCase(estado)) {
    issue.setFechaFinIssue(LocalDate.now());
}
```

Después:

```java
private static final String STATUS_DONE = "done";

if (STATUS_DONE.equalsIgnoreCase(estado)) {
    issue.setFechaFinIssue(LocalDate.now());
}
```

### Ejemplo C — React: componente que hace de todo

Te pasa que un panel tiene 200 líneas entre cálculos y JSX. Partirlo no cambia lo que ve el usuario; solo te ordena la cabeza.

Antes (todo en uno):

```jsx
function PlanningPanel({ sprintId, issues }) {
  const totalSp = issues.reduce(/* ... */);
  return (
    <div>
      {/* un montón de JSX mezclado */}
    </div>
  );
}
```

Después (sacas el cálculo y un pedacito de UI):

```jsx
function useSprintStoryPoints(issues) {
  return useMemo(() => issues.reduce(/* ... */, 0), [issues]);
}

function SprintTotals({ totalSp }) {
  return <section>SP totales: {totalSp}</section>;
}

function PlanningPanel({ sprintId, issues }) {
  const totalSp = useSprintStoryPoints(issues);
  return (
    <div>
      <SprintTotals totalSp={totalSp} />
    </div>
  );
}
```

En el proyecto ya venimos centralizando llamadas en cosas tipo `issuesRepository` / `sprintsRepository`. Otro refactor aburrido pero útil es dejar de tener la misma URL armada a mano en tres componentes y meter un método en el repositorio. Mismo resultado en red, menos copy-paste.

## 4. Si de verdad refactorizas en equipo

Nadie lee PRs de 80 archivos. Anota en la descripción del PR por qué lo hiciste (“había duplicado esto tres veces”), pasa tests, y si el cambio es grande, córtalo en dos partes. Con eso basta para no odiarse el lunes.

---

Sobre las pruebas de integración que armamos contra el API: eso es **meter automatización** para no regresar; refactor sería, por ejemplo, sacar el JSON repetido a un helper en el test. Son cosas distintas pero se llevan bien.
