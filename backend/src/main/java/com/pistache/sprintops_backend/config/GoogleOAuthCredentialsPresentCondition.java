package com.pistache.sprintops_backend.config;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

/**
 * Activa el cliente OAuth de Google solo cuando hay credenciales en el entorno (o propiedades equivalentes).
 */
public class GoogleOAuthCredentialsPresentCondition implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        var env = context.getEnvironment();
        String id = env.getProperty("GOOGLE_CLIENT_ID");
        String secret = env.getProperty("GOOGLE_CLIENT_SECRET");
        return StringUtils.hasText(id) && StringUtils.hasText(secret);
    }
}
