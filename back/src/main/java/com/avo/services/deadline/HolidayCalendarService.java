package com.avo.services.deadline;

import com.avo.service.ai.Pays;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Month;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Calendrier déterministe des jours fériés légaux par pays (France + Alsace-Moselle,
 * Luxembourg, Belgique, Suisse, Allemagne) avec calcul exact des fêtes mobiles via Pâques
 * (algorithme de Meeus/Jones/Butcher).
 */
@Service
public class HolidayCalendarService {

    /** Retourne le nom du jour férié si la date est fériée dans le pays donné, sinon {@code null}. */
    public String getHolidayName(LocalDate date, String pays, boolean alsaceMoselle) {
        if (date == null) return null;
        return holidaysForYear(date.getYear(), pays, alsaceMoselle).get(date);
    }

    /** Vrai si la date est un samedi, un dimanche ou un jour férié légal dans le pays donné. */
    public boolean isNonWorkingDay(LocalDate date, String pays, boolean alsaceMoselle) {
        DayOfWeek dow = date.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
            return true;
        }
        return getHolidayName(date, pays, alsaceMoselle) != null;
    }

    /** Retourne la raison pour laquelle la date est non ouvrable (ex. "samedi", "Lundi de Pâques"), ou null. */
    public String nonWorkingReason(LocalDate date, String pays, boolean alsaceMoselle) {
        if (date.getDayOfWeek() == DayOfWeek.SATURDAY) return "samedi";
        if (date.getDayOfWeek() == DayOfWeek.SUNDAY) return "dimanche";
        return getHolidayName(date, pays, alsaceMoselle);
    }

    /** Ensemble des jours fériés légaux pour une année et un pays donnés. */
    public Map<LocalDate, String> holidaysForYear(int year, String pays, boolean alsaceMoselle) {
        String normalized = Pays.normalize(pays);
        LocalDate easter = easterSunday(year);
        Map<LocalDate, String> h = new LinkedHashMap<>();

        switch (normalized) {
            case "LUXEMBOURG" -> {
                h.put(LocalDate.of(year, Month.JANUARY, 1), "Nouvel An");
                h.put(easter.plusDays(1), "Lundi de Pâques");
                h.put(LocalDate.of(year, Month.MAY, 1), "Fête du Travail");
                h.put(LocalDate.of(year, Month.MAY, 9), "Journée de l'Europe");
                h.put(easter.plusDays(39), "Ascension");
                h.put(easter.plusDays(50), "Lundi de Pentecôte");
                h.put(LocalDate.of(year, Month.JUNE, 23), "Fête nationale (Luxembourg)");
                h.put(LocalDate.of(year, Month.AUGUST, 15), "Assomption");
                h.put(LocalDate.of(year, Month.NOVEMBER, 1), "Toussaint");
                h.put(LocalDate.of(year, Month.DECEMBER, 25), "Noël");
                h.put(LocalDate.of(year, Month.DECEMBER, 26), "Saint-Étienne");
            }
            case "BELGIQUE" -> {
                h.put(LocalDate.of(year, Month.JANUARY, 1), "Nouvel An");
                h.put(easter.plusDays(1), "Lundi de Pâques");
                h.put(LocalDate.of(year, Month.MAY, 1), "Fête du Travail");
                h.put(easter.plusDays(39), "Ascension");
                h.put(easter.plusDays(50), "Lundi de Pentecôte");
                h.put(LocalDate.of(year, Month.JULY, 21), "Fête nationale (Belgique)");
                h.put(LocalDate.of(year, Month.AUGUST, 15), "Assomption");
                h.put(LocalDate.of(year, Month.NOVEMBER, 1), "Toussaint");
                h.put(LocalDate.of(year, Month.NOVEMBER, 11), "Armistice");
                h.put(LocalDate.of(year, Month.DECEMBER, 25), "Noël");
            }
            case "SUISSE" -> {
                h.put(LocalDate.of(year, Month.JANUARY, 1), "Nouvel An");
                h.put(easter.minusDays(2), "Vendredi Saint");
                h.put(easter.plusDays(1), "Lundi de Pâques");
                h.put(easter.plusDays(39), "Ascension");
                h.put(easter.plusDays(50), "Lundi de Pentecôte");
                h.put(LocalDate.of(year, Month.AUGUST, 1), "Fête nationale suisse");
                h.put(LocalDate.of(year, Month.DECEMBER, 25), "Noël");
            }
            case "ALLEMAGNE" -> {
                h.put(LocalDate.of(year, Month.JANUARY, 1), "Neujahr");
                h.put(easter.minusDays(2), "Karfreitag");
                h.put(easter.plusDays(1), "Ostermontag");
                h.put(LocalDate.of(year, Month.MAY, 1), "Tag der Arbeit");
                h.put(easter.plusDays(39), "Christi Himmelfahrt");
                h.put(easter.plusDays(50), "Pfingstmontag");
                h.put(LocalDate.of(year, Month.OCTOBER, 3), "Tag der Deutschen Einheit");
                h.put(LocalDate.of(year, Month.DECEMBER, 25), "1. Weihnachtstag");
                h.put(LocalDate.of(year, Month.DECEMBER, 26), "2. Weihnachtstag");
            }
            case "FRANCE" -> {
                h.put(LocalDate.of(year, Month.JANUARY, 1), "Jour de l'An");
                h.put(easter.plusDays(1), "Lundi de Pâques");
                h.put(LocalDate.of(year, Month.MAY, 1), "Fête du Travail");
                h.put(LocalDate.of(year, Month.MAY, 8), "Victoire 1945");
                h.put(easter.plusDays(39), "Ascension");
                h.put(easter.plusDays(50), "Lundi de Pentecôte");
                h.put(LocalDate.of(year, Month.JULY, 14), "Fête nationale");
                h.put(LocalDate.of(year, Month.AUGUST, 15), "Assomption");
                h.put(LocalDate.of(year, Month.NOVEMBER, 1), "Toussaint");
                h.put(LocalDate.of(year, Month.NOVEMBER, 11), "Armistice 1918");
                h.put(LocalDate.of(year, Month.DECEMBER, 25), "Noël");
                if (alsaceMoselle) {
                    h.put(easter.minusDays(2), "Vendredi Saint (Alsace-Moselle)");
                    h.put(LocalDate.of(year, Month.DECEMBER, 26), "Saint-Étienne (Alsace-Moselle)");
                }
            }
            default -> {
                // INTERNATIONAL : week-ends uniquement + 1er janvier et 25 décembre
                h.put(LocalDate.of(year, Month.JANUARY, 1), "Nouvel An");
                h.put(LocalDate.of(year, Month.DECEMBER, 25), "Noël");
            }
        }
        return h;
    }

    /** Dimanche de Pâques (calendrier grégorien) — algorithme de Meeus/Jones/Butcher. */
    public static LocalDate easterSunday(int year) {
        int a = year % 19;
        int b = year / 100;
        int c = year % 100;
        int d = b / 4;
        int e = b % 4;
        int f = (b + 8) / 25;
        int g = (b - f + 1) / 3;
        int h = (19 * a + b - d - g + 15) % 30;
        int i = c / 4;
        int k = c % 4;
        int l = (32 + 2 * e + 2 * i - h - k) % 7;
        int m = (a + 11 * h + 22 * l) / 451;
        int month = (h + l - 7 * m + 114) / 31;
        int day = ((h + l - 7 * m + 114) % 31) + 1;
        return LocalDate.of(year, month, day);
    }
}
