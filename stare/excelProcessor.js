/**
 * Moduł do przetwarzania plików Excel/CSV
 */

/**
 * Przetwarza plik Excel i wyodrębnia dane finansowe
 * @param {File} file - Plik Excel do przetworzenia
 * @param {string} platform - Identyfikator platformy (np. 'uk', 'de')
 * @returns {Promise<Object>} - Obiekt z danymi finansowymi
 */
async function processExcel(file, platform) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Przygotuj obiekt na dane finansowe
                    const financialData = {
                        Income: 0,
                        Expenses: 0,
                        Tax: 0
                    };
                    
                    // Pobierz słownik terminów dla wybranej platformy
                    const languageMap = LANGUAGE_MAPPINGS[platform] || LANGUAGE_MAPPINGS['uk'];
                    
                    // Przeanalizuj pierwszy arkusz
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Konwertuj na JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    
                    // Przeszukaj dane w poszukiwaniu wartości finansowych
                    for (const row of jsonData) {
                        // Przetwórz każdy wiersz z danymi
                        for (const key in row) {
                            // Sprawdź, czy klucz zawiera termin związany z przychodami
                            const lowerKey = key.toLowerCase();
                            
                            if (languageMap.income.some(term => lowerKey.includes(term.toLowerCase()))) {
                                // Znajdź wartość przychodu
                                const value = parseFloat(row[key]);
                                if (!isNaN(value) && value > financialData.Income) {
                                    financialData.Income = value;
                                }
                            }
                            
                            // Sprawdź, czy klucz zawiera termin związany z wydatkami
                            if (languageMap.expenses.some(term => lowerKey.includes(term.toLowerCase()))) {
                                // Znajdź wartość wydatków
                                const value = parseFloat(row[key]);
                                if (!isNaN(value)) {
                                    // Wydatki powinny być wartością ujemną
                                    financialData.Expenses = -Math.abs(value);
                                }
                            }
                            
                            // Sprawdź, czy klucz zawiera termin związany z podatkiem
                            if (languageMap.tax.some(term => lowerKey.includes(term.toLowerCase()))) {
                                // Znajdź wartość podatku
                                const value = parseFloat(row[key]);
                                if (!isNaN(value) && value > financialData.Tax) {
                                    financialData.Tax = value;
                                }
                            }
                            
                            // Specjalne przetwarzanie dla plików QuickBooks
                            if (key === 'ItemAmount' || key === '*ItemAmount') {
                                const value = parseFloat(row[key]);
                                if (!isNaN(value) && value > 0) {
                                    financialData.Income = value;
                                } else if (!isNaN(value) && value < 0) {
                                    financialData.Expenses = value;
                                }
                            }
                            
                            if (key === 'ItemTaxAmount' || key === '*ItemTaxAmount') {
                                const value = parseFloat(row[key]);
                                if (!isNaN(value) && value > 0) {
                                    financialData.Tax = value;
                                }
                            }
                        }
                    }
                    
                    // Jeśli nie znaleziono danych, używamy danych demonstracyjnych
                    if (financialData.Income === 0 && financialData.Expenses === 0 && financialData.Tax === 0) {
                        console.log('Nie znaleziono danych finansowych w pliku Excel, używam danych demonstracyjnych');
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
                    console.error('Błąd podczas przetwarzania pliku Excel:', err);
                    // W przypadku błędu zwracamy dane demonstracyjne
                    resolve({
                        platform: CONFIG[platform].name,
                        currency: CONFIG[platform].currency,
                        financialData: DEMO_DATA[platform].financialData
                    });
                }
            };
            
            reader.onerror = function() {
                console.error('Błąd odczytu pliku Excel');
                // W przypadku błędu zwracamy dane demonstracyjne
                resolve({
                    platform: CONFIG[platform].name,
                    currency: CONFIG[platform].currency,
                    financialData: DEMO_DATA[platform].financialData
                });
            };
            
            // Rozpocznij odczyt pliku
            reader.readAsArrayBuffer(file);
            
        } catch (error) {
            console.error('Błąd podczas przetwarzania pliku Excel:', error);
            // W przypadku błędu zwracamy dane demonstracyjne
            resolve({
                platform: CONFIG[platform].name,
                currency: CONFIG[platform].currency,
                financialData: DEMO_DATA[platform].financialData
            });
        }
    });
}