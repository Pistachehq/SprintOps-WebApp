package com.pistache.sprintops_backend.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class VerificationMailService {

    private static final Logger log = LoggerFactory.getLogger(VerificationMailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.from:noreply@localhost}")
    private String mailFrom;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${spring.mail.host:}")
    private String mailHost;

    public VerificationMailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    public boolean isMailConfigured() {
        return StringUtils.hasText(mailHost);
    }

    public void sendAccountVerificationEmail(String toEmail, String nombreCorto, String token) {
        String base = frontendBaseUrl.replaceAll("/$", "");
        String verifyUrl = base + "/verify-email?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || !isMailConfigured()) {
            log.warn("SMTP no configurado (spring.mail.host). Enlace de verificación para {}: {}", toEmail, verifyUrl);
            return;
        }

        String html = buildHtmlBody(verifyUrl, nombreCorto);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(toEmail);
            helper.setSubject("Verifica tu cuenta — Pistache");
            helper.setText(html, true);
            ClassPathResource logo = new ClassPathResource("mail/pistache-banner.png");
            helper.addInline("logoPistache", logo);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de verificación a {}. Enlace: {}", toEmail, verifyUrl, e);
            throw new RuntimeException("No se pudo enviar el correo de verificación", e);
        }
    }

    private String buildHtmlBody(String verifyUrl, String nombreCorto) {
        String saludo = StringUtils.hasText(nombreCorto) ? "Hola, " + escapeHtml(nombreCorto) + "." : "Hola.";
        return """
                <!DOCTYPE html>
                <html lang="es">
                <head><meta charset="UTF-8"/></head>
                <body style="margin:0;background:#212121;">
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#212121;padding:48px 16px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
                  <tr>
                    <td align="center">
                      <img src="cid:logoPistache" alt="Pistache" width="280" style="display:block;max-width:280px;height:auto;margin:0 auto 36px;border:0;"/>
                      <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:520px;">
                        <tr>
                          <td style="color:#ffffff;font-size:17px;line-height:1.65;text-align:left;padding:0 8px 28px 8px;">
                            %s<br/><br/>
                            Gracias por registrarte en Pistache. Para activar tu cuenta y poder iniciar sesión, confirma tu correo electrónico con el botón de abajo.
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding:8px 0 40px 0;">
                            <a href="%s" style="display:inline-block;background:#98D1C8;color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:12px;font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;">
                              Verificar mi correo
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td style="color:#ffffff;font-size:11px;text-align:right;padding:24px 8px 0 8px;opacity:0.9;">
                            Pistache® 2026
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                </body>
                </html>
                """.formatted(saludo, verifyUrl);
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
