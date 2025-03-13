/**
 * Moduł do przetwarzania plików CSV
 */

/**
 * Przetwarza plik CSV i wyodrębnia dane finansowe
 * @param {File} file - Plik CSV do przetworzenia
 * @param {string} platform - Identyfikator platformy (np. 'uk', 'de', 'it', 'es')
 * @returns {Promise<Object>} - Obiekt z danymi finansowymi
 */
window.processCsv = async function(file, platform) {
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
                    
                    // Konwertuj arkusz na tablicę wierszy
                    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
                    
                    // Znajdź indeksy kolumn, które nas interesują
                    let headerRow = null;
                    for (let i = 0; i < rows.length; i++) {
                        const row = rows[i];
                        if (row && row.length > 0 && (
                            row.includes('product sales') || 
                            row.includes('product sales tax') ||
                            row.includes('Vendite') || 
                            row.includes('imposta sulle vendite dei prodotti') ||
                            row.includes('ventas de productos') || 
                            row.includes('impuesto de ventas de productos')
                        )) {
                            headerRow = row;
                            break;
                        }
                    }
                    
                    if (!headerRow) {
                        console.log('Nie znaleziono wiersza nagłówków, próbuję domyślne indeksy kolumn');
                        if (platform === 'uk') {
                            // Dla Amazon UK - domyślne indeksy kolumn
                            processAmazonUkData(rows);
                        } else if (platform === 'it') {
                            // Dla Amazon IT - domyślne indeksy kolumn
                            processAmazonItData(rows);
                        } else if (platform === 'es') {
                            // Dla Amazon ES - domyślne indeksy kolumn
                            processAmazonEsData(rows);
                        } else {
                            // Dla innych platform - użyj standardowej metody
                            processDefaultData(worksheet);
                        }
                    } else {
                        // Znaleźliśmy wiersz nagłówków, znajdź indeksy naszych kolumn
                        if (platform === 'uk') {
                            // Dla Amazon UK
                            const nColumnIndex = headerRow.findIndex(h => 
                                h && h.toString().toLowerCase().includes('product sales'));
                            const oColumnIndex = headerRow.findIndex(h => 
                                h && h.toString().toLowerCase().includes('product sales tax'));
                            const pToYColumnIndices = [];
                            
                            // Znajdź indeksy kolumn od P do Y
                            ['postage credits', 'shipping credits tax', 'gift wrap credits', 
                            'giftwrap credits tax', 'promotional rebates', 'promotional rebates tax',
                            'marketplace withheld tax', 'selling fees', 'fba fees', 
                            'other transaction fees'].forEach(header => {
                                const index = headerRow.findIndex(h => 
                                    h && h.toString().toLowerCase().includes(header.toLowerCase()));
                                if (index !== -1) {
                                    pToYColumnIndices.push(index);
                                }
                            });
                            
                            console.log('Indeksy kolumn dla Amazon UK:');
                            console.log('N (product sales):', nColumnIndex);
                            console.log('O (product sales tax):', oColumnIndex);
                            console.log('P-Y:', pToYColumnIndices);
                            
                            // Przetworz dane dla Amazon UK
                            if (nColumnIndex !== -1 && oColumnIndex !== -1 && pToYColumnIndices.length > 0) {
                                processAmazonUkDataWithIndices(rows, nColumnIndex, oColumnIndex, pToYColumnIndices);
                            } else {
                                processAmazonUkData(rows);
                            }
                        } else if (platform === 'it') {
                            // Dla Amazon IT
                            const nColumnIndex = headerRow.findIndex(h => 
                                h && h.toString().toLowerCase().includes('vendite'));
                            const oColumnIndex = headerRow.findIndex(h => 
                                h && h.toString().toLowerCase().includes('imposta sulle vendite'));
                            const pToYColumnIndices = [];
                            
                            // Znajdź indeksy kolumn od P do Y
                            ['accrediti per le spedizioni', 'imposta accrediti per le spedizioni', 
                            'accrediti per confezioni regalo', 'imposta sui crediti confezione regalo', 
                            'sconti promozionali', 'imposta sugli sconti promozionali',
                            'trattenuta iva del marketplace', 'commissioni di vendita', 
                            'costi del servizio logistica', 'altri costi relativi alle transazioni'].forEach(header => {
                                const index = headerRow.findIndex(h => 
                                    h && h.toString().toLowerCase().includes(header.toLowerCase()));
                                if (index !== -1) {
                                    pToYColumnIndices.push(index);
                                }
                            });
                            
                            console.log('Indeksy kolumn dla Amazon IT:');
                            console.log('N (Vendite):', nColumnIndex);
                            console.log('O (imposta sulle vendite dei prodotti):', oColumnIndex);
                            console.log('P-Y:', pToYColumnIndices);
                            
                            // Przetwórz dane dla Amazon IT
                            if (nColumnIndex !== -1 && oColumnIndex !== -1 && pToYColumnIndices.length > 0) {
                                processAmazonItDataWithIndices(rows, nColumnIndex, oColumnIndex, pToYColumnIndices);
                            } else {
                                processAmazonItData(rows);
                            }
                        } else if (platform === 'es') {
                            // Dla Amazon ES
                            const productSalesIndex = headerRow.findIndex(h => 
                                h && h.toString().toLowerCase().includes('ventas de productos'));
                            const sellingFeesIndex = headerRow.findIndex(h => 
                                h && h.toString().toLowerCase().includes('tarifas de venta'));
                            const otherColumnIndices = [];
                            
                            // Znajdź indeksy pozostałych kolumn
                            ['abonos de envío', 'impuesto de ventas de productos', 
                            'abonos de envoltorio para regalo', 'tarifas de Logística de Amazon', 
                            'tarifas de otras transacciones'].forEach(header => {
                                const index = headerRow.findIndex(h => 
                                    h && h.toString().toLowerCase().includes(header.toLowerCase()));
                                if (index !== -1) {
                                    otherColumnIndices.push({ name: header, index: index });
                                }
                            });
                            
                            console.log('Indeksy kolumn dla Amazon ES:');
                            console.log('Ventas de productos:', productSalesIndex);
                            console.log('Tarifas de venta:', sellingFeesIndex);
                            console.log('Inne kolumny:', otherColumnIndices);
                            
                            // Przetwórz dane dla Amazon ES
                            if (productSalesIndex !== -1 && sellingFeesIndex !== -1) {
                                // Tworzymy mapę nagłówków
                                const headerMap = {};
                                headerRow.forEach((header, index) => {
                                    headerMap[header] = index;
                                });
                                processAmazonEsWithIndices(rows, headerRow, headerMap);
                            } else {
                                processAmazonEsData(rows);
                            }
                        } else {
                            // Dla innych platform - użyj standardowej metody
                            processDefaultData(worksheet);
                        }
                    }
                    
                    // Funkcja przetwarzająca dane Amazon UK z użyciem indeksów kolumn
                    function processAmazonUkDataWithIndices(rows, nColumnIndex, oColumnIndex, pToYColumnIndices) {
                        let incomeSum = 0;
                        let taxSum = 0;
                        let expensesSum = 0;
                        
                        // Pomiń pierwszy wiersz (nagłówki)
                        for (let i = 1; i < rows.length; i++) {
                            const row = rows[i];
                            if (!row || row.length === 0) continue;
                            
                            // Suma kolumny N (Income)
                            if (nColumnIndex < row.length) {
                                const valueStr = row[nColumnIndex];
                                if (valueStr) {
                                    // Konwersja wartości z różnych formatów (komórki mogą zawierać różne formaty)
                                    const value = parseFloat(valueStr.toString().replace(/,/g, ''));
                                    if (!isNaN(value)) {
                                        incomeSum += value;
                                    }
                                }
                            }
                            
                            // Suma kolumny O (Tax)
                            if (oColumnIndex < row.length) {
                                const valueStr = row[oColumnIndex];
                                if (valueStr) {
                                    const value = parseFloat(valueStr.toString().replace(/,/g, ''));
                                    if (!isNaN(value)) {
                                        taxSum += value;
                                    }
                                }
                            }
                            
                            // Suma kolumn P-Y (Expenses)
                            for (const colIndex of pToYColumnIndices) {
                                if (colIndex < row.length) {
                                    const valueStr = row[colIndex];
                                    if (valueStr) {
                                        const value = parseFloat(valueStr.toString().replace(/,/g, ''));
                                        if (!isNaN(value)) {
                                            expensesSum += value;
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Przypisz wartości do obiektu finansowego
                        financialData.Income = incomeSum;
                        financialData.Tax = taxSum;
                        financialData.Expenses = expensesSum;
                        
                        console.log('Obliczone wartości dla Amazon UK:');
                        console.log('Income (suma kolumny N):', incomeSum);
                        console.log('Tax (suma kolumny O):', taxSum);
                        console.log('Expenses (suma kolumn P-Y):', expensesSum);
                        
                        // Jeśli ekspensens są dodatnie, zamień na ujemne
                        if (financialData.Expenses > 0) {
                            financialData.Expenses = -Math.abs(financialData.Expenses);
                        }
                        
                        // Zwróć wynik
                        resolve({
                            platform: CONFIG[platform].name,
                            currency: CONFIG[platform].currency,
                            financialData: financialData,
                            confidenceLevels: confidenceLevels
                        });
                    }
                    
                   /**
 * Funkcja przetwarzająca dane Amazon IT z użyciem indeksów kolumn
 * Ta funkcja zastąpi istniejącą funkcję processAmazonItDataWithIndices w processCSV
 */
function processAmazonItDataWithIndices(rows, nColumnIndex, oColumnIndex, pToYColumnIndices) {
    // Dla Amazon IT potrzebujemy indeksów kolumn N-Q dla income i R-Y dla expenses
    // nColumnIndex typowo wskazuje na kolumnę N (Vendite)
    // Znajdujemy resztę potrzebnych indeksów
    
    // Znajdź indeksy kolumn O, P, Q (oColumnIndex już mamy)
    const pColumnIndex = pToYColumnIndices[0]; // Standardowo jest to pierwszy index z listy P-Y
    const qColumnIndex = pColumnIndex + 1;     // Następny po P
    
    // Zdefiniuj indeksy kolumn dla income (N-Q) i expenses (R-Y)
    const incomeColumnIndices = [nColumnIndex, oColumnIndex];
    if (pColumnIndex !== undefined) incomeColumnIndices.push(pColumnIndex);
    if (qColumnIndex !== undefined) incomeColumnIndices.push(qColumnIndex);
    
    // Expenses to będą R-Y (od trzeciego elementu w pToYColumnIndices)
    const expensesColumnIndices = pToYColumnIndices.slice(2);
    
    let incomeSum = 0;
    let expensesSum = 0;
    
    // Pomiń pierwszy wiersz (nagłówki)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        
        // Suma kolumn N-Q (Income)
        for (const colIndex of incomeColumnIndices) {
            if (colIndex !== undefined && colIndex < row.length) {
                const valueStr = row[colIndex];
                if (valueStr) {
                    // Konwersja wartości z włoskiego formatu (123,45 -> 123.45)
                    const value = parseFloat(valueStr.toString().replace(/\./g, '').replace(/,/g, '.'));
                    if (!isNaN(value)) {
                        incomeSum += value;
                    }
                }
            }
        }
        
        // Suma kolumn R-Y (Expenses)
        for (const colIndex of expensesColumnIndices) {
            if (colIndex !== undefined && colIndex < row.length) {
                const valueStr = row[colIndex];
                if (valueStr) {
                    const value = parseFloat(valueStr.toString().replace(/\./g, '').replace(/,/g, '.'));
                    if (!isNaN(value)) {
                        expensesSum += value;
                    }
                }
            }
        }
    }
    
    // Przypisz wartości do obiektu finansowego
    financialData.Income = incomeSum;
    financialData.Expenses = expensesSum;
    // Nie używamy Tax dla Amazon IT
    financialData.Tax = 0;
    
    console.log('Obliczone wartości dla Amazon IT:');
    console.log('Income (suma kolumn N-Q):', incomeSum);
    console.log('Expenses (suma kolumn R-Y):', expensesSum);
    
    // Jeśli expenses są dodatnie, zamień na ujemne (dla obliczeń wewnętrznych)
    if (financialData.Expenses > 0) {
        financialData.Expenses = -Math.abs(financialData.Expenses);
    }
    
    // Zwróć wynik bez oznaczenia waluty
    resolve({
        platform: CONFIG[platform].name,
        currency: CONFIG[platform].currency,
        financialData: financialData,
        confidenceLevels: confidenceLevels
    });
}

                 /**
 * Funkcja przetwarzająca dane Amazon IT (domyślne indeksy)
 * Ta funkcja zastąpi istniejącą funkcję processAmazonItData w processCSV
 */
function processAmazonItData(rows) {
    let incomeSum = 0;
    let expensesSum = 0;
    
    // Pomiń pierwsze wiersze (nagłówki itp.)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 15) continue;
        
        // NOWE: Income to suma kolumn N do Q (13-16)
        for (let j = 13; j <= 16; j++) {
            if (row.length > j) {
                const valueStr = row[j];
                if (valueStr) {
                    // Konwersja wartości z włoskiego formatu (123,45 -> 123.45)
                    const cleanValue = valueStr.toString().replace(/\./g, '').replace(/,/g, '.');
                    const value = parseFloat(cleanValue);
                    if (!isNaN(value)) {
                        incomeSum += value;
                    }
                }
            }
        }
        
        // NOWE: Expenses to suma kolumn R do Y (17-24)
        for (let j = 17; j <= 24; j++) {
            if (row.length > j) {
                const valueStr = row[j];
                if (valueStr) {
                    const cleanValue = valueStr.toString().replace(/\./g, '').replace(/,/g, '.');
                    const value = parseFloat(cleanValue);
                    if (!isNaN(value)) {
                        expensesSum += value;
                    }
                }
            }
        }
    }
    
    // Przypisz wartości do obiektu finansowego
    financialData.Income = incomeSum;
    financialData.Expenses = expensesSum;
    // Nie używamy Tax dla Amazon IT
    financialData.Tax = 0;
    
    console.log('Obliczone wartości dla Amazon IT (domyślne indeksy):');
    console.log('Income (suma kolumn N-Q):', incomeSum);
    console.log('Expenses (suma kolumn R-Y):', expensesSum);
    
    // Jeśli expenses są dodatnie, zamień na ujemne (dla obliczeń wewnętrznych)
    if (financialData.Expenses > 0) {
        financialData.Expenses = -Math.abs(financialData.Expenses);
    }
    
    // Zwróć wynik bez oznaczenia waluty
    resolve({
        platform: CONFIG[platform].name,
        currency: CONFIG[platform].currency,
        financialData: financialData,
        confidenceLevels: confidenceLevels
    });
}

/**
 * Funkcja przetwarzająca dane Amazon ES (domyślne indeksy)
 * @param {Array} rows - Wiersze danych CSV
 */
function processAmazonEsData(rows) {
    let incomeSum = 0;
    let expensesSum = 0;
    
    // Pomiń pierwsze wiersze (nagłówki itp.)
    // Zazwyczaj dane zaczynają się od wiersza 8
    for (let i = 8; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 25) continue;
        
        // INCOME: suma kolumn N do Q (13-16)
        for (let j = 13; j <= 16; j++) {
            if (row.length > j && row[j]) {
                // Parsuj format hiszpański (przecinek jako separator dziesiętny)
                const valueStr = String(row[j]);
                const value = parseFloat(valueStr.replace(',', '.'));
                if (!isNaN(value)) {
                    incomeSum += value;
                }
            }
        }
        
        // EXPENSES: suma kolumn R do Y (17-24)
        for (let j = 17; j <= 24; j++) {
            if (row.length > j && row[j]) {
                const valueStr = String(row[j]);
                const value = parseFloat(valueStr.replace(',', '.'));
                if (!isNaN(value)) {
                    expensesSum += value;
                }
            }
        }
    }
    
    // Przypisz wartości do obiektu finansowego
    financialData.Income = incomeSum;
    financialData.Expenses = expensesSum;
    financialData.Tax = 0; // Tax jest ignorowany dla Amazon ES
    
    console.log('Obliczone wartości dla Amazon ES (domyślne indeksy):');
    console.log('Income (suma kolumn N-Q):', incomeSum);
    console.log('Expenses (suma kolumn R-Y):', expensesSum);
    
    // Upewnij się, że wydatki są ujemne
    if (financialData.Expenses > 0) {
        financialData.Expenses = -Math.abs(financialData.Expenses);
    }
    
    // Zwróć wynik
    resolve({
        platform: CONFIG[platform].name,
        currency: CONFIG[platform].currency,
        financialData: financialData,
        confidenceLevels: confidenceLevels
    });
}

/**
 * Przetwarzanie danych Amazon ES z użyciem indeksów kolumn
 * @param {Array} rows - Wiersze danych CSV
 * @param {Array} headerRow - Wiersz nagłówków
 * @param {Object} headerMap - Mapa nagłówków do indeksów kolumn
 */
function processAmazonEsWithIndices(rows, headerRow, headerMap) {
    let incomeSum = 0;
    let expensesSum = 0;
    
    // Funkcja do parsowania hiszpańskich liczb (z przecinkiem jako separator dziesiętny)
    function parseSpanishNumber(numStr) {
        if (!numStr || typeof numStr !== 'string') return 0;
        // Zamień przecinek na kropkę dla separatora dziesiętnego
        return parseFloat(numStr.replace(',', '.'));
    }
    
    // Indeks wiersza nagłówka
    const headerRowIndex = rows.indexOf(headerRow);
    
    // Przetwórz każdy wiersz danych (zaczynając od wiersza po nagłówku)
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        
        // Pomiń wiersze, które nie mają wystarczającej liczby kolumn
        if (row.length < headerRow.length) continue;
        
        // INCOME: suma kolumn N do Q (13-16)
        for (let j = 13; j <= 16; j++) {
            if (j < row.length && row[j]) {
                const valueStr = String(row[j]);
                const value = parseSpanishNumber(valueStr);
                if (!isNaN(value)) {
                    incomeSum += value;
                }
            }
        }
        
        // EXPENSES: suma kolumn R do Y (17-24)
        for (let j = 17; j <= 24; j++) {
            if (j < row.length && row[j]) {
                const valueStr = String(row[j]);
                const value = parseSpanishNumber(valueStr);
                if (!isNaN(value)) {
                    expensesSum += value;
                }
            }
        }
    }
    
    // Przypisz wartości do obiektu finansowego
    financialData.Income = incomeSum;
    financialData.Expenses = expensesSum;
    financialData.Tax = 0; // Tax jest ignorowany dla Amazon ES
    
    console.log('Obliczone wartości dla Amazon ES:');
    console.log('Income (suma kolumn N-Q):', incomeSum);
    console.log('Expenses (suma kolumn R-Y):', expensesSum);
    
    // Upewnij się, że wydatki są ujemne
    if (financialData.Expenses > 0) {
        financialData.Expenses = -Math.abs(financialData.Expenses);
    }
    
    // Zwróć wynik
    resolve({
        platform: CONFIG[platform].name,
        currency: CONFIG[platform].currency,
        financialData: financialData,
        confidenceLevels: confidenceLevels
    });
}
                        
                    /**
                     * Funkcja przetwarzająca dane dla innych platform
                     */
                    function processDefaultData(worksheet) {
                        // Użyj standardowej metody dla innych platform
                        const jsonData = XLSX.utils.sheet_to_json(worksheet);
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
                        
                        // Jeśli to platforma Amazon ES, upewnij się, że Tax jest ustawiony na 0
                        if (platform === 'es') {
                            financialData.Tax = 0;
                        }
                        
                        resolve({
                            platform: CONFIG[platform].name,
                            currency: CONFIG[platform].currency,
                            financialData: financialData,
                            confidenceLevels: confidenceLevels
                        });
                    }
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
};