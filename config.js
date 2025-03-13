/**
 * Konfiguracja mapowania danych dla poszczególnych platform
 * Określa, które wartości mają trafić do jakich komórek w tabelach
 * Format: [tabela, wiersz, kolumna] - gdzie tabela to "sales" lub "bills", wiersz to indeks od 0, kolumna to indeks od 0 do 14 (A-O)
 */
const CONFIG = {
    // Amazon UK - Zgodnie z wymaganiami
    'uk': {
        name: 'Amazon UK',
        currency: 'GBP',
        mappings: {
            income: ['sales', 7, 10],  // Sales: L8 (indeksy od 0, więc wiersz 7, kolumna 10)
            expenses: ['bills', 6, 9], // Bills: K7 (indeksy od 0, więc wiersz 6, kolumna 9)
            tax: ['sales', 7, 12]      // Sales: N8 (indeksy od 0, więc wiersz 7, kolumna 12) - POPRAWIONE z 13 na 12
        },
        reportFormats: {
            // Typowe nagłówki i formaty używane w raportach Amazon UK
            headers: ["Account activity", "Summaries", "Income", "Expenses", "Tax", "Transfers"],
            dateFormat: "MMM DD, YYYY", // Format daty używany w raportach
            numberFormat: "#,##0.00", // Format liczb używany w raportach
            // Specyficzne wzorce dla Amazon UK
            patterns: {
                income: [
                    /Income\s+[\d,.-]+/i,
                    /Sales, credits, and refunds\s+[\d,.-]+/i
                ],
                expenses: [
                    /Expenses\s+[\d,.-]+/i,
                    /Fees, including Amazon\s+[\d,.-]+/i
                ],
                tax: [
                    /Tax\s+[\d,.-]+/i,
                    /Net taxes collected\s+[\d,.-]+/i
                ]
            }
        }
    },
    
    // Pozostałe platformy - zastępcze mapowania, które należy zaktualizować
    'de': {
        name: 'Amazon DE',
        currency: 'EUR',
        mappings: {
            income: ['sales', 8, 10],  // Sales: K9
            expenses: ['bills', 2, 10], // Bills: K3
            tax: ['sales', 8, 12]      // Sales: M9
        },
        reportFormats: {
            headers: ["Kontoaktivität", "Zusammenfassungen", "Einnahmen", "Ausgaben", "Steuern", "Überweisungen"],
            dateFormat: "DD.MM.YYYY",
            numberFormat: "#.##0,00"
        }
    },
    
    'es': {
        name: 'Amazon ES',
        currency: 'EUR',
        mappings: {
            income: ['sales', 12, 10],  // Sales: K13
            expenses: ['bills', 4, 10], // Bills: K5
            tax: ['sales', 12, 12]      // Sales: M13
        },
        reportFormats: {
            headers: ["Actividad de la cuenta", "Resúmenes", "Ingresos", "Gastos", "Impuestos", "Transferencias"],
            dateFormat: "DD/MM/YYYY",
            numberFormat: "#.##0,00"
        }
    },
    
    'fr': {
        name: 'Amazon FR',
        currency: 'EUR',
        mappings: {
            income: ['sales', 11, 10],  // Sales: K12
            expenses: ['bills', 3, 10], // Bills: K4
            tax: ['sales', 11, 12]      // Sales: M12
        },
        reportFormats: {
            headers: ["Activité du compte", "Résumés", "Revenus", "Dépenses", "Taxes", "Transferts"],
            dateFormat: "DD/MM/YYYY",
            numberFormat: "#.##0,00"
        }
    },
    
    'nl': {
        name: 'Amazon NL',
        currency: 'EUR',
        mappings: {
            income: ['sales', 8, 10],  // Sales: K9
            expenses: ['bills', 5, 10], // Bills: K6
            tax: ['sales', 8, 12]      // Sales: M9
        },
        reportFormats: {
            headers: ["Accountactiviteit", "Samenvattingen", "Inkomsten", "Uitgaven", "Belastingen", "Overschrijvingen"],
            dateFormat: "DD-MM-YYYY",
            numberFormat: "#.##0,00"
        }
    },
    
    'it': {
        name: 'Amazon IT',
        currency: 'EUR',
        mappings: {
            income: ['sales', 10, 10],  // Sales: K11
            expenses: ['bills', 2, 10], // Bills: K3
            tax: ['sales', 10, 12]      // Sales: M11
        },
        reportFormats: {
            headers: ["Attività dell'account", "Riepiloghi", "Entrate", "Spese", "Imposte", "Trasferimenti"],
            dateFormat: "DD/MM/YYYY",
            numberFormat: "#.##0,00"
        }
    },
    
    'usa': {
        name: 'Amazon USA',
        currency: 'USD',
        mappings: {
            income: ['sales', 5, 10],  // Sales: K6
            expenses: ['bills', 6, 10], // Bills: K7
            tax: ['sales', 5, 12]      // Sales: M6
        },
        reportFormats: {
            headers: ["Account activity", "Summaries", "Income", "Expenses", "Tax", "Transfers"],
            dateFormat: "MM/DD/YYYY",
            numberFormat: "#,##0.00"
        }
    },
    
    'ebay': {
        name: 'eBay',
        currency: 'GBP',
        mappings: {
            income: ['sales', 2, 10],  // Sales: K3
            expenses: ['bills', 7, 10], // Bills: K8
            tax: ['sales', 2, 12]      // Sales: M3
        }
    },
    
    'etsy': {
        name: 'Etsy',
        currency: 'GBP',
        mappings: {
            income: ['sales', 4, 10],  // Sales: K5
            expenses: ['bills', 8, 10], // Bills: K9
            tax: ['sales', 4, 12]      // Sales: M5
        }
    },
    
    'bandq': {
        name: 'B and Q',
        currency: 'GBP',
        mappings: {
            income: ['sales', 7, 10],  // Sales: K8
            expenses: ['bills', 9, 10], // Bills: K10
            tax: ['sales', 7, 12]      // Sales: M8
        }
    }
};

// Tłumaczenia dla interfejsu
const TRANSLATIONS = {
    'pl': {
        processBtn: "Przetwórz dane",
        clearBtn: "Wyczyść dane",
        downloadBtn: "Pobierz plik Excel",
        platformLabel: "Wybierz platformę:",
        fileLabel: "Wgraj plik raportu (PDF lub Excel):",
        resultsTitle: "Wyniki:",
        noFileError: "Proszę wybrać plik do przetworzenia.",
        processSuccess: "Dane zostały pomyślnie przetworzone i dodane do tabeli!",
        noDataError: "Brak danych do pobrania. Najpierw przetwórz plik.",
        dataCleared: "Dane zostały wyczyszczone.",
        downloadSuccess: "Plik Excel został wygenerowany i pobrany.",
        processingError: "Błąd podczas przetwarzania pliku."
    }
};

// Demonstracyjne dane używane gdy nie można odczytać pliku
const DEMO_DATA = {
    'uk': {
        platform: "Amazon UK",
        currency: "GBP",
        financialData: {
            Income: 18877.68,
            Expenses: -4681.52,
            Tax: 3775.67
        }
    },
    'de': {
        platform: "Amazon DE",
        currency: "EUR",
        financialData: {
            Income: 1594.42,
            Expenses: -335.12,
            Tax: 0
        }
    },
    'es': {
        platform: "Amazon ES",
        currency: "EUR",
        financialData: {
            Income: 15200.75,
            Expenses: -3250.40,
            Tax: 2860.15
        }
    },
    'fr': {
        platform: "Amazon FR",
        currency: "EUR",
        financialData: {
            Income: 12450.35,
            Expenses: -2890.28,
            Tax: 2245.60
        }
    },
    'nl': {
        platform: "Amazon NL",
        currency: "EUR",
        financialData: {
            Income: 9850.42,
            Expenses: -2120.85,
            Tax: 1680.30
        }
    },
    'it': {
        platform: "Amazon IT",
        currency: "EUR",
        financialData: {
            Income: 11250.65,
            Expenses: -2540.18,
            Tax: 1930.45
        }
    },
    'usa': {
        platform: "Amazon USA",
        currency: "USD",
        financialData: {
            Income: 25680.92,
            Expenses: -5840.34,
            Tax: 4325.78
        }
    },
    'ebay': {
        platform: "eBay",
        currency: "GBP",
        financialData: {
            Income: 8750.45,
            Expenses: -1980.25,
            Tax: 1485.20
        }
    },
    'etsy': {
        platform: "Etsy",
        currency: "GBP",
        financialData: {
            Income: 5680.30,
            Expenses: -1240.55,
            Tax: 935.40
        }
    },
    'bandq': {
        platform: "B and Q",
        currency: "GBP",
        financialData: {
            Income: 14580.60,
            Expenses: -3250.45,
            Tax: 2485.35
        }
    }
};

// Słownik terminów dla różnych języków w raportach Amazon
const LANGUAGE_MAPPINGS = {
    'uk': {  // Amazon UK (English)
        'income': ['Income', 'income', 'Sales', 'Revenue', 'Total', 'sales, credits, and refunds'],
        'expenses': ['Expenses', 'expenses', 'Costs', 'Fees', 'Service Fee', 'Refund', 'fees, including Amazon'],
        'tax': ['Tax', 'tax', 'VAT', 'net taxes collected']
    },
    'de': {  // Amazon DE (German)
        'income': ['Einnahmen', 'Umsätze', 'Einnahmen und Erstattungen', 'Verkäufe, Gutschriften und Rückerstattungen'],
        'expenses': ['Ausgaben', 'Gebühren', 'Kosten', 'Gebühren, einschließlich Amazon'],
        'tax': ['Steuer', 'MwSt', 'Mehrwertsteuer', 'Steuern auf Produkte']
    },
    'es': {  // Amazon ES (Spanish)
        'income': ['Ingresos', 'Ventas', 'Ingresos y reembolsos', 'Ventas, créditos y reembolsos'],
        'expenses': ['Gastos', 'Tarifas', 'Costes', 'Tarifas, incluidas las de Amazon'],
        'tax': ['Impuesto', 'IVA', 'Impuestos sobre productos']
    },
    'fr': {  // Amazon FR (French)
        'income': ['Revenus', 'Ventes', 'Chiffre d\'affaires', 'Ventes, crédits et remboursements'],
        'expenses': ['Dépenses', 'Frais', 'Coûts', 'Frais, y compris Amazon'],
        'tax': ['Taxe', 'TVA', 'Impôt', 'Taxes sur les produits']
    },
    'nl': {  // Amazon NL (Dutch)
        'income': ['Inkomsten', 'Verkoop', 'Omzet', 'Verkopen, tegoeden en terugbetalingen'],
        'expenses': ['Uitgaven', 'Kosten', 'Vergoedingen', 'Vergoedingen, inclusief Amazon'],
        'tax': ['Belasting', 'BTW', 'Productbelastingen']
    },
    'it': {  // Amazon IT (Italian)
        'income': ['Entrate', 'Vendite', 'Ricavi', 'Vendite, crediti e rimborsi'],
        'expenses': ['Spese', 'Costi', 'Commissioni', 'Commissioni, incluse quelle di Amazon'],
        'tax': ['Tassa', 'IVA', 'Imposta', 'Imposte sui prodotti']
    },
    'usa': {  // Amazon USA (English)
        'income': ['Income', 'Sales', 'Revenue', 'Sales, credits, and refunds'],
        'expenses': ['Expenses', 'Costs', 'Fees', 'Fees, including Amazon'],
        'tax': ['Tax', 'Sales tax', 'Product taxes']
    }
};
