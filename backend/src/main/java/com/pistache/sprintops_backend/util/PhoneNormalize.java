package com.pistache.sprintops_backend.util;

/**
 * Comparación de números entre lo que guarda el usuario en la web y lo que envía Telegram (contact).
 */
public final class PhoneNormalize {

    private PhoneNormalize() {
    }

    public static String digitsOnly(String raw) {
        if (raw == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(raw.length());
        for (int i = 0; i < raw.length(); i++) {
            char c = raw.charAt(i);
            if (c >= '0' && c <= '9') {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    /**
     * Coincide exacto o por los últimos 10 dígitos (cuando hay lada distinta) o sufijo largo.
     */
    public static boolean sameNumber(String storedDigits, String incomingDigits) {
        String a = digitsOnly(storedDigits);
        String b = digitsOnly(incomingDigits);
        if (a.isEmpty() || b.isEmpty()) {
            return false;
        }
        if (a.equals(b)) {
            return true;
        }
        if (a.length() >= 10 && b.length() >= 10) {
            String sa = a.substring(a.length() - 10);
            String sb = b.substring(b.length() - 10);
            if (sa.equals(sb)) {
                return true;
            }
        }
        if (a.length() >= 8 && b.length() >= 8) {
            return a.endsWith(b) || b.endsWith(a);
        }
        return false;
    }
}
