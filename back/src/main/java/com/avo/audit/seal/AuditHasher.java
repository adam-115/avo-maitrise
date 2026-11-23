package com.avo.audit.seal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Calcule l'empreinte chaînée d'un élément du journal : hash = HMAC-SHA256(clé, hashPrécédent + contenu).
 *
 * La clé (variable d'environnement AUDIT_SEAL_KEY) n'est jamais stockée en base : une personne ayant accès
 * à la base seule ne peut pas recalculer une chaîne valide après avoir falsifié une ligne.
 * Sans clé configurée, on retombe sur un SHA-256 simple (détecte les erreurs et les modifications naïves,
 * mais pas un attaquant qui recalculerait toute la chaîne) : acceptable en développement uniquement.
 */
@Component
public class AuditHasher {

    public static final String HMAC = "HMAC-SHA256";
    public static final String PLAIN = "SHA-256";
    /** Point de départ de chaque chaîne. */
    public static final String GENESIS = "0".repeat(64);

    private static final Logger log = LoggerFactory.getLogger(AuditHasher.class);

    private final byte[] key;

    public AuditHasher(@Value("${audit.seal.key:}") String key) {
        this.key = (key == null || key.isBlank()) ? null : key.getBytes(StandardCharsets.UTF_8);
        if (this.key == null) {
            log.warn("AUDIT_SEAL_KEY n'est pas défini : le journal d'audit est scellé en SHA-256 simple. "
                    + "Définir une clé secrète (32 caractères ou plus) en production.");
        } else if (this.key.length < 32) {
            log.warn("AUDIT_SEAL_KEY est courte ({} octets) : utiliser au moins 32 caractères aléatoires.", this.key.length);
        }
    }

    /** Algorithme utilisé pour les nouveaux sceaux. */
    public String currentAlgorithm() {
        return key == null ? PLAIN : HMAC;
    }

    public boolean keyConfigured() {
        return key != null;
    }

    public String hash(String algorithm, String previousHash, String content) {
        byte[] data = (previousHash + "\n" + content).getBytes(StandardCharsets.UTF_8);
        try {
            if (HMAC.equals(algorithm)) {
                if (key == null) {
                    throw new IllegalStateException("Sceau HMAC impossible à vérifier : AUDIT_SEAL_KEY absent");
                }
                Mac mac = Mac.getInstance("HmacSHA256");
                mac.init(new SecretKeySpec(key, "HmacSHA256"));
                return HexFormat.of().formatHex(mac.doFinal(data));
            }
            if (PLAIN.equals(algorithm)) {
                return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(data));
            }
            throw new IllegalArgumentException("Algorithme de sceau inconnu : " + algorithm);
        } catch (NoSuchAlgorithmException | java.security.InvalidKeyException e) {
            throw new IllegalStateException(e);
        }
    }
}
