package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.AsignacionIssues;
import com.pistache.sprintops_backend.model.Issues;
import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.repository.AsignacionIssuesRepository;
import com.pistache.sprintops_backend.repository.IssuesRepository;
import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTTblPr;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTTblWidth;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTTcPr;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.STJcTable;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.STTblWidth;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProyectoIssuesDocxExportService {

    private static final String FONT_TNR = "Times New Roman";

    private static final DateTimeFormatter DATE_ES =
            DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", new Locale("es", "ES"));

    @Autowired
    private IssuesRepository issuesRepository;

    @Autowired
    private AsignacionIssuesRepository asignacionIssuesRepository;

    public byte[] export(Proyecto proyecto) throws IOException {
        List<Issues> issues = issuesRepository.findAllBelongingToProject(proyecto.getIdProyecto());
        issues.sort(Comparator.comparing(Issues::getIdIssue, Comparator.nullsLast(Integer::compareTo)));

        try (XWPFDocument doc = new XWPFDocument()) {
            writeCoverPage(doc, proyecto);

            XWPFParagraph pb = doc.createParagraph();
            XWPFRun pageBreak = pb.createRun();
            pageBreak.addBreak(BreakType.PAGE);

            for (int i = 0; i < issues.size(); i++) {
                if (i > 0) {
                    XWPFParagraph p2 = doc.createParagraph();
                    p2.createRun().addBreak(BreakType.PAGE);
                }
                writeIssueTable(doc, issues.get(i), i + 1);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.write(out);
            return out.toByteArray();
        }
    }

    private void writeCoverPage(XWPFDocument doc, Proyecto proyecto) {
        for (int i = 0; i < 10; i++) {
            doc.createParagraph();
        }
        XWPFParagraph title = doc.createParagraph();
        title.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun r1 = title.createRun();
        r1.setFontFamily(FONT_TNR);
        r1.setFontSize(20);
        r1.setText(Optional.ofNullable(proyecto.getNombreProyecto()).orElse("Proyecto"));

        doc.createParagraph();

        XWPFParagraph sub = doc.createParagraph();
        sub.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun r2 = sub.createRun();
        r2.setFontFamily(FONT_TNR);
        r2.setFontSize(16);
        r2.setText("Issues del Proyecto");
    }

    private void writeIssueTable(XWPFDocument doc, Issues issue, int numeroOrden) {
        XWPFTable table = doc.createTable(6, 3);
        applyTableBorders(table);
        applyTableFullWidthCentered(table);

        // Fila 1: número | prioridad | story points — tamaño 10
        XWPFTableRow row0 = table.getRow(0);
        int pts = issue.getStoryPointsIssue() != null ? issue.getStoryPointsIssue() : 0;
        setCellPlain(row0.getCell(0), "#" + numeroOrden, 10, true);
        setCellInlineLabeled(row0.getCell(1), "Prioridad: ", formatPriority(issue.getPrioridadIssue()), 10, true);
        setCellInlineLabeled(row0.getCell(2), "Story Points: ", String.valueOf(pts), 10, true);

        // Filas 2–5: combinadas, tamaño 12, etiqueta en negrita
        setMergedRowLabeled(table, 1, "Título del Issue:",
                Optional.ofNullable(issue.getTituloIssue()).orElse("—"), 12);
        setMergedRowLabeled(table, 2, "Propósito:",
                Optional.ofNullable(issue.getPropositoIssue()).orElse("—"), 12);
        setMergedRowLabeled(table, 3, "Descripción:",
                Optional.ofNullable(issue.getDescripcionIssue()).orElse("—"), 12);
        setMergedRowLabeled(table, 4, "Usuarios asignados:", formatAssignees(issue.getIdIssue()), 12);

        // Fila 6: inicio | fin — tamaño 10
        XWPFTableRow row5 = table.getRow(5);
        setCellInlineLabeled(row5.getCell(0), "Fecha de Inicio: ", formatDate(issue.getFechaCreacionIssue()), 10, true);
        setCellInlineLabeled(row5.getCell(1), "Fecha de Fin: ", formatDate(issue.getFechaFinIssue()), 10, true);
        if (row5.getTableCells().size() > 2) {
            row5.removeCell(2);
        }
        CTTcPr pr = row5.getCell(1).getCTTc().isSetTcPr()
                ? row5.getCell(1).getCTTc().getTcPr()
                : row5.getCell(1).getCTTc().addNewTcPr();
        if (!pr.isSetGridSpan()) {
            pr.addNewGridSpan();
        }
        pr.getGridSpan().setVal(BigInteger.valueOf(2));
    }

    private void mergeRowToThreeCols(XWPFTable table, int rowIndex) {
        XWPFTableRow row = table.getRow(rowIndex);
        while (row.getTableCells().size() > 1) {
            row.removeCell(row.getTableCells().size() - 1);
        }
        XWPFTableCell cell = row.getCell(0);
        CTTcPr pr = cell.getCTTc().isSetTcPr() ? cell.getCTTc().getTcPr() : cell.getCTTc().addNewTcPr();
        if (!pr.isSetGridSpan()) {
            pr.addNewGridSpan();
        }
        pr.getGridSpan().setVal(BigInteger.valueOf(3));
    }

    private void setMergedRowLabeled(XWPFTable table, int rowIndex, String label, String body, int fontSizePt) {
        mergeRowToThreeCols(table, rowIndex);
        XWPFTableCell cell = table.getRow(rowIndex).getCell(0);
        clearCellParagraphs(cell);
        XWPFParagraph pLabel = cell.addParagraph();
        pLabel.setAlignment(ParagraphAlignment.BOTH);
        XWPFRun rLabel = pLabel.createRun();
        rLabel.setFontFamily(FONT_TNR);
        rLabel.setFontSize(fontSizePt);
        rLabel.setBold(true);
        rLabel.setText(label);

        XWPFParagraph pBody = cell.addParagraph();
        pBody.setAlignment(ParagraphAlignment.BOTH);
        XWPFRun rBody = pBody.createRun();
        rBody.setFontFamily(FONT_TNR);
        rBody.setFontSize(fontSizePt);
        rBody.setBold(false);
        rBody.setText(body != null ? body : "—");
    }

    private void clearCellParagraphs(XWPFTableCell cell) {
        while (cell.getParagraphs().size() > 0) {
            cell.removeParagraph(0);
        }
    }

    /** Texto justificado, Times New Roman. */
    private void setCellPlain(XWPFTableCell cell, String text, int fontSizePt, boolean justify) {
        clearCellParagraphs(cell);
        XWPFParagraph p = cell.addParagraph();
        if (justify) {
            p.setAlignment(ParagraphAlignment.BOTH);
        }
        XWPFRun run = p.createRun();
        run.setFontFamily(FONT_TNR);
        run.setFontSize(fontSizePt);
        run.setText(text != null ? text : "—");
    }

    /** Misma línea: etiqueta en negrita y cuerpo en regular (Times New Roman). */
    private void setCellInlineLabeled(XWPFTableCell cell, String label, String body, int fontSizePt, boolean justify) {
        clearCellParagraphs(cell);
        XWPFParagraph p = cell.addParagraph();
        if (justify) {
            p.setAlignment(ParagraphAlignment.BOTH);
        }
        XWPFRun rLabel = p.createRun();
        rLabel.setFontFamily(FONT_TNR);
        rLabel.setFontSize(fontSizePt);
        rLabel.setBold(true);
        rLabel.setText(label);
        XWPFRun rBody = p.createRun();
        rBody.setFontFamily(FONT_TNR);
        rBody.setFontSize(fontSizePt);
        rBody.setBold(false);
        rBody.setText(body != null ? body : "—");
    }

    private void applyTableBorders(XWPFTable table) {
        table.setInsideHBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, "000000");
        table.setInsideVBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, "000000");
        table.setTopBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, "000000");
        table.setBottomBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, "000000");
        table.setLeftBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, "000000");
        table.setRightBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, "000000");
    }

    /** Ancho al 100% del área útil y tabla centrada en la página (OOXML: 5000 = 100% en unidades de 1/50 %). */
    private void applyTableFullWidthCentered(XWPFTable table) {
        CTTblPr tblPr = table.getCTTbl().getTblPr();
        if (tblPr == null) {
            tblPr = table.getCTTbl().addNewTblPr();
        }
        CTTblWidth tblW = tblPr.isSetTblW() ? tblPr.getTblW() : tblPr.addNewTblW();
        tblW.setType(STTblWidth.PCT);
        tblW.setW(BigInteger.valueOf(5000));
        if (!tblPr.isSetJc()) {
            tblPr.addNewJc();
        }
        tblPr.getJc().setVal(STJcTable.CENTER);
    }

    private String formatPriority(String prioridad) {
        if (prioridad == null) return "—";
        String p = prioridad.toLowerCase(Locale.ROOT);
        return switch (p) {
            case "high", "alta" -> "Alta";
            case "medium", "media" -> "Media";
            case "low", "baja" -> "Baja";
            default -> prioridad;
        };
    }

    private String formatAssignees(Integer issueId) {
        List<AsignacionIssues> list = asignacionIssuesRepository.findByIssueIdIssue(issueId);
        if (list == null || list.isEmpty()) {
            return "Sin asignar";
        }
        return list.stream()
                .map(a -> a.getUsuario() != null ? a.getUsuario().getNombreUsuario() : "?")
                .collect(Collectors.joining(", "));
    }

    private String formatDate(LocalDate date) {
        if (date == null) {
            return "—";
        }
        try {
            return date.format(DATE_ES);
        } catch (Exception e) {
            return date.toString();
        }
    }
}
