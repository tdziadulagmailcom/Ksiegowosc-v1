/**
 * Konfiguracja mapowania danych dla poszczególnych platform
 * Określa, które wartości mają trafić do jakich komórek w tabelach
 * Format: [tabela, wiersz, kolumna] - gdzie tabela to "sales" lub "bills", wiersz to indeks od 0, kolumna to indeks od 0 do 14 (A-O)
 */
const CONFIG = {
    // Amazon UK 
    'uk': {
        name: 'Amazon UK',
        currency: 'GBP',
        mappings: {
            income: ['sales', 7, 10],  // Sales: L8 (indeksy od 0, więc wiersz 7, kolumna 10)
            expenses: ['bills', 6, 9], // Bills: K7 (indeksy od 0, więc wiersz 6, kolumna 9)
            tax: ['sales', 7, 12]      // Sales: N8 (indeksy od 0, więc wiersz 7, kolumna 12)
        }
    },
    
    // Amazon DE
    'de': {
        name: 'Amazon DE',
        currency: 'EUR',
        mappings: {
            income: ['sales', 10, 10],  // Sales: L11 (indeksy od 0, więc wiersz 10, kolumna 10)
            expenses: ['bills', 9, 9],   // Bills: K10 (indeksy od 0, więc wiersz 9, kolumna 9)
            tax: ['none', 0, 0]         // Tax jest ignorowany dla Amazon DE
        }
    },
    
    // Amazon ES
    'es': {
        name: 'Amazon ES',
        currency: 'EUR',
        mappings: {
            income: ['sales', 9, 10],  // Sales: L10 (indeksy od 0, więc wiersz 9, kolumna 10)
            expenses: ['bills', 8, 9], // Bills: K9 (indeksy od 0, więc wiersz 8, kolumna 9)
            tax: ['none', 0, 0]        // Tax jest ignorowany dla Amazon ES
        }
    },
    
    // Amazon FR
    'fr': {
        name: 'Amazon FR',
        currency: 'EUR',
        mappings: {
            income: ['sales', 11, 10],  // Sales: L12 (indeksy od 0, więc wiersz 11, kolumna 10)
            expenses: ['bills', 10, 9],  // Bills: K11 (indeksy od 0, więc wiersz 10, kolumna 9)
            tax: ['none', 0, 0]         // Tax jest ignorowany dla Amazon FR
        }
    },
    
    // Amazon NL
    'nl': {
        name: 'Amazon NL',
        currency: 'EUR',
        mappings: {
            income: ['sales', 12, 10],  // Sales: L13 (indeksy od 0, więc wiersz 12, kolumna 10)
            expenses: ['bills', 11, 9],  // Bills: K12 (indeksy od 0, więc wiersz 11, kolumna 9)
            tax: ['sales', 12, 12]      // Sales: M13 (indeksy od 0, więc wiersz 12, kolumna 12)
        }
    },
    
    // Amazon IT
    'it': {
        name: 'Amazon IT',
        currency: 'EUR',
        mappings: {
            income: ['sales', 8, 10],  // Sales: L9 (indeksy od 0, więc wiersz 8, kolumna 10)
            expenses: ['bills', 7, 9], // Bills: K8 (indeksy od 0, więc wiersz 7, kolumna 9)
            tax: ['none', 0, 0]         // Tax jest ignorowany
        }
    },
    
    // Amazon USA
    'usa': {
        name: 'Amazon USA',
        currency: 'USD',
        mappings: {
            income: ['sales', 14, 10],  // Sales: L15 (indeksy od 0, więc wiersz 14, kolumna 10)
            expenses: ['bills', 13, 9],  // Bills: K14 (indeksy od 0, więc wiersz 13, kolumna 9)
            tax: ['sales', 14, 12]      // Sales: M15 (indeksy od 0, więc wiersz 14, kolumna 12)
        }
    },
    
    // Amazon BE
    'be': {
        name: 'Amazon BE',
        currency: 'EUR',
        mappings: {
            income: ['sales', 13, 10],  // Sales: L14 (indeksy od 0, więc wiersz 13, kolumna 10)
            expenses: ['bills', 12, 9],  // Bills: K13 (indeksy od 0, więc wiersz 12, kolumna 9)
            tax: ['sales', 13, 12]      // Sales: M14 (indeksy od 0, więc wiersz 13, kolumna 12)
        }
    },
    
    // eBay
    'ebay': {
        name: 'eBay',
        currency: 'GBP',
        mappings: {
            income: ['sales', 2, 10],  // Sales: K3
            expenses: ['bills', 7, 10], // Bills: K8
            tax: ['sales', 2, 12]      // Sales: M3
        }
    },
    
    // Etsy
    'etsy': {
        name: 'Etsy',
        currency: 'GBP',
        mappings: {
            income: ['sales', 4, 10],  // Sales: K5
            expenses: ['bills', 8, 10], // Bills: K9
            tax: ['sales', 4, 12]      // Sales: M5
        }
    },
    
    // B and Q
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
        fileLabel: "Wgraj plik raportu (Excel lub CSV):",
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
            Tax: 0
        }
    },
    'fr': {
        platform: "Amazon FR",
        currency: "EUR",
        financialData: {
            Income: 12450.35,
            Expenses: -2890.28,
            Tax: 0
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
            Tax: 0
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
    'be': {
        platform: "Amazon BE",
        currency: "EUR",
        financialData: {
            Income: 8945.30,
            Expenses: -1875.45,
            Tax: 1789.06
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
        'income': ['Ingresos', 'Ventas', 'ventas de productos', 'abonos de envío', 'abonos de envoltorio para regalo'],
        'expenses': ['Gastos', 'Tarifas', 'tarifas de venta', 'tarifas de Logística de Amazon', 'tarifas de otras transacciones'],
        'tax': ['Impuesto', 'IVA', 'impuesto de ventas de productos', 'impuestos por abonos de envío']
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
    },
    'be': {  // Amazon BE (French)
        'income': ['Revenus', 'Ventes', 'ventes de produits', 'crédits d\'expédition'],
        'expenses': ['Dépenses', 'Frais', 'frais de vente', 'Frais pour le service Expédié par Amazon', 'autres frais de transaction'],
        'tax': ['Taxe', 'TVA', 'taxe de ventes prélevée', 'Taxe Marketplace Facilitator']
    }
};