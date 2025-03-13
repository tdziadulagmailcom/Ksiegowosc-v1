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
        
        // Pełny tekst ze wszystkich stron
        let fullText = '';
        
        // Przetwarzamy każdą stronę PDF
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const textItems = textContent.items.map(item => item.str);
            
            // Łączymy wszystkie elementy tekstu z tej strony
            const pageText = textItems.join(' ');
            fullText += pageText + ' ';
        }
        
        console.log('Przetwarzam PDF, długość tekstu:', fullText.length);
        
        // Wykryj format raportu Amazon
        const reportFormat = detectReportFormat(fullText);
        console.log('Wykryty format raportu:', reportFormat);
        
        // Zresetuj flagi wykrywania wartości
        let incomeFound = false;
        let expensesFound = false;
        let taxFound = false;
        
        // Wartości które zostaną przypisane do financialData w przypadku ich znalezienia
        let detectedIncome = 0;
        let detectedExpenses = 0;
        let detectedTax = 0;
        
        // Poziomy pewności dla wykrytych wartości (low, medium, high)
        let incomeConfidence = 'low';
        let expensesConfidence = 'low';
        let taxConfidence = 'low';
        
        // Dla raportów Amazon UK stosujemy specjalne metody wykrywania
        if (platform === 'uk') {
            // Metoda 1: Bezpośrednie wyszukiwanie w specyficznych formatach raportów Amazon
            await extractAmazonUkValues(fullText, financialData);
            
            // Sprawdź, które wartości zostały znalezione
            if (financialData.Income > 0) {
                incomeFound = true;
                incomeConfidence = 'high';
                console.log('Amazon UK: znaleziono Income:', financialData.Income);
            }
            
            if (financialData.Expenses < 0) {
                expensesFound = true;
                expensesConfidence = 'high';
                console.log('Amazon UK: znaleziono Expenses:', financialData.Expenses);
            }
            
            if (financialData.Tax > 0) {
                taxFound = true;
                taxConfidence = 'high';
                console.log('Amazon UK: znaleziono Tax:', financialData.Tax);
            }
        }
        // Dla raportów Amazon DE stosujemy specjalne metody wykrywania
        else if (platform === 'de') {
            // Specjalna metoda dla Amazon DE
            const dataFound = await extractAmazonDeValues(fullText, financialData);
            
            // Sprawdź, które wartości zostały znalezione
            if (financialData.Income > 0) {
                incomeFound = true;
                incomeConfidence = 'high';
                console.log('Amazon DE: znaleziono Income:', financialData.Income);
            }
            
            if (financialData.Expenses < 0) {
                expensesFound = true;
                expensesConfidence = 'high';
                console.log('Amazon DE: znaleziono Expenses:', financialData.Expenses);
            }
            
            // Tax dla Amazon DE jest zawsze 0 i ignorowany w tabelce
            taxFound = true;
            taxConfidence = 'high';
            console.log('Amazon DE: Tax jest ignorowany, ustawiono na 0');
        }
        
        // Jeżeli wartości nie zostały znalezione metodą specjalną, użyj ogólnego algorytmu
        if (!incomeFound || !expensesFound || !taxFound) {
            console.log('Używam ogólnego algorytmu wykrywania wartości...');
            
            // Zbierz wszystkie liczby z dokumentu wraz z ich kontekstem
            const numbersWithContext = extractNumbersWithContext(fullText);
            console.log(`Znaleziono ${numbersWithContext.length} wartości liczbowych w dokumencie`);
            
            // Przeanalizuj każdą liczbę i jej kontekst
            for (const item of numbersWithContext) {
                analyzeNumberContext(item, financialData, languageMap, 
                    incomeFound, expensesFound, taxFound,
                    detectedIncome, detectedExpenses, detectedTax,
                    incomeConfidence, expensesConfidence, taxConfidence);
            }
            
            // Przypisz wykryte wartości do obiektu finansowego jeśli mają wysoki poziom pewności
            if (!incomeFound && detectedIncome > 0 && incomeConfidence !== 'low') {
                financialData.Income = detectedIncome;
                incomeFound = true;
                console.log('Ogólny algorytm: znaleziono Income:', financialData.Income, 
                    'pewność:', incomeConfidence);
            }
            
            if (!expensesFound && detectedExpenses < 0 && expensesConfidence !== 'low') {
                financialData.Expenses = detectedExpenses;
                expensesFound = true;
                console.log('Ogólny algorytm: znaleziono Expenses:', financialData.Expenses,
                    'pewność:', expensesConfidence);
            }
            
            if (!taxFound && detectedTax > 0 && taxConfidence !== 'low') {
                financialData.Tax = detectedTax;
                taxFound = true;
                console.log('Ogólny algorytm: znaleziono Tax:', financialData.Tax,
                    'pewność:', taxConfidence);
            }
        }
        
        // Ostatnia próba: przeszukaj sekcje "Totals" i "Summaries" dokumentu
        if (!incomeFound || !expensesFound || !taxFound) {
            console.log('Przeszukuję sekcje Totals i Summaries dokumentu...');
            
            // Znajdź sekcję Totals
            const totalsSection = fullText.match(/Totals[\s\S]{0,500}/);
            if (totalsSection) {
                extractValuesFromSection(totalsSection[0], financialData, 
                    incomeFound, expensesFound, taxFound);
            }
            
            // Znajdź sekcję Summaries
            const summariesSection = fullText.match(/Summaries[\s\S]{0,500}/);
            if (summariesSection) {
                extractValuesFromSection(summariesSection[0], financialData,
                    incomeFound, expensesFound, taxFound);
            }
        }
        
        // Przeszukaj specyficzne linie dokumentu
        if (!incomeFound || !expensesFound || !taxFound) {
            console.log('Przeszukuję linie dokumentu w poszukiwaniu wartości...');
            const lines = fullText.split('\n');
            
            for (const line of lines) {
                // Szukaj linii zawierających kluczowe słowa i liczby
                if (!incomeFound && line.match(/income|sales|revenue/i)) {
                    const numbers = extractNumbersFromText(line);
                    const largestNumber = findLargestNumber(numbers);
                    if (largestNumber > 0) {
                        financialData.Income = largestNumber;
                        incomeFound = true;
                        console.log('Znaleziono Income w linii:', largestNumber, line.trim());
                    }
                }
                
                if (!expensesFound && line.match(/expenses|costs|fees/i)) {
                    const numbers = extractNumbersFromText(line);
                    const smallestNumber = findSmallestNumber(numbers);
                    if (smallestNumber < 0) {
                        financialData.Expenses = smallestNumber;
                        expensesFound = true;
                        console.log('Znaleziono Expenses w linii:', smallestNumber, line.trim());
                    } else if (numbers.length > 0) {
                        // Wydatki mogą być zapisane jako liczba dodatnia
                        const largestNumber = findLargestNumber(numbers);
                        if (largestNumber > 0) {
                            financialData.Expenses = -largestNumber;
                            expensesFound = true;
                            console.log('Znaleziono Expenses (dodatnie) w linii:', -largestNumber, line.trim());
                        }
                    }
                }
                
                if (!taxFound && line.match(/tax|vat/i)) {
                    const numbers = extractNumbersFromText(line);
                    const largestNumber = findLargestNumber(numbers);
                    if (largestNumber > 0) {
                        financialData.Tax = largestNumber;
                        taxFound = true;
                        console.log('Znaleziono Tax w linii:', largestNumber, line.trim());
                    }
                }
            }
        }
        
        // Waliduj wykryte wartości
        validateFinancialData(financialData);
        
        // Podsumowanie wykrytych wartości
        console.log('Finalne wartości finansowe:', financialData);
        
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
        
        // Szczegółowa diagnostyka błędu
        let diagnosticInfo = {
            errorType: error.name,
            errorMessage: error.message,
            fileSize: file.size,
            fileName: file.name,
            platform: platform,
            pdfVersion: null // Będzie wypełnione jeśli PDF został poprawnie załadowany
        };
        
        // Zapisz informacje diagnostyczne do konsoli
        console.log('Diagnostyka błędu:', diagnosticInfo);
        
        // W przypadku błędu zwracamy dane demonstracyjne
        return {
            platform: CONFIG[platform].name,
            currency: CONFIG[platform].currency,
            financialData: DEMO_DATA[platform].financialData,
            error: true,
            errorMessage: `Nie udało się odczytać pliku: ${error.message}`
        };
    }
}

/**
 * Wykrywa format raportu na podstawie tekstu
 * @param {string} text - Pełny tekst dokumentu
 * @returns {string} - Nazwa formatu raportu
 */
function detectReportFormat(text) {
    // Sprawdź typ raportu na podstawie nagłówków i formatowania
    if (text.includes("amazon services europe") && text.includes("seller central")) {
        return "amazon_eu_seller_central";
    }
    if (text.includes("Account activity") && text.includes("GMT")) {
        return "amazon_account_activity";
    }
    if (text.includes("ChillHouse") && text.includes("Chill House Ltd")) {
        return "amazon_chillhouse_account";
    }
    return "unknown";
}

/**
 * Ekstrahuje liczby wraz z kontekstem z tekstu
 * @param {string} text - Pełny tekst dokumentu
 * @returns {Array} - Tablica obiektów {value, context}
 */
function extractNumbersWithContext(text) {
    const result = [];
    const numberPattern = /([+-]?\d{1,3}(,\d{3})*(\.\d{1,2})?)/g;
    let match;
    
    // Znajdź wszystkie liczby i zapisz je z kontekstem (30 znaków przed i po)
    while ((match = numberPattern.exec(text)) !== null) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(value)) {
            // Pobierz kontekst przed i po liczbie
            const startIndex = Math.max(0, match.index - 30);
            const endIndex = Math.min(text.length, match.index + match[0].length + 30);
            const context = text.substring(startIndex, endIndex);
            
            result.push({
                value: value,
                context: context
            });
        }
    }
    
    return result;
}

/**
 * Analizuje kontekst liczby, by określić czy to Income, Expenses czy Tax
 * @param {Object} item - Obiekt {value, context}
 * @param {Object} financialData - Obiekt na dane finansowe
 * @param {Object} languageMap - Mapa terminów dla danego języka
 * @param {boolean} incomeFound - Czy znaleziono już Income
 * @param {boolean} expensesFound - Czy znaleziono już Expenses
 * @param {boolean} taxFound - Czy znaleziono już Tax
 * @param {number} detectedIncome - Wykryta wartość Income
 * @param {number} detectedExpenses - Wykryta wartość Expenses
 * @param {number} detectedTax - Wykryta wartość Tax
 * @param {string} incomeConfidence - Poziom pewności dla Income
 * @param {string} expensesConfidence - Poziom pewności dla Expenses
 * @param {string} taxConfidence - Poziom pewności dla Tax
 */
function analyzeNumberContext(item, financialData, languageMap,
    incomeFound, expensesFound, taxFound,
    detectedIncome, detectedExpenses, detectedTax,
    incomeConfidence, expensesConfidence, taxConfidence) {
    
    // Income (przychody) - szukaj dużych dodatnich wartości w kontekście słów związanych z przychodami
    if (!incomeFound && languageMap.income.some(term => 
        item.context.toLowerCase().includes(term.toLowerCase()))) {
        if (item.value > 0 && item.value > detectedIncome) {
            // Sprawdź kontekst, aby określić poziom pewności
            if (item.context.match(/\b(total|income|all|sum|revenue)\b/i)) {
                detectedIncome = item.value;
                incomeConfidence = 'high';
                console.log(`Wykryto Income (high): ${item.value}, kontekst: "${item.context.trim()}"`);
            } else {
                detectedIncome = item.value;
                incomeConfidence = 'medium';
                console.log(`Wykryto Income (medium): ${item.value}, kontekst: "${item.context.trim()}"`);
            }
        }
    }
    
    // Expenses (wydatki) - szukaj ujemnych wartości lub dodatnich w kontekście wydatków
    if (!expensesFound) {
        if (languageMap.expenses.some(term => 
            item.context.toLowerCase().includes(term.toLowerCase()))) {
            // Jeżeli wartość jest ujemna, to prawdopodobnie to są wydatki
            if (item.value < 0 && item.value < detectedExpenses) {
                detectedExpenses = item.value;
                expensesConfidence = 'high';
                console.log(`Wykryto Expenses (high): ${item.value}, kontekst: "${item.context.trim()}"`);
            }
            // Albo jeżeli wartość jest dodatnia, ale kontekst sugeruje, że to wydatek
            else if (item.value > 0 && item.context.match(/\b(expenses|fees|costs|total expenses)\b/i)) {
                // Wydatki zawsze powinny być zapisane jako ujemne
                const expenseValue = -Math.abs(item.value);
                if (expenseValue < detectedExpenses) {
                    detectedExpenses = expenseValue;
                    expensesConfidence = 'medium';
                    console.log(`Wykryto Expenses (medium): ${expenseValue}, kontekst: "${item.context.trim()}"`);
                }
            }
        }
    }
    
    // Tax (podatek) - szukaj dodatnich wartości w kontekście podatku
    if (!taxFound && languageMap.tax.some(term => 
        item.context.toLowerCase().includes(term.toLowerCase()))) {
        // Podatek powinien być wartością dodatnią
        if (item.value > 0 && item.value > detectedTax) {
            // Upewnij się, że kontekst nie sugeruje, że to podatek zwrócony 
            if (!item.context.match(/\b(refund|refunded|return)\b/i)) {
                detectedTax = item.value;
                taxConfidence = item.context.match(/\b(total|tax|vat|collected)\b/i) ? 'high' : 'medium';
                console.log(`Wykryto Tax (${taxConfidence}): ${item.value}, kontekst: "${item.context.trim()}"`);
            }
        }
    }
}

/**
 * Ekstrahuje wartości finansowe z określonej sekcji tekstu
 * @param {string} sectionText - Tekst sekcji (np. Totals, Summaries)
 * @param {Object} financialData - Obiekt na dane finansowe
 * @param {boolean} incomeFound - Czy znaleziono już Income
 * @param {boolean} expensesFound - Czy znaleziono już Expenses
 * @param {boolean} taxFound - Czy znaleziono już Tax
 */
function extractValuesFromSection(sectionText, financialData, incomeFound, expensesFound, taxFound) {
    // Szukaj wartości w sekcji
    const lines = sectionText.split('\n');
    
    for (const line of lines) {
        // Poszukiwanie wartości w liniach
        if (!incomeFound && line.match(/income|revenue|sales/i)) {
            const numbers = extractNumbersFromText(line);
            const largestNumber = findLargestNumber(numbers);
            if (largestNumber > 0) {
                financialData.Income = largestNumber;
                incomeFound = true;
                console.log(`Znaleziono Income w sekcji: ${largestNumber}, linia: ${line.trim()}`);
            }
        }
        
        if (!expensesFound && line.match(/expenses|costs|fees/i)) {
            const numbers = extractNumbersFromText(line);
            const smallestNumber = findSmallestNumber(numbers);
            if (smallestNumber < 0) {
                financialData.Expenses = smallestNumber;
                expensesFound = true;
                console.log(`Znaleziono Expenses w sekcji: ${smallestNumber}, linia: ${line.trim()}`);
            } else if (numbers.length > 0) {
                // Wydatki mogą być zapisane jako liczba dodatnia
                const largestNumber = findLargestNumber(numbers);
                if (largestNumber > 0) {
                    financialData.Expenses = -largestNumber;
                    expensesFound = true;
                    console.log(`Znaleziono Expenses (dodatnie) w sekcji: ${-largestNumber}, linia: ${line.trim()}`);
                }
            }
        }
        
        if (!taxFound && line.match(/tax|vat/i)) {
            const numbers = extractNumbersFromText(line);
            const largestNumber = findLargestNumber(numbers);
            if (largestNumber > 0) {
                financialData.Tax = largestNumber;
                taxFound = true;
                console.log(`Znaleziono Tax w sekcji: ${largestNumber}, linia: ${line.trim()}`);
            }
        }
    }
}

/**
 * Ekstrahuje liczby z tekstu
 * @param {string} text - Tekst do analizy
 * @returns {Array} - Tablica znalezionych liczb
 */
function extractNumbersFromText(text) {
    const result = [];
    const numberPattern = /([+-]?\d{1,3}(,\d{3})*(\.\d{1,2})?)/g;
    let match;
    
    while ((match = numberPattern.exec(text)) !== null) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(value)) {
            result.push(value);
        }
    }
    
    return result;
}

/**
 * Znajduje największą liczbę w tablicy
 * @param {Array} numbers - Tablica liczb
 * @returns {number} - Największa liczba lub 0 jeśli tablica jest pusta
 */
function findLargestNumber(numbers) {
    if (numbers.length === 0) {
        return 0;
    }
    return Math.max(...numbers);
}

/**
 * Znajduje najmniejszą liczbę w tablicy
 * @param {Array} numbers - Tablica liczb
 * @returns {number} - Najmniejsza liczba lub 0 jeśli tablica jest pusta
 */
function findSmallestNumber(numbers) {
    if (numbers.length === 0) {
        return 0;
    }
    return Math.min(...numbers);
}

/**
 * Waliduje dane finansowe
 * @param {Object} data - Obiekt z danymi finansowymi
 * @returns {Object} - Zwalidowany obiekt z danymi
 */
function validateFinancialData(data) {
    // Przykładowe reguły walidacji:
    // 1. Income powinien być dodatni
    if (data.Income < 0) {
        console.warn("Wykryto ujemny Income, może to być błąd");
        data.Income = Math.abs(data.Income);
    }
    
    // 2. Expenses powinny być ujemne
    if (data.Expenses > 0) {
        data.Expenses = -Math.abs(data.Expenses);
        console.log("Skorygowano Expenses na wartość ujemną");
    }
    
    // 3. Tax zazwyczaj nie powinien być większy niż 25% Income
    if (data.Tax > data.Income * 0.25) {
        console.warn("Podejrzanie wysoka wartość Tax w stosunku do Income");
    }
    
    return data;
}

/**
 * Ekstrahuje wartości dla Amazon UK z tekstu dokumentu
 * @param {string} fullText - Pełny tekst dokumentu
 * @param {Object} financialData - Obiekt na dane finansowe
 */
async function extractAmazonUkValues(fullText, financialData) {
    // Metoda dla Amazon UK - szukaj wartości w konkretnych sekcjach
    
    // 1. Szukaj w sekcji Summaries
    const summariesSection = fullText.match(/Summaries[\s\S]*?Transfers/i);
    if (summariesSection) {
        const summariesText = summariesSection[0];
        console.log('Znaleziono sekcję Summaries dla Amazon UK');
        
        // Przeszukaj sekcję Summaries dla wartości Income
        const incomeMatch = summariesText.match(/Income\s*[\s\S]*?(\d{1,3}(,\d{3})*\.\d{2})/i);
        if (incomeMatch) {
            const value = parseFloat(incomeMatch[1].replace(/,/g, ''));
            if (!isNaN(value) && value > 0) {
                financialData.Income = value;
                console.log('Znaleziono Income w Summaries:', value);
            }
        }
        
        // Przeszukaj sekcję Summaries dla wartości Expenses
        const expensesMatch = summariesText.match(/Expenses\s*[\s\S]*?(-\d{1,3}(,\d{3})*\.\d{2})/i);
        if (expensesMatch) {
            const value = parseFloat(expensesMatch[1].replace(/,/g, ''));
            if (!isNaN(value) && value < 0) {
                financialData.Expenses = value;
                console.log('Znaleziono Expenses w Summaries:', value);
            }
        } else {
            // Expenses mogą być podane bez znaku minus
            const expensesPositiveMatch = summariesText.match(/Expenses\s*[\s\S]*?(\d{1,3}(,\d{3})*\.\d{2})/i);
            if (expensesPositiveMatch) {
                const value = parseFloat(expensesPositiveMatch[1].replace(/,/g, ''));
                if (!isNaN(value) && value > 0) {
                    financialData.Expenses = -value;
                    console.log('Znaleziono Expenses (dodatnie) w Summaries:', -value);
                }
            }
        }
        
        // Przeszukaj sekcję Summaries dla wartości Tax
        const taxMatch = summariesText.match(/Tax\s*[\s\S]*?(\d{1,3}(,\d{3})*\.\d{2})/i);
        if (taxMatch) {
            const value = parseFloat(taxMatch[1].replace(/,/g, ''));
            if (!isNaN(value) && value > 0) {
                financialData.Tax = value;
                console.log('Znaleziono Tax w Summaries:', value);
            }
        }
    }
    
    // 2. Jeśli nie znaleziono w Summaries, sprawdź tabelę Totals
    if (financialData.Income === 0 || financialData.Expenses === 0 || financialData.Tax === 0) {
        const totalsSection = fullText.match(/Totals[\s\S]{0,1000}/i);
        if (totalsSection) {
            const totalsText = totalsSection[0];
            console.log('Znaleziono sekcję Totals dla Amazon UK');
            
            // Analizuj linie w sekcji Totals
            const lines = totalsText.split('\n');
            
            for (const line of lines) {
                // Szukaj wartości dla Income, Expenses i Tax
                if (financialData.Income === 0 && line.match(/income/i)) {
                    const values = extractNumbersFromText(line);
                    if (values.length > 0) {
                        const maxValue = Math.max(...values);
                        if (maxValue > 0) {
                            financialData.Income = maxValue;
                            console.log('Znaleziono Income w Totals:', maxValue);
                        }
                    }
                }
                
                if (financialData.Expenses === 0 && line.match(/expenses/i)) {
                    const values = extractNumbersFromText(line);
                    if (values.length > 0) {
                        // Szukaj wartości ujemnej jako pierwszej opcji
                        const negativeValues = values.filter(v => v < 0);
                        if (negativeValues.length > 0) {
                            const minValue = Math.min(...negativeValues);
                            financialData.Expenses = minValue;
                            console.log('Znaleziono Expenses w Totals:', minValue);
                        } else {
                            // Jeśli nie ma wartości ujemnych, użyj dodatniej i zamień na ujemną
                            const maxValue = Math.max(...values);
                            financialData.Expenses = -maxValue;
                            console.log('Znaleziono Expenses (dodatnie) w Totals:', -maxValue);
                        }
                    }
                }
                
                if (financialData.Tax === 0 && line.match(/tax/i)) {
                    const values = extractNumbersFromText(line);
                    if (values.length > 0) {
                        const maxValue = Math.max(...values);
                        if (maxValue > 0) {
                            financialData.Tax = maxValue;
                            console.log('Znaleziono Tax w Totals:', maxValue);
                        }
                    }
                }
            }
        }
    }
    
    // 3. Ostatnia szansa: przeglądaj cały dokument linia po linii
    if (financialData.Income === 0 || financialData.Expenses === 0 || financialData.Tax === 0) {
        console.log('Przeszukiwanie całego dokumentu dla Amazon UK');
        
        const lines = fullText.split('\n');
        
        for (const line of lines) {
            if (financialData.Income === 0 && (
                line.match(/income\s+[\d,.]+/i) || 
                line.match(/sales, credits, and refunds\s+[\d,.]+/i)
            )) {
                const values = extractNumbersFromText(line);
                if (values.length > 0) {
                    const maxValue = Math.max(...values);
                    if (maxValue > 0) {
                        financialData.Income = maxValue;
                        console.log('Znaleziono Income w dokumencie:', maxValue);
                    }
                }
            }
            
            if (financialData.Expenses === 0 && (
                line.match(/expenses\s+[\d,.]+/i) || 
                line.match(/fees, including\s+[\d,.]+/i)
            )) {
                const values = extractNumbersFromText(line);
                if (values.length > 0) {
                    // Szukaj wartości ujemnej jako pierwszej opcji
                    const negativeValues = values.filter(v => v < 0);
                    if (negativeValues.length > 0) {
                        const minValue = Math.min(...negativeValues);
                        financialData.Expenses = minValue;
                        console.log('Znaleziono Expenses w dokumencie:', minValue);
                    } else {
                        // Jeśli nie ma wartości ujemnych, użyj dodatniej i zamień na ujemną
                        const maxValue = Math.max(...values);
                        financialData.Expenses = -maxValue;
                        console.log('Znaleziono Expenses (dodatnie) w dokumencie:', -maxValue);
                    }
                }
            }
            
            if (financialData.Tax === 0 && (
                line.match(/tax\s+[\d,.]+/i) || 
                line.match(/net taxes collected\s+[\d,.]+/i)
            )) {
                const values = extractNumbersFromText(line);
                if (values.length > 0) {
                    const maxValue = Math.max(...values);
                    if (maxValue > 0) {
                        financialData.Tax = maxValue;
                        console.log('Znaleziono Tax w dokumencie:', maxValue);
                    }
                }
            }
        }
    }
    
    // Po wszystkich metodach walidujemy dane
    validateFinancialData(financialData);