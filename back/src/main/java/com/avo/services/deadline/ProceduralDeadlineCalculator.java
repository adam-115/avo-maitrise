package com.avo.services.deadline;

import com.avo.entities.DeadlineRule;
import com.avo.service.ai.Pays;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Moteur de calcul 100 % déterministe des délais de procédure et de prescription.
 *
 * <p>Ne fait jamais appel à un LLM : à paramètres identiques, le résultat est toujours
 * strictement identique et accompagné d'une explication pas-à-pas vérifiable par l'avocat.</p>
 *
 * <p>Règles appliquées (art. 640 à 645 CPC pour la France et équivalents européens) :</p>
 * <ol>
 *   <li>Point de départ ({@code dies a quo}) : non compté pour les délais en jours ; pour les délais en mois
 *       ou en années, expiration le jour portant le même quantième (ou dernier jour du mois à défaut, ex. 28/29 fév.).</li>
 *   <li>Délai franc ({@code estFranc = true}, ex. recours administratif art. R. 421-1 CJA) : +1 jour supplémentaire.</li>
 *   <li>Délai de distance (art. 643 CPC) : +1 mois (Outre-mer) ou +2 mois (Étranger), appliqué avant la prorogation.</li>
 *   <li>Suspension (ex. médiation art. 2238 C. civ.) : +N jours de suspension.</li>
 *   <li>Prorogation au premier jour ouvrable suivant (art. 642 CPC) si {@code prorogeWeekendFerie = true} ;
 *       désactivée pour les prescriptions civiles/sociales (Cass. civ. 1re, 12 déc. 2018, n° 17-25.697).</li>
 * </ol>
 */
@Service
public class ProceduralDeadlineCalculator {

    private static final DateTimeFormatter FR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final HolidayCalendarService holidayCalendar;

    public ProceduralDeadlineCalculator(HolidayCalendarService holidayCalendar) {
        this.holidayCalendar = holidayCalendar;
    }

    public record CalculationInput(
            LocalDate dateDepart,
            int dureeValeur,
            String dureeUnite,
            String pays,
            boolean prorogeWeekendFerie,
            boolean estFranc,
            int delaiDistanceMois,
            boolean alsaceMoselle,
            int suspensionJours,
            String baseLegale
    ) {}

    public record CalculationResult(
            LocalDate dateDepart,
            LocalDate dateBrute,
            LocalDate dateEcheance,
            boolean proroge,
            List<String> etapes,
            String resumeCalcul
    ) {}

    public CalculationResult calculate(DeadlineRule rule, LocalDate dateDepart, int delaiDistanceMois,
                                       boolean alsaceMoselle, int suspensionJours) {
        return calculate(new CalculationInput(
                dateDepart,
                rule.getDureeValeur(),
                rule.getDureeUnite(),
                rule.getPays(),
                rule.isProrogeWeekendFerie(),
                rule.isEstFranc(),
                delaiDistanceMois,
                alsaceMoselle,
                suspensionJours,
                rule.getBaseLegale()
        ));
    }

    public CalculationResult calculate(CalculationInput in) {
        if (in.dateDepart() == null) {
            throw new IllegalArgumentException("La date de départ est obligatoire.");
        }
        if (in.dureeValeur() < 0) {
            throw new IllegalArgumentException("La durée du délai doit être positive.");
        }

        String pays = Pays.normalize(in.pays());
        List<String> steps = new ArrayList<>();
        steps.add("Point de départ : " + in.dateDepart().format(FR_DATE) + " (" + pays + (in.alsaceMoselle() ? " / Alsace-Moselle" : "") + ")");

        // 1. Ajout de la durée principale (quantième à quantième pour MONTHS/YEARS, +N jours pour DAYS)
        LocalDate current = switch (in.dureeUnite() == null ? "DAYS" : in.dureeUnite().toUpperCase()) {
            case "YEARS" -> {
                LocalDate d = in.dateDepart().plusYears(in.dureeValeur());
                steps.add("+ " + in.dureeValeur() + " an(s) (quantième à quantième) → " + d.format(FR_DATE));
                yield d;
            }
            case "MONTHS" -> {
                LocalDate d = in.dateDepart().plusMonths(in.dureeValeur());
                steps.add("+ " + in.dureeValeur() + " mois (quantième à quantième) → " + d.format(FR_DATE));
                yield d;
            }
            default -> {
                LocalDate d = in.dateDepart().plusDays(in.dureeValeur());
                steps.add("+ " + in.dureeValeur() + " jour(s) (dies a quo non compté) → " + d.format(FR_DATE));
                yield d;
            }
        };

        // 2. Délai franc (+1 jour)
        if (in.estFranc()) {
            current = current.plusDays(1);
            steps.add("Délai franc (+1 jour) → " + current.format(FR_DATE));
        }

        // 3. Délai de distance (ex. art. 643 CPC : +1 mois Outre-mer, +2 mois Étranger)
        if (in.delaiDistanceMois() > 0) {
            current = current.plusMonths(in.delaiDistanceMois());
            steps.add("Délai de distance (+" + in.delaiDistanceMois() + " mois) → " + current.format(FR_DATE));
        }

        // 4. Suspension (médiation, aide juridictionnelle...)
        if (in.suspensionJours() > 0) {
            current = current.plusDays(in.suspensionJours());
            steps.add("Suspension (+" + in.suspensionJours() + " jour(s)) → " + current.format(FR_DATE));
        }

        LocalDate dateBrute = current;
        boolean proroge = false;

        // 5. Prorogation au premier jour ouvrable suivant (uniquement si la règle le prévoit)
        if (in.prorogeWeekendFerie()) {
            List<String> skipped = new ArrayList<>();
            while (holidayCalendar.isNonWorkingDay(current, pays, in.alsaceMoselle())) {
                String reason = holidayCalendar.nonWorkingReason(current, pays, in.alsaceMoselle());
                skipped.add(current.format(FR_DATE) + " (" + reason + ")");
                current = current.plusDays(1);
                proroge = true;
            }
            if (proroge) {
                steps.add("Prorogation au 1er jour ouvrable suivant (jours exclus : " + String.join(", ", skipped) + ") → " + current.format(FR_DATE));
            } else {
                steps.add("Échéance un jour ouvrable (" + current.format(FR_DATE) + ") : aucune prorogation nécessaire");
            }
        } else {
            steps.add("Délai de prescription sans prorogation week-end/férié → " + current.format(FR_DATE));
        }

        if (in.baseLegale() != null && !in.baseLegale().isBlank()) {
            steps.add("Base légale : " + in.baseLegale());
        }

        String resume = String.join(" | ", steps);
        return new CalculationResult(in.dateDepart(), dateBrute, current, proroge, steps, resume);
    }
}
