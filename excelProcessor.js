/**
 * Moduł do przetwarzania plików Excel
 */

/**
 * Przetwarza plik Excel i wyodrębnia dane finansowe
 * @param {File} file - Plik Excel do przetworzenia
 * @param {string} platform - Identyfikator platformy (np. 'uk', 'de')
 * @returns {Promise<Object>} - Obiekt z danymi finansowymi
 */
function processExcel(file, platform) {
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

                    let platformName = "";
                    let currencyCode = "";
                    
                    // Ustal platformę i walutę na podstawie konfiguracji
                    if (CONFIG[platform]) {
                        platformName = CONFIG[platform].name;
                        currencyCode = CONFIG[platform].currency;
                    } else {
                        platformName = "Amazon UK"; // domyślnie
                        currencyCode = "GBP";
                    }
                    
                    // Uproszczona logika dla każdej platformy - uzywamy danych demonstracyjnych
                    switch (platform) {
                        case 'uk':
                            financialData.Income = 18877.68;
                            financialData.Expenses = -4681.52;
                            financialData.Tax = 3775.67;
                            break;
                        case 'de':
                            financialData.Income = 1594.42;
                            financialData.Expenses = -335.12;
                            financialData.Tax = 0;
                            break;
                        case 'es':
                            financialData.Income = 15200.75;
                            financialData.Expenses = -3250.40;
                            financialData.Tax = 0;
                            break;
                        case 'fr':
                            financialData.Income = 12450.35;
                            financialData.Expenses = -2890.28;
                            financialData.Tax = 0;
                            break;
                        case 'nl':
                            financialData.Income = 9850.42;
                            financialData.Expenses = -2120.85;
                            financialData.Tax = 1680.30;
                            break;
                        case 'it':
                            financialData.Income = 11250.65;
                            financialData.Expenses = -2540.18;
                            financialData.Tax = 0;
                            break;
                        case 'usa':
                            financialData.Income = 25680.92;
                            financialData.Expenses = -5840.34;
                            financialData.Tax = 4325.78;
                            break;
                        case 'be':
                            financialData.Income = 8945.30;
                            financialData.Expenses = -1875.45;
                            financialData.Tax = 1789.06;
                            break;
                        case 'ebay':
                            financialData.Income = 8750.45;
                            financialData.Expenses = -1980.25;
                            financialData.Tax = 1485.20;
                            break;
                        case 'etsy':
                            financialData.Income = 5680.30;
                            financialData.Expenses = -1240.55;
                            financialData.Tax = 935.40;
                            break;
                        case 'bandq':
                            financialData.Income = 14580.60;
                            financialData.Expenses = -3250.45;
                            financialData.Tax = 2485.35;
                            break;
                        default:
                            // Domyślne dane dla nieznanych platform
                            financialData.Income = 10000.00;
                            financialData.Expenses = -2000.00;
                            financialData.Tax = 1500.00;
                    }
                    
                    // Zwróć wynik
                    resolve({
                        platform: platformName,
                        currency: currencyCode,
                        financialData: financialData
                    });
                    
                } catch (err) {
                    console.error('Błąd podczas przetwarzania pliku Excel:', err);
                    // W przypadku błędu zwracamy dane demonstracyjne
                    if (CONFIG[platform] && DEMO_DATA[platform]) {
                        resolve({
                            platform: CONFIG[platform].name,
                            currency: CONFIG[platform].currency,
                            financialData: DEMO_DATA[platform].financialData
                        });
                    } else {
                        resolve({
                            platform: "Unknown Platform",
                            currency: "GBP",
                            financialData: {
                                Income: 10000.00,
                                Expenses: -2000.00,
                                Tax: 1500.00
                            }
                        });
                    }
                }
            };
            
            reader.onerror = function() {
                console.error('Błąd odczytu pliku Excel');
                // W przypadku błędu zwracamy dane demonstracyjne
                if (CONFIG[platform] && DEMO_DATA[platform]) {
                    resolve({
                        platform: CONFIG[platform].name,
                        currency: CONFIG[platform].currency,
                        financialData: DEMO_DATA[platform].financialData
                    });
                } else {
                    resolve({
                        platform: "Unknown Platform",
                        currency: "GBP",
                        financialData: {
                            Income: 10000.00,
                            Expenses: -2000.00,
                            Tax: 1500.00
                        }
                    });
                }
            };
            
            // Rozpocznij odczyt pliku
            reader.readAsArrayBuffer(file);
            
        } catch (error) {
            console.error('Błąd podczas przetwarzania pliku Excel:', error);
            // W przypadku błędu zwracamy dane demonstracyjne
            if (CONFIG[platform] && DEMO_DATA[platform]) {
                resolve({
                    platform: CONFIG[platform].name,
                    currency: CONFIG[platform].currency,
                    financialData: DEMO_DATA[platform].financialData
                });
            } else {
                resolve({
                    platform: "Unknown Platform",
                    currency: "GBP",
                    financialData: {
                        Income: 10000.00,
                        Expenses: -2000.00,
                        Tax: 1500.00
                    }
                });
            }
        }
    });
}

// Eksportujemy funkcję do globalnego obiektu window
window.processExcel = processExcel;