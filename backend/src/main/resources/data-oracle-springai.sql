-- Reto D4: columna VECTOR en rag_insight (Oracle 23ai / ATP).
-- La tabla base la crea Hibernate (ddl-auto=update). Este script solo añade INSIGHT si falta.

BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE rag_insight ADD (insight VECTOR)';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -1430 AND SQLCODE != -942 THEN
      RAISE;
    END IF;
END;
/
