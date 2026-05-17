package com.avo.config;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect
@Component
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    @Pointcut("within(com.avo.controller..*) || within(com.avo.controllers..*)")
    public void controllerPointcut() {}

    @Pointcut("within(com.avo.services..*) || within(com.avo.yente.service..*)")
    public void servicePointcut() {}

    @Around("controllerPointcut() || servicePointcut()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getSignature().getDeclaringTypeName();
        String methodName = joinPoint.getSignature().getName();
        
        String args;
        try {
            args = Arrays.toString(joinPoint.getArgs());
        } catch (Exception e) {
            args = "[Unserializable arguments]";
        }

        log.info("▶️ Entering [{}#{}()] with args: {}", className, methodName, args);

        long start = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - start;
            
            String resultStr;
            try {
                resultStr = String.valueOf(result);
                if (resultStr != null && resultStr.length() > 500) {
                    resultStr = resultStr.substring(0, 500) + "... [truncated]";
                }
            } catch (Exception e) {
                resultStr = "[Unserializable result]";
            }
            
            log.info("⏸️ Exiting [{}#{}()] (took {} ms) with result: {}", className, methodName, duration, resultStr);
            return result;
        } catch (Throwable throwable) {
            long duration = System.currentTimeMillis() - start;
            log.error("❌ Exception in [{}#{}()] (failed after {} ms) with message: {}", 
                     className, methodName, duration, throwable.getMessage(), throwable);
            throw throwable;
        }
    }
}
