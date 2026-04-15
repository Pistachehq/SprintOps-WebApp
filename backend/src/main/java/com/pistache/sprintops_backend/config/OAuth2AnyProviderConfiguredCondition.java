package com.pistache.sprintops_backend.config;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

/** Verdadero si hay credenciales para Google y/o GitHub (variables de entorno o application-local.properties). */
public class OAuth2AnyProviderConfiguredCondition implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        var env = context.getEnvironment();
        boolean google = StringUtils.hasText(env.getProperty("GOOGLE_CLIENT_ID"))
                && StringUtils.hasText(env.getProperty("GOOGLE_CLIENT_SECRET"));
        boolean github = StringUtils.hasText(env.getProperty("GITHUB_CLIENT_ID"))
                && StringUtils.hasText(env.getProperty("GITHUB_CLIENT_SECRET"));
        return google || github;
    }
}
