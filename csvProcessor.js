/**
 * Moduł do przetwarzania plików CSV
 */

/**
 * Przetwarza plik CSV i wyodrębnia dane finansowe
 * @param {File} file - Plik CSV do przetworzenia
 * @param {string} platform - Identyfikator platformy (np. 'uk', 'de')
 * @returns {Promise<Object>} - Obiekt z danymi finansowymi
 */
async function processCsv(file, platform) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const contents = e.target.result;
                    
                    // Przygotuj obiekt na dane finansowe
                    const financialData = {
                        Income: 0,
                        Expenses: 0,
                        Tax: 0
                    };
                    
                    // Pobierz słownik terminów dla wybranej platformy
                    const languageMap = LANGUAGE_MAPPINGS[platform] || LANGUAGE_MAPPINGS['uk'];
                    
                    // Parsowanie CSV przy użyciu biblioteki SheetJS
                    const workbook = XLSX.read(contents, { type: 'string' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Konwertuj na JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    
                    // Przeanalizuj dane z pliku CSV
                    const totalsByColumn = {};
                    
                    // Przeszukaj dane w poszukiwaniu wartości finansowych
                    for (const row of jsonData) {
                        // Przetwórz każdy wiersz z danymi
                        for (const key in row) {
                            // Sprawdź, czy klucz zawiera termin związany z przychodami
                            const lowerKey = key.toLowerCase();
                            
                            // Quickbooks: Jeśli to raport z Quickbooks, zakładamy że kolumna ItemAmount zawiera przychody
                            if (key === 'ItemAmount' || key === '*ItemAmount') {
                                const value = parseFloat(row[key]);
                                if (!isNaN(value)) {
                                    if (!totalsByColumn['ItemAmount']) {
                                        totalsByColumn['ItemAmount'] = 0;
                                    }
                                    totalsByColumn['ItemAmount'] += value;
                                }
                            }
                            
                            // Quickbooks: Jeśli to raport z Quickbooks, zakładamy że kolumna ItemTaxAmount zawiera podatek
                            if (key === 'ItemTaxAmount' || key === '*ItemTaxAmount') {
                                const value = parseFloat(row[key]);
                                if (!isNaN(value)) {
                                    if (!totalsByColumn['ItemTaxAmount']) {
                                        totalsByColumn['ItemTaxAmount'] = 0;
                                    }
                                    totalsByColumn['ItemTaxAmount'] += value;
                                }
                            }
                            
                            // Standardowe wyszukiwanie przychodów
                            if (languageMap.income.some(term => lowerKey.includes(term.toLowerCase()))) {
                                const value = parseFloat(row[key]);
                                if (!isNaN(value)) {
                                    if (value > financialData.Income) {
                                        financialData.Income = value;
                                    }
                                }
                            }
                            
                            // Standardowe wyszukiwanie wydatków
                            if (languageMap.expenses.some(term => lowerKey.includes(term.toLowerCase()))) {
                                const value = parseFloat(row[key]);
                                if (!isNaN(value)) {
                                    // Wydatki powinny być wartością ujemną
                                    if (value < 0 && value < financialData.Expenses) {
                                        financialData.Expenses = value;
                                    } else if (value > 0) {
                                        financialData.Expenses = -value;
                                    }
                                }
                            }
                            
                            // Standardowe wyszukiwanie podatku
                            if (languageMap.tax.some(term => lowerKey.includes(term.toLowerCase()))) {
                                const value = parseFloat(row[key]);
                                if (!isNaN(value) && value > financialData.Tax) {
                                    financialData.Tax = value;
                                }
                            }
                        }
                    }
                    
                    // Jeśli znaleźliśmy sumy z Quickbooks, użyjmy ich
                    if (totalsByColumn['ItemAmount'] && totalsByColumn['ItemAmount'] > 0) {
                        financialData.Income = totalsByColumn['ItemAmount'];
                    }
                    
                    if (totalsByColumn['ItemTaxAmount'] && totalsByColumn['ItemTaxAmount'] > 0) {
                        financialData.Tax = totalsByColumn['ItemTaxAmount'];
                    }
                    
                    // Jeśli nie znaleziono danych, używamy danych demonstracyjnych
                    if (financialData.Income === 0 && financialData.Expenses === 0 && financialData.Tax === 0) {
                        console.log('Nie znaleziono danych finansowych w pliku CSV, używam danych demonstracyjnych');
                        resolve({
                            platform: CONFIG[platform].name,
                            currency: CONFIG[platform].currency,
                            financialData: DEMO_DATA[platform].financialData
                        });
                        return;
                    }
                    
                    resolve({
                        platform: CONFIG[platform].name,
                        currency: CONFIG[platform].currency,
                        financialData: financialData
                    });
                    
                } catch (err) {
                    console.error('Błąd podczas przetwarzania pliku CSV:', err);
                    // W przypadku błędu zwracamy dane demonstracyjne
                    resolve({
                        platform: CONFIG[platform].name,
                        currency: CONFIG[platform].currency,
                        financialData: DEMO_DATA[platform].financialData
                    });
                }
            };
            
            reader.onerror = function() {
                console.error('Błąd odczytu pliku CSV');
                // W przypadku błędu zwracamy dane demonstracyjne
                resolve({
                    platform: CONFIG[platform].name,
                    currency: CONFIG[platform].currency,
                    financialData: DEMO_DATA[platform].financialData
                });
            };
            
            // Rozpocznij odczyt pliku
            reader.readAsText(file);
            
        } catch (error) {
            console.error('Błąd podczas przetwarzania pliku CSV:', error);
            // W przypadku błędu zwracamy dane demonstracyjne
            resolve({
                platform: CONFIG[platform].name,
                currency: CONFIG[platform].currency,
                financialData: DEMO_DATA[platform].financialData
            });
        }
    });
}