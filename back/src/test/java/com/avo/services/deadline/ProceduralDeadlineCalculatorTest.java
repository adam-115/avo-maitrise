package com.avo.services.deadline;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class ProceduralDeadlineCalculatorTest {

    private HolidayCalendarService holidays;
    private ProceduralDeadlineCalculator calculator;

    @BeforeEach
    void setUp() {
        holidays = new HolidayCalendarService();
        calculator = new ProceduralDeadlineCalculator(holidays);
    }

    @Test
    void easterSundayKnownYears() {
        assertEquals(LocalDate.of(2025, 4, 20), HolidayCalendarService.easterSunday(2025));
        assertEquals(LocalDate.of(2026, 4, 5), HolidayCalendarService.easterSunday(2026));
        assertEquals(LocalDate.of(2027, 3, 28), HolidayCalendarService.easterSunday(2027));
    }

    @Test
    void appelCivil1MoisQuantiemeAQuantiemeJourOuvrable() {
        // 23 nov 2026 + 1 mois = 23 déc 2026 (mercredi, ouvrable)
        var res = calculator.calculate(new ProceduralDeadlineCalculator.CalculationInput(
                LocalDate.of(2026, 11, 23), 1, "MONTHS", "FRANCE",
                true, false, 0, false, 0, "Art. 538 CPC"));
        assertEquals(LocalDate.of(2026, 12, 23), res.dateEcheance());
        assertFalse(res.proroge());
    }

    @Test
    void appelCivil31JanvierVers28FevrierAnneeNonBissextile() {
        // 31 janv 2027 + 1 mois = 28 fév 2027 (dimanche) -> prorogé au lundi 1er mars 2027
        var res = calculator.calculate(new ProceduralDeadlineCalculator.CalculationInput(
                LocalDate.of(2027, 1, 31), 1, "MONTHS", "FRANCE",
                true, false, 0, false, 0, "Art. 641-642 CPC"));
        assertEquals(LocalDate.of(2027, 2, 28), res.dateBrute());
        assertEquals(LocalDate.of(2027, 3, 1), res.dateEcheance());
        assertTrue(res.proroge());
    }

    @Test
    void appelCivil31JanvierAnneeBissextile() {
        // 31 janv 2028 + 1 mois = 29 fév 2028 (mardi, ouvrable)
        var res = calculator.calculate(new ProceduralDeadlineCalculator.CalculationInput(
                LocalDate.of(2028, 1, 31), 1, "MONTHS", "FRANCE",
                true, false, 0, false, 0, "Art. 641 CPC"));
        assertEquals(LocalDate.of(2028, 2, 29), res.dateEcheance());
        assertFalse(res.proroge());
    }

    @Test
    void prorogationWeekendEtJourFerieFrance() {
        // 15 jours à partir du 20 mars 2026 -> 4 avril 2026 (samedi), 5 avril (dimanche), 6 avril (Lundi de Pâques) -> mardi 7 avril 2026
        var res = calculator.calculate(new ProceduralDeadlineCalculator.CalculationInput(
                LocalDate.of(2026, 3, 20), 15, "DAYS", "FRANCE",
                true, false, 0, false, 0, "Art. 490 & 642 CPC"));
        assertEquals(LocalDate.of(2026, 4, 4), res.dateBrute());
        assertEquals(LocalDate.of(2026, 4, 7), res.dateEcheance());
        assertTrue(res.proroge());
    }

    @Test
    void alsaceMoselleVendrediSaintEt26Decembre() {
        // 3 avril 2026 = Vendredi Saint (férié en Alsace-Moselle uniquement)
        assertNull(holidays.getHolidayName(LocalDate.of(2026, 4, 3), "FRANCE", false));
        assertNotNull(holidays.getHolidayName(LocalDate.of(2026, 4, 3), "FRANCE", true));

        // 15 jours depuis le 19 mars 2026 -> 3 avril 2026 : ouvrable en France générale, prorogé au 7 avril en Alsace-Moselle
        var frGeneral = calculator.calculate(new ProceduralDeadlineCalculator.CalculationInput(
                LocalDate.of(2026, 3, 19), 15, "DAYS", "FRANCE", true, false, 0, false, 0, null));
        var alsace = calculator.calculate(new ProceduralDeadlineCalculator.CalculationInput(
                LocalDate.of(2026, 3, 19), 15, "DAYS", "FRANCE", true, false, 0, true, 0, null));

        assertEquals(LocalDate.of(2026, 4, 3), frGeneral.dateEcheance());
        assertEquals(LocalDate.of(2026, 4, 7), alsace.dateEcheance());
    }

    @Test
    void prescriptionSansProrogationWeekend() {
        // 14 nov 2026 + 1 an = 14 nov 2027 (dimanche) -> PAS de prorogation en prescription civile/sociale
        var res = calculator.calculate(new ProceduralDeadlineCalculator.CalculationInput(
                LocalDate.of(2026, 11, 14), 12, "MONTHS", "FRANCE",
                false, false, 0, false, 0, "Art. L. 1471-1 C. trav."));
        assertEquals(LocalDate.of(2027, 11, 14), res.dateEcheance());
        assertFalse(res.proroge());
    }

    @Test
    void delaiDeDistanceArt643AvantProrogation() {
        // 25 nov 2026 + 1 mois + 2 mois (étranger) = 25 fév 2027 (jeudi)
        var res = calculator.calculate(new ProceduralDeadlineCalculator.CalculationInput(
                LocalDate.of(2026, 11, 25), 1, "MONTHS", "FRANCE",
                true, false, 2, false, 0, "Art. 538 & 643 CPC"));
        assertEquals(LocalDate.of(2027, 2, 25), res.dateEcheance());
    }

    @Test
    void delaiFrancRecoursAdministratif() {
        // 10 janv 2026 + 2 mois = 10 mars + 1 jour franc = 11 mars 2026 (mercredi)
        var res = calculator.calculate(new ProceduralDeadlineCalculator.CalculationInput(
                LocalDate.of(2026, 1, 10), 2, "MONTHS", "FRANCE",
                true, true, 0, false, 0, "Art. R. 421-1 CJA"));
        assertEquals(LocalDate.of(2026, 3, 11), res.dateEcheance());
    }

    @Test
    void luxembourgFeteNationale23Juin() {
        // 23 juin 2026 = mardi, Fête nationale au Luxembourg -> prorogé au 24 juin 2026
        var res = calculator.calculate(new ProceduralDeadlineCalculator.CalculationInput(
                LocalDate.of(2026, 5, 14), 40, "DAYS", "LUXEMBOURG",
                true, false, 0, false, 0, "Art. 571 NCPC LU"));
        assertEquals(LocalDate.of(2026, 6, 23), res.dateBrute());
        assertEquals(LocalDate.of(2026, 6, 24), res.dateEcheance());
        assertTrue(res.proroge());
    }
}
