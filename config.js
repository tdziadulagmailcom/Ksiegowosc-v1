/**
 * Konfiguracja mapowania danych dla poszczególnych platform
 * Określa, które wartości mają trafić do jakich komórek w tabeli
 * Format: [wiersz, kolumna] - gdzie kolumna to indeks od 0 do 14 (A-O)
 */
const CONFIG = {
    // Amazon UK - Zgodnie z wymaganiami
    'uk': {
        name: 'Amazon UK',
        currency: 'GBP',
        mappings: {
            income: [7, 10],  // K8 (indeksy od 0, więc wiersz 7, kolumna 10)
            expenses: [20, 9], // J21
            tax: [7, 12]      // M8
        }
    },
    
    // Pozostałe platformy - zastępcze mapowania, które należy zaktualizować
    'de': {
        name: 'Amazon DE',
        currency: 'EUR',
        mappings: {
            income: [7, 10],  // K8
            expenses: [20, 9], // J21
            tax: [7, 12]      // M8
        }
    },
    
    'es': {
        name: 'Amazon ES',
        currency: 'EUR',
        mappings: {
            income: [7, 10],  // K8
            expenses: [20, 9], // J21
            tax: [7, 12]      // M8
        }
    },
    
    'fr': {
        name: 'Amazon FR',
        currency: 'EUR',
        mappings: {
            income: [7, 10],  // K8
            expenses: [20, 9], // J21
            tax: [7, 12]      // M8
        }
    },
    
    'nl': {
        name: 'Amazon NL',
        currency: 'EUR',
        mappings: {
            income: [7, 10],  // K8
            expenses: [20, 9], // J21
            tax: [7, 12]      // M8
        }
    },
    
    'it': {
        name: 'Amazon IT',
        currency: 'EUR',
        mappings: {
            income: [7, 10],  // K8
            expenses: [20, 9], // J21
            tax: [7, 12]      // M8
        }
    },
    
    'usa': {
        name: 'Amazon USA',
        currency: 'USD',
        mappings: {
            income: [7, 10],  // K8
            expenses: [20, 9], // J21
            tax: [7, 12]      // M8
        }
    },
    
    'ebay': {
        name: 'eBay',
        currency: 'GBP',
        mappings: {
            income: [7, 10],  // K8
            expenses: [20, 9], // J21
            tax: [7, 12]      // M8
        }
    },
    
    'etsy': {
        name: 'Etsy',
        currency: 'GBP',
        mappings: {
            income: [7, 10],  // K8
            expenses: [20, 9], // J21
            tax: [7, 12]      // M8
        }
    },
    
    'bandq': {
        name: 'B and Q',
        currency: 'GBP',
        mappings: {
            income: [7, 10],  // K8
            expenses: [20, 9], // J21
            tax: [7, 12]      // M8
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
        'income': ['Income', 'income', 'Sales', 'Revenue', 'Total'],
        'expenses': ['Expenses', 'expenses', 'Costs', 'Fees', 'Service Fee', 'Refund'],
        'tax': ['Tax', 'tax', 'VAT']
    },
    'de': {  // Amazon DE (German)
        'income': ['Einnahmen', 'Umsätze', 'Einnahmen und Erstattungen'],
        'expenses': ['Ausgaben', 'Gebühren', 'Kosten'],
        'tax': ['Steuer', 'MwSt', 'Mehrwertsteuer']
    },
    'es': {  // Amazon ES (Spanish)
        'income': ['Ingresos', 'Ventas', 'Ingresos y reembolsos'],
        'expenses': ['Gastos', 'Tarifas', 'Costes'],
        'tax': ['Impuesto', 'IVA']
    },
    'fr': {  // Amazon FR (French)
        'income': ['Revenus', 'Ventes', 'Chiffre d\'affaires'],
        'expenses': ['Dépenses', 'Frais', 'Coûts'],
        'tax': ['Taxe', 'TVA', 'Impôt']
    },
    'nl': {  // Amazon NL (Dutch)
        'income': ['Inkomsten', 'Verkoop', 'Omzet'],
        'expenses': ['Uitgaven', 'Kosten', 'Vergoedingen'],
        'tax': ['Belasting', 'BTW']
    },
    'it': {  // Amazon IT (Italian)
        'income': ['Entrate', 'Vendite', 'Ricavi'],
        'expenses': ['Spese', 'Costi', 'Commissioni'],
        'tax': ['Tassa', 'IVA', 'Imposta']
    },
    'usa': {  // Amazon USA (English)
        'income': ['Income', 'Sales', 'Revenue'],
        'expenses': ['Expenses', 'Costs', 'Fees'],
        'tax': ['Tax', 'Sales tax']
    }
};
