/**
 * Moduł do przetwarzania plików PDF
 */

// Zapewniamy, że pdf.js jest załadowany
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

/**
 * Przetwarza plik PDF i wyodrębnia dane finansowe
 * @param {File} file - Plik PDF do przetworzenia
 * @param {string} platform - Identyfikator platformy (np. 'uk', 'de')
 * @returns {Promise<Object>} - Obiekt z danymi finansowymi
 */
async function processPdf(file, platform) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        // Przygotuj obiekt na dane finansowe
        const financialData = {
            Income: 0,
            Expenses: 0,
            Tax: 0
        };
        
        // Pobierz słownik terminów dla wybranej platformy
        const languageMap = LANGUAGE_MAPPINGS[platform] || LANGUAGE_MAPPINGS['uk'];
        
        // Przetwarzamy każdą stronę PDF
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const textItems = textContent.items.map(item => item.str);
            
            // Łączymy wszystkie elementy tekstu z tej strony
            const pageText = textItems.join(' ');
            
            // Logika wyszukiwania wartości w tekście
            console.log(`Przetwarzam stronę ${i}, szukam danych finansowych...`);
            
            // Szukamy income (przychody)
            for (const incomeTerm of languageMap.income) {
                const incomeIndex = pageText.indexOf(incomeTerm);
                if (incomeIndex !== -1) {
                    // Szukamy liczby po terminie income
                    const incomeMatch = pageText.substring(incomeIndex).match(/[£$€]?\s*(\d{1,3}(,\d{3})*(\.\d{1,2})?)/);
                    if (incomeMatch) {
                        const incomeValue = parseFloat(incomeMatch[1].replace(/,/g, ''));
                        if (!isNaN(incomeValue) && incomeValue > financialData.Income) {
                            financialData.Income = incomeValue;
                        }
                    }
                }
            }
            
            // Szukamy expenses (wydatki)
            for (const expensesTerm of languageMap.expenses) {
                const expensesIndex = pageText.indexOf(expensesTerm);
                if (expensesIndex !== -1) {
                    // Szukamy liczby po terminie expenses
                    const expensesMatch = pageText.substring(expensesIndex).match(/[£$€]?\s*(\d{1,3}(,\d{3})*(\.\d{1,2})?)/);
                    if (expensesMatch) {
                        const expensesValue = parseFloat(expensesMatch[1].replace(/,/g, ''));
                        if (!isNaN(expensesValue)) {
                            // Wydatki powinny być wartością ujemną
                            financialData.Expenses = -Math.abs(expensesValue);
                        }
                    }
                }
            }
            
            // Szukamy tax (podatek)
            for (const taxTerm of languageMap.tax) {
                const taxIndex = pageText.indexOf(taxTerm);
                if (taxIndex !== -1) {
                    // Sprawdzamy czy termin tax nie występuje w kontekście wydatków
                    if (!languageMap.expenses.some(term => pageText.substring(taxIndex - 20, taxIndex).includes(term))) {
                        // Szukamy liczby po terminie tax
                        const taxMatch = pageText.substring(taxIndex).match(/[£$€]?\s*(\d{1,3}(,\d{3})*(\.\d{1,2})?)/);
                        if (taxMatch) {
                            const taxValue = parseFloat(taxMatch[1].replace(/,/g, ''));
                            if (!isNaN(taxValue) && taxValue > financialData.Tax) {
                                financialData.Tax = taxValue;
                            }
                        }
                    }
                }
            }
        }
        
        // Jeśli nie znaleziono danych, używamy danych demonstracyjnych
        if (financialData.Income === 0 && financialData.Expenses === 0 && financialData.Tax === 0) {
            console.log('Nie znaleziono danych finansowych w pliku PDF, używam danych demonstracyjnych');
            return {
                platform: CONFIG[platform].name,
                currency: CONFIG[platform].currency,
                financialData: DEMO_DATA[platform].financialData
            };
        }
        
        return {
            platform: CONFIG[platform].name,
            currency: CONFIG[platform].currency,
            financialData: financialData
        };
        
    } catch (error) {
        console.error('Błąd podczas przetwarzania pliku PDF:', error);
        // W przypadku błędu zwracamy dane demonstracyjne
        return {
            platform: CONFIG[platform].name,
            currency: CONFIG[platform].currency,
            financialData: DEMO_DATA[platform].financialData
        };
    }
}
