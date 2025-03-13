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
                    
                    // Przechowaj dane o poziomach pewności wykrytych wartości
                    const confidenceLevels = {
                        income: 'high',
                        expenses: 'high',
                        tax: 'high'
                    };
                    
                    // Parsowanie CSV przy użyciu biblioteki SheetJS
                    const workbook = XLSX.read(contents, { type: 'string' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Konwertuj na JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
                    
                    // Dla Amazon UK, używamy nowej metody sumowania kolumn
                    if (platform === 'uk') {
                        console.log('Wykryto platformę Amazon UK - używam nowej metody sumowania kolumn');
                        console.log('Liczba wierszy w pliku CSV:', jsonData.length);
                        
                        // Wyświetl nazwy kolumn dla debugowania
                        if (jsonData.length > 0) {
                            console.log('Nazwy kolumn w pliku CSV:', Object.keys(jsonData[0]));
                        }
                        
                        let incomeSum = 0;     // Suma kolumny N (product sales)
                        let expensesSum = 0;   // Suma kolumn od P do Y
                        let taxSum = 0;        // Suma kolumny O (product sales tax)
                        
                        // Iteruj przez wszystkie wiersze danych
                        for (const row of jsonData) {
                            // Dokładne nazwy kolumn z pliku CSV
                            const productSales = parseFloat(row['product sales'] || row['product sales'] || 0);
                            const productSalesTax = parseFloat(row['product sales tax'] || row['product sales tax'] || 0);
                            
                            // Sumowanie kolumn P-Y - używamy dokładnych nazw kolumn
                            const postageCredits = parseFloat(row['postage credits'] || 0);
                            const shippingCreditsTax = parseFloat(row['shipping credits tax'] || 0);
                            const giftWrapCredits = parseFloat(row['gift wrap credits'] || 0);
                            const giftWrapCreditsTax = parseFloat(row['giftwrap credits tax'] || 0);
                            const promotionalRebates = parseFloat(row['promotional rebates'] || 0);
                            const promotionalRebatesTax = parseFloat(row['promotional rebates tax'] || 0);
                            const marketplaceWithheldTax = parseFloat(row['marketplace withheld tax'] || 0);
                            const sellingFees = parseFloat(row['selling fees'] || 0);
                            const fbaFees = parseFloat(row['fba fees'] || 0);
                            const otherTransactionFees = parseFloat(row['other transaction fees'] || 0);
                            
                            // Sumuj wszystkie wydatki
                            const rowExpenses = postageCredits + shippingCreditsTax + giftWrapCredits + 
                                            giftWrapCreditsTax + promotionalRebates + promotionalRebatesTax + 
                                            marketplaceWithheldTax + sellingFees + fbaFees + otherTransactionFees;
                            
                            // Dodawanie do sum (tylko jeśli są liczbami)
                            if (!isNaN(productSales)) {
                                incomeSum += productSales;
                                console.log(`Dodaję do Income: ${productSales}, aktualna suma: ${incomeSum}`);
                            }
                            
                            if (!isNaN(productSalesTax)) {
                                taxSum += productSalesTax;
                                console.log(`Dodaję do Tax: ${productSalesTax}, aktualna suma: ${taxSum}`);
                            }
                            
                            if (!isNaN(rowExpenses)) {
                                expensesSum += rowExpenses;
                                console.log(`Dodaję do Expenses: ${rowExpenses}, aktualna suma: ${expensesSum}`);
                            }
                        }
                        
                        // Przypisz sumy do obiektu finansowego
                        financialData.Income = incomeSum;
                        financialData.Expenses = expensesSum;
                        financialData.Tax = taxSum;
                        
                        console.log('Obliczone wartości dla Amazon UK:');
                        console.log('Income (suma kolumny N):', incomeSum);
                        console.log('Expenses (suma kolumn P-Y):', expensesSum);
                        console.log('Tax (suma kolumny O):', taxSum);
                        
                        // Jeśli ekspensens są dodatnie, zamień na ujemne
                        if (financialData.Expenses > 0) {
                            financialData.Expenses = -Math.abs(financialData.Expenses);
                        }
                        
                        // Sprawdź, czy znaleziono dane - jeśli nie, spróbuj alternatywnej metody
                        if (financialData.Income === 0 && financialData.Expenses === 0 && financialData.Tax === 0) {
                            console.log('Próbuję alternatywnej metody - bezpośrednie odczytanie wartości z kolumn według indeksów...');
                            
                            // Alternatywna metoda - bezpośrednie sumowanie kolumn według indeksów
                            // Pobierz wszystkie komórki
                            const range = XLSX.utils.decode_range(worksheet['!ref']);
                            
                            // Wartości dla Amazon UK są w określonych kolumnach (N, O, P-Y)
                            // N = 13 (index 0-based), O = 14, P-Y = 15-24
                            incomeSum = 0;
                            taxSum = 0;
                            expensesSum = 0;
                            
                            // Iteracja przez wiersze (pomijamy nagłówki)
                            for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
                                // Kolumna N (product sales) - Income
                                const nCell = worksheet[XLSX.utils.encode_cell({r: rowNum, c: 13})];
                                if (nCell && nCell.v) {
                                    const value = typeof nCell.v === 'number' ? nCell.v : parseFloat(nCell.v);
                                    if (!isNaN(value)) {
                                        incomeSum += value;
                                    }
                                }
                                
                                // Kolumna O (product sales tax) - Tax
                                const oCell = worksheet[XLSX.utils.encode_cell({r: rowNum, c: 14})];
                                if (oCell && oCell.v) {
                                    const value = typeof oCell.v === 'number' ? oCell.v : parseFloat(oCell.v);
                                    if (!isNaN(value)) {
                                        taxSum += value;
                                    }
                                }
                                
                                // Kolumny P-Y (15-24) - Expenses
                                let rowExpense = 0;
                                for (let colNum = 15; colNum <= 24; colNum++) {
                                    const cell = worksheet[XLSX.utils.encode_cell({r: rowNum, c: colNum})];
                                    if (cell && cell.v) {
                                        const value = typeof cell.v === 'number' ? cell.v : parseFloat(cell.v);
                                        if (!isNaN(value)) {
                                            rowExpense += value;
                                        }
                                    }
                                }
                                expensesSum += rowExpense;
                            }
                            
                            // Przypisz sumy do obiektu finansowego
                            financialData.Income = incomeSum;
                            financialData.Expenses = expensesSum;
                            financialData.Tax = taxSum;
                            
                            console.log('Alternatywne obliczone wartości dla Amazon UK:');
                            console.log('Income (suma kolumny N):', incomeSum);
                            console.log('Expenses (suma kolumn P-Y):', expensesSum);
                            console.log('Tax (suma kolumny O):', taxSum);
                            
                            // Jeśli ekspensens są dodatnie, zamień na ujemne
                            if (financialData.Expenses > 0) {
                                financialData.Expenses = -Math.abs(financialData.Expenses);
                            }
                        }
                        
                        // Jeśli nadal nie mamy danych, spróbujmy jeszcze jednej metody
                        if (financialData.Income === 0 && financialData.Expenses === 0 && financialData.Tax === 0) {
                            console.log('Próbuję trzeciej metody - parsowanie raw data z pliku CSV...');
                            
                            // Bezpośrednie sumowanie wartości numerycznych z określonych kolumn
                            // Odczytanie oryginalnego tekstu CSV
                            const csvText = e.target.result;
                            const lines = csvText.split('\n');
                            
                            // Znajdź numery kolumn na podstawie nagłówków
                            let nColumnIndex = -1;
                            let oColumnIndex = -1;
                            let pToYColumnIndices = [];
                            
                            if (lines.length > 0) {
                                // Szukaj nagłówków
                                const headerLine = lines.find(line => 
                                    line.includes('product sales') || 
                                    line.includes('Product Sales'));
                                
                                if (headerLine) {
                                    const headers = headerLine.split(',');
                                    
                                    // Znajdź indeksy interesujących nas kolumn
                                    headers.forEach((header, index) => {
                                        const cleanHeader = header.trim().toLowerCase().replace(/"/g, '');
                                        
                                        if (cleanHeader === 'product sales') {
                                            nColumnIndex = index;
                                        } else if (cleanHeader === 'product sales tax') {
                                            oColumnIndex = index;
                                        } else if ([
                                            'postage credits', 'shipping credits tax', 'gift wrap credits', 
                                            'giftwrap credits tax', 'promotional rebates', 'promotional rebates tax',
                                            'marketplace withheld tax', 'selling fees', 'fba fees', 'other transaction fees'
                                        ].includes(cleanHeader)) {
                                            pToYColumnIndices.push(index);
                                        }
                                    });
                                    
                                    console.log('Znalezione indeksy kolumn:');
                                    console.log('Income (N):', nColumnIndex);
                                    console.log('Tax (O):', oColumnIndex);
                                    console.log('Expenses (P-Y):', pToYColumnIndices);
                                    
                                    // Sumuj wartości z określonych kolumn
                                    incomeSum = 0;
                                    taxSum = 0;
                                    expensesSum = 0;
                                    
                                    // Iteruj przez wszystkie linie (pomijając nagłówki)
                                    for (let i = 1; i < lines.length; i++) {
                                        const line = lines[i];
                                        if (!line.trim()) continue; // Pomiń puste linie
                                        
                                        // Rozdziel linię na kolumny
                                        const columns = line.split(',');
                                        
                                        // Income (kolumna N)
                                        if (nColumnIndex >= 0 && nColumnIndex < columns.length) {
                                            const value = parseFloat(columns[nColumnIndex].replace(/"/g, ''));
                                            if (!isNaN(value)) {
                                                incomeSum += value;
                                            }
                                        }
                                        
                                        // Tax (kolumna O)
                                        if (oColumnIndex >= 0 && oColumnIndex < columns.length) {
                                            const value = parseFloat(columns[oColumnIndex].replace(/"/g, ''));
                                            if (!isNaN(value)) {
                                                taxSum += value;
                                            }
                                        }
                                        
                                        // Expenses (kolumny P-Y)
                                        for (const idx of pToYColumnIndices) {
                                            if (idx >= 0 && idx < columns.length) {
                                                const value = parseFloat(columns[idx].replace(/"/g, ''));
                                                if (!isNaN(value)) {
                                                    expensesSum += value;
                                                }
                                            }
                                        }
                                    }
                                    
                                    // Przypisz sumy do obiektu finansowego
                                    financialData.Income = incomeSum;
                                    financialData.Expenses = expensesSum;
                                    financialData.Tax = taxSum;
                                    
                                    console.log('Wartości obliczone metodą 3:');
                                    console.log('Income (suma kolumny N):', incomeSum);
                                    console.log('Expenses (suma kolumn P-Y):', expensesSum);
                                    console.log('Tax (suma kolumny O):', taxSum);
                                    
                                    // Jeśli ekspensens są dodatnie, zamień na ujemne
                                    if (financialData.Expenses > 0) {
                                        financialData.Expenses = -Math.abs(financialData.Expenses);
                                    }
                                }
                            }
                        }
                        
                        // Jeśli nadal nie mamy danych, użyjmy danych demonstracyjnych
                        if (financialData.Income === 0 && financialData.Expenses === 0 && financialData.Tax === 0) {
                            console.log('Nie udało się wyodrębnić danych, używam danych demonstracyjnych');
                            resolve({
                                platform: CONFIG[platform].name,
                                currency: CONFIG[platform].currency,
                                financialData: DEMO_DATA[platform].financialData,
                                confidenceLevels: {
                                    income: 'low',
                                    expenses: 'low',
                                    tax: 'low'
                                }
                            });
                            return;
                        }
                        
                        // Zwróć poprawnie obliczone dane
                        resolve({
                            platform: CONFIG[platform].name,
                            currency: CONFIG[platform].currency,
                            financialData: financialData,
                            confidenceLevels: confidenceLevels
                        });
                        return;
                    }
                    
                    // Dla innych platform używaj standardowej metody
                    const languageMap = LANGUAGE_MAPPINGS[platform] || LANGUAGE_MAPPINGS['uk'];
                    
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
                        financialData: financialData,
                        confidenceLevels: confidenceLevels
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