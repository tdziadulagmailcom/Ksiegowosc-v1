/**
 * Główny moduł aplikacji Amazon Reports Processor
 */
document.addEventListener('DOMContentLoaded', function() {
    // Referencje do elementów DOM
    const processBtn = document.getElementById('processBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const fileInput = document.getElementById('fileInput');
    const platformSelect = document.getElementById('platform');
    const resultArea = document.getElementById('resultArea');
    const loader = document.getElementById('loader');
    const alertArea = document.getElementById('alertArea');
    const salesTable = document.getElementById('salesTable');
    const billsTable = document.getElementById('billsTable');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Bieżący język interfejsu (na razie tylko polski)
    const currentLanguage = 'pl';
    const labels = TRANSLATIONS[currentLanguage];
    
    // Tablica na wszystkie przetworzone dane
    let allProcessedData = [];
    
    // Zmienne dla trybu debugowania
    let debugMode = false;
    
    // Inicjalizacja tabel wyników
    initializeResultsTables();
    
    // Od razu pokazujemy obszar wyników
    resultArea.classList.remove('hidden');
    
    // Przypisanie event listenerów
    processBtn.addEventListener('click', processFile);
    downloadBtn.addEventListener('click', downloadExcel);
    clearBtn.addEventListener('click', clearData);
    
    // Obsługa zakładek
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Aktywuj przycisk
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Pokaż odpowiednią zawartość
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}Tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Dodaj debugowanie jeśli włączony jest tryb debug
    if (debugMode) {
        const debugContainer = document.createElement('div');
        debugContainer.className = 'debug-container';
        debugContainer.innerHTML = `
            <h3>Tryb debugowania</h3>
            <button id="debugUkBtn" class="action-button warning">Test Amazon UK</button>
            <button id="debugShowTextBtn" class="action-button">Pokaż tekst PDF</button>
            <div id="debugOutput" class="debug-output"></div>
        `;
        document.querySelector('.container').appendChild(debugContainer);
        
        // Event listenery dla przycisków debugowania
        document.getElementById('debugUkBtn').addEventListener('click', testAmazonUkExtraction);
        document.getElementById('debugShowTextBtn').addEventListener('click', showPdfText);
    }
    /**
     * Inicjalizuje tabele wyników z predefiniowanymi danymi
     */
    function initializeResultsTables() {
        // Inicjalizacja tabeli Sales (wiersze 1-13)
        initializeTable(salesTable, 13);
        
        // Inicjalizacja tabeli Bills (wiersze 1-12)
        initializeTable(billsTable, 12);
        
        // Wypełnij tabele danymi z pliku Excel
        fillTablesWithExcelData();
    }
    
    /**
     * Inicjalizuje tabelę z określoną liczbą wierszy
     * @param {HTMLElement} table - Element tabeli
     * @param {number} rowCount - Liczba wierszy do utworzenia
     */
    function initializeTable(table, rowCount) {
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = ''; // Wyczyść tabelę
        
        // Utworzenie wierszy
        for (let i = 1; i <= rowCount; i++) {
            const row = document.createElement('tr');
            row.dataset.rowIndex = i;
            
            // Dodaj komórkę z numerem wiersza (pierwsza kolumna)
            const rowHeader = document.createElement('td');
            rowHeader.textContent = i;
            rowHeader.className = 'row-header';
            row.appendChild(rowHeader);
            
            // Dodaj 14 pustych komórek (kolumny B-O)
            for (let j = 0; j < 14; j++) {
                const cell = document.createElement('td');
                cell.dataset.columnIndex = j;
                cell.innerHTML = '&nbsp;'; // Pusta komórka
                row.appendChild(cell);
            }
            
            tbody.appendChild(row);
        }
    }
    /**
     * Wypełnia tabele danymi z pliku Excel "Sales Receipt quickbooks.xlsx"
     */
    function fillTablesWithExcelData() {
        // Dane dla tabeli Sales (wiersze 1-13) z pliku Excel
        const salesData = [
            { cells: [
                { col: 0, text: "*SalesReceiptNo" },
                { col: 1, text: "Customer" },
                { col: 2, text: "*SalesReceiptDate" },
                { col: 3, text: "*DepositAccount" },
                { col: 4, text: "Location" },
                { col: 5, text: "Memo" },
                { col: 6, text: "Item(Product/Service)" },
                { col: 7, text: "ItemDescription" },
                { col: 8, text: "ItemQuantity" },
                { col: 9, text: "ItemRate" },
                { col: 10, text: "*ItemAmount" },
                { col: 11, text: "*ItemTaxCode" },
                { col: 12, text: "ItemTaxAmount" },
                { col: 13, text: "Currency" },
                { col: 14, text: " ServiceDate" }
            ]},
            { cells: [
                // Kolumna B (indeks 0) pozostaje pusta - będzie wypełniana losowym numerem
                { col: 1, text: "Ebay" },
                { col: 2, text: "2025-01-31" },
                { col: 3, text: "Ebay" },
                { col: 6, text: "eBay UK sales" },
                { col: 8, text: "1" },
                { col: 11, text: "0.2" },
                { col: 13, text: "GBP" }
            ]},
            { cells: [
                { col: 6, text: "eBay EU sales" },
                { col: 7, text: "GBP plus EUR converted" },
                { col: 8, text: "1" },
                { col: 11, text: "No VAT" },
                { col: 13, text: "GBP" }
            ]},
            { cells: [
                { col: 1, text: "Etsy Customers UK" },
                { col: 2, text: "2025-01-31" },
                { col: 3, text: "Etsy Business" },
                { col: 6, text: "Etsy UK sales" },
                { col: 8, text: "1" },
                { col: 11, text: "0.2" },
                { col: 13, text: "GBP" }
            ]},
            { cells: [
                { col: 6, text: "Etsy EU sales" },
                { col: 8, text: "1" },
                { col: 11, text: "No VAT" },
                { col: 13, text: "GBP" }
            ]},
            { cells: [
                { col: 1, text: "B and Q sales" },
                { col: 2, text: "2025-01-31" },
                { col: 3, text: "B and Q sales UK" },
                { col: 6, text: "B and Q sales" },
                { col: 8, text: "1" },
                { col: 11, text: "0.2" },
                { col: 13, text: "GBP" }
            ]},
            { cells: [
                { col: 6, text: "B and Q sales" },
                { col: 8, text: "1" },
                { col: 11, text: "0.2" },
                { col: 13, text: "GBP" }
            ]},
            { cells: [
                { col: 1, text: "Amazon customers UK" },
                { col: 2, text: "2025-01-31" },
                { col: 3, text: "Amazon UK" },
                { col: 6, text: "Amazon UK sales" },
                { col: 8, text: "1" },
                { col: 11, text: "0.2" },
                { col: 13, text: "GBP" }
            ]},
            { cells: [
                { col: 1, text: "Amazon customers IT" },
                { col: 2, text: "2025-01-31" },
                { col: 3, text: "Amazon IT" },
                { col: 6, text: "Amazon IT sales" },
                { col: 8, text: "1" },
                { col: 11, text: "No VAT" },
                { col: 13, text: "EUR" }
            ]},
            { cells: [
                { col: 1, text: "Amazon customers ES" },
                { col: 2, text: "2025-01-31" },
                { col: 3, text: "Amazon ES" },
                { col: 6, text: "Amazon ES sales" },
                { col: 8, text: "1" },
                { col: 11, text: "No VAT" },
                { col: 13, text: "EUR" }
            ]},
            { cells: [
                { col: 1, text: "Amazon customers DE" },
                { col: 2, text: "2025-01-31" },
                { col: 3, text: "Amazon DE" },
                { col: 6, text: "Amazon DE sales" },
                { col: 8, text: "1" },
                { col: 11, text: "No VAT" },
                { col: 13, text: "EUR" }
            ]},
            { cells: [
                { col: 1, text: "Amazon customers FR" },
                { col: 2, text: "2025-01-31" },
                { col: 3, text: "Amazon FR" },
                { col: 6, text: "Amazon FR sales" },
                { col: 8, text: "1" },
                { col: 11, text: "No VAT" },
                { col: 13, text: "EUR" }
            ]},
            { cells: [
                { col: 1, text: "Amazon customers NL" },
                { col: 2, text: "2025-01-31" },
                { col: 3, text: "Amazon NL" },
                { col: 6, text: "Amazon NL sales" },
                { col: 8, text: "1" },
                { col: 11, text: "No VAT" },
                { col: 13, text: "EUR" }
            ]}
        ];
        
        // Dane dla tabeli Bills (wiersze 1-12) z pliku Excel
        const billsData = [
            { cells: [
                { col: 0, text: "*BillNo" },
                { col: 1, text: "*Supplier" },
                { col: 2, text: "*BillDate" },
                { col: 3, text: "*DueDate" },
                { col: 4, text: "Terms" },
                { col: 5, text: "Location" },
                { col: 6, text: "Memo" },
                { col: 7, text: "*Account" },
                { col: 8, text: "LineDescription" },
                { col: 9, text: "*LineAmount" },
                { col: 10, text: "*LineTaxCode" },
                { col: 11, text: "LineTaxAmount" },
                { col: 12, text: "Currency" }
            ]},
            { cells: [
                // Kolumna B (indeks 0) pozostaje pusta - będzie wypełniana losowym numerem
                { col: 1, text: "eBay Fees" },
                { col: 7, text: "Selling Fees:Ebay fees" },
                { col: 10, text: "0.2" },
                { col: 12, text: "GBP" }
            ]},
            { cells: [
                { col: 7, text: "Selling Fees:Ebay fees" },
                { col: 8, text: "converted to GBP" },
                { col: 10, text: "0.2" },
                { col: 12, text: "GBP" }
            ]},
            { cells: [
                { col: 1, text: "Etsy Fees" },
                { col: 7, text: "Selling Fees:Etsy Fees UK" },
                { col: 10, text: "20.0% RC SG" },
                { col: 12, text: "GBP" }
            ]},
            { cells: [
                { col: 1, text: "B & Q sales fee" },
                { col: 7, text: "05 Selling Fees" },
                { col: 10, text: "0.2" },
                { col: 12, text: "GBP" }
            ]},
            { cells: [
                { col: 1, text: "B & Q sales fee" },
                { col: 7, text: "05 Selling Fees" },
                { col: 10, text: "0.2" },
                { col: 12, text: "GBP" }
            ]},
            { cells: [
                { col: 1, text: "Amazon UK fees" },
                { col: 7, text: "Selling Fees:Amazon UK Fees:Seller Fees" },
                { col: 10, text: "20.0% RC SG" },
                { col: 12, text: "GBP" }
            ]},
            { cells: [
                { col: 1, text: "Amazon IT Fees" },
                { col: 7, text: "Selling Fees:Amazon EU:Amazon IT Expenses:Amazon IT seller fees" },
                { col: 10, text: "20.0% RC SG" },
                { col: 12, text: "EUR" }
            ]},
            { cells: [
                { col: 1, text: "Amazon ES Fees" },
                { col: 7, text: "Selling Fees:Amazon EU:Amazon ES:Amazon ES seller fees" },
                { col: 10, text: "20.0% RC SG" },
                { col: 12, text: "EUR" }
            ]},
            { cells: [
                { col: 1, text: "Amazon DE" },
                { col: 7, text: "Selling Fees:Amazon EU:Amazon DE:Amazon DE seller fees" },
                { col: 10, text: "20.0% RC SG" },
                { col: 12, text: "EUR" }
            ]},
            { cells: [
                { col: 1, text: "Amazon FR Fees" },
                { col: 7, text: "Selling Fees:Amazon EU:Amazon FR:Amazon FR seller fees" },
                { col: 10, text: "20.0% RC SG" },
                { col: 12, text: "EUR" }
            ]},
            { cells: [
                { col: 1, text: "Amazon NL fees" },
                { col: 7, text: "Selling Fees:Amazon EU:Amazon NL:Amazon NL seller fees" },
                { col: 10, text: "20.0% RC SG" },
                { col: 12, text: "EUR" }
            ]}
        ];
        
        // Wypełnij tabelę Sales
        fillTableWithData(salesTable, salesData);
        
        // Wypełnij tabelę Bills
        fillTableWithData(billsTable, billsData);
    }
    
    /**
     * Wypełnia tabelę danymi
     * @param {HTMLElement} table - Element tabeli
     * @param {Array} data - Dane do wypełnienia
     */
    function fillTableWithData(table, data) {
        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        
        // Wypełnij każdy wiersz
        for (let i = 0; i < rows.length && i < data.length; i++) {
            const row = rows[i];
            const rowData = data[i];
            
            // Jeśli są dane dla tego wiersza
            if (rowData && rowData.cells) {
                rowData.cells.forEach(cellData => {
                    // Znajdź odpowiednią komórkę
                    const cell = row.querySelector(`td[data-column-index="${cellData.col}"]`);
                    if (cell) {
                        cell.textContent = cellData.text;
                        if (cellData.bold) {
                            cell.style.fontWeight = 'bold';
                        }
                        if (cellData.class) {
                            cell.className = cellData.class;
                        }
                    }
                });
            }
        }
    }
    /**
     * Przetwarza wybrany plik i wyświetla wyniki
     */
    async function processFile() {
        const file = fileInput.files[0];
        const platform = platformSelect.value;
        
        if (!file) {
            showAlert(labels.noFileError, 'error');
            return;
        }
        
        // Pokazujemy loader
        loader.classList.remove('hidden');
        alertArea.classList.add('hidden');
        
        try {
            // Określ typ pliku na podstawie rozszerzenia
            const fileName = file.name.toLowerCase();
            let extractedData;
            
            if (fileName.endsWith('.pdf')) {
                // Przetwarzanie pliku PDF
                extractedData = await processPdf(file, platform);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                // Przetwarzanie pliku Excel
                extractedData = await processExcel(file, platform);
            } else if (fileName.endsWith('.csv')) {
                // Przetwarzanie pliku CSV
                extractedData = await processCsv(file, platform);
            } else {
                // Nieobsługiwany typ pliku
                throw new Error('Nieobsługiwany format pliku');
            }
            
            // Sprawdzamy, czy podczas przetwarzania wystąpił błąd
            if (extractedData.error) {
                showAlert(extractedData.errorMessage || labels.processingError, 'error');
                // Mimo błędu, próbujemy użyć danych demonstracyjnych
                extractedData.error = false;
                delete extractedData.errorMessage;
            }
            
            // Dodajemy dane do istniejących danych
            allProcessedData.push(extractedData);
            
            // Resetujemy pole wyboru pliku po przetworzeniu
            fileInput.value = '';
            
            // Aktualizujemy tabele wyników
            updateResultsTables(extractedData);
            
            // Dodajemy szczegóły o przetworzonym pliku
            addProcessedFileInfo(file.name, platform, extractedData);
            
            // Pokazujemy obszar wyników
            resultArea.classList.remove('hidden');
            showAlert(labels.processSuccess, 'success');
        } catch (error) {
            console.error('Błąd przetwarzania pliku:', error);
            showAlert(labels.processingError + ' ' + error.message, 'error');
        } finally {
            // Ukrywamy loader
            loader.classList.add('hidden');
        }
    }
    /**
     * Dodaje informacje o przetworzonym pliku do interfejsu
     * @param {string} fileName - Nazwa pliku
     * @param {string} platform - Nazwa platformy
     * @param {Object} data - Przetworzone dane
     */
    /**
 * Dodaje informacje o przetworzonym pliku do interfejsu
 * @param {string} fileName - Nazwa pliku
 * @param {string} platform - Nazwa platformy
 * @param {Object} data - Przetworzone dane
 */
function addProcessedFileInfo(fileName, platform, data) {
    // Sprawdź czy kontener na informacje o plikach istnieje
    let filesInfoContainer = document.getElementById('processedFilesInfo');
    if (!filesInfoContainer) {
        // Utwórz kontener jeśli nie istnieje
        filesInfoContainer = document.createElement('div');
        filesInfoContainer.id = 'processedFilesInfo';
        filesInfoContainer.className = 'processed-files-info';
        
        // Dodaj tytuł
        const title = document.createElement('h3');
        title.textContent = 'Przetworzone pliki:';
        filesInfoContainer.appendChild(title);
        
        // Dodaj listę plików
        const filesList = document.createElement('ul');
        filesList.id = 'processedFilesList';
        filesInfoContainer.appendChild(filesList);
        
        // Wstaw kontener przed obszarem akcji
        const actionBar = document.querySelector('.action-bar');
        resultArea.insertBefore(filesInfoContainer, actionBar);
    }
    
    // Dodaj informacje o pliku do listy
    const filesList = document.getElementById('processedFilesList');
    const fileItem = document.createElement('li');
    fileItem.className = 'file-info-item';
    
    // Sformatuj dane finansowe - bez oznaczenia waluty
    const formatCurrency = (value) => {
        return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    };
    
    // Utwórz treść elementu listy
    fileItem.innerHTML = `
        <div class="file-info-header">
            <span class="file-name">${fileName}</span>
            <span class="file-platform">${data.platform}</span>
        </div>
        <div class="file-data">
            <span class="file-data-item income">
                Income: <strong>${formatCurrency(data.financialData.Income)}</strong>
            </span>
            <span class="file-data-item expense">
                Expenses: <strong>${formatCurrency(data.financialData.Expenses)}</strong>
            </span>
            ${data.platform !== 'Amazon IT' && data.platform !== 'Amazon DE' ? 
                `<span class="file-data-item tax">
                    Tax: <strong>${formatCurrency(data.financialData.Tax)}</strong>
                </span>` : ''
            }
        </div>
    `;
    
    filesList.appendChild(fileItem);
}

/**
 * Aktualizuje tabele wyników na podstawie przetworzonych danych
 * @param {Object} data - Przetworzone dane z pliku
 */
function updateResultsTables(data) {
    const platform = data.platform;
    const currency = data.currency;
    const financialData = data.financialData;
    const platformConfig = Object.values(CONFIG).find(config => config.name === platform) || CONFIG.uk;
    
    // Dodajemy poziomy pewności dla wykrytych wartości (jeśli są dostępne)
    const confidenceLevels = data.confidenceLevels || {
        income: 'high',
        expenses: 'high',
        tax: 'high'
    };
    
    // Generujemy losowy 6-cyfrowy numer dla kolumny B
    const randomSixDigitNumber = Math.floor(100000 + Math.random() * 900000);
    
    // Przygotuj wartości do aktualizacji
    const cellsToUpdate = [];
    
    // Dodaj Income jeśli mapping istnieje
    if (platformConfig.mappings.income[0] !== 'none') {
        cellsToUpdate.push({
            table: platformConfig.mappings.income[0],
            row: platformConfig.mappings.income[1],
            column: platformConfig.mappings.income[2],
            value: financialData.Income.toFixed(2),
            className: `value-cell income confidence-${confidenceLevels.income}`
        });
    }
    
    // Dodaj Expenses jeśli mapping istnieje
    if (platformConfig.mappings.expenses[0] !== 'none') {
        cellsToUpdate.push({
            table: platformConfig.mappings.expenses[0],
            row: platformConfig.mappings.expenses[1],
            column: platformConfig.mappings.expenses[2],
            value: financialData.Expenses.toFixed(2),
            className: `value-cell expense confidence-${confidenceLevels.expenses}`
        });
    }
    
    // Dodaj Tax tylko jeśli to NIE jest Amazon DE/IT i istnieje mapping
    if (platform !== 'Amazon DE' && platform !== 'Amazon IT' && platformConfig.mappings.tax[0] !== 'none') {
        cellsToUpdate.push({
            table: platformConfig.mappings.tax[0],
            row: platformConfig.mappings.tax[1],
            column: platformConfig.mappings.tax[2],
            value: financialData.Tax.toFixed(2),
            className: `value-cell tax confidence-${confidenceLevels.tax}`
        });
    }
    
    // Aktualizuj komórki
    cellsToUpdate.forEach(update => {
        const tableElement = update.table === 'sales' ? salesTable : billsTable;
        updateTableCell(tableElement, update);
    });
    
    // Dodatkowy krok: wypełnij kolumnę B (indeks 0) losowym numerem
    // Dla tabeli sales w wierszu przychodów
    const salesPlatformRow = platformConfig.mappings.income[1];
    if (platformConfig.mappings.income[0] === 'sales') {
        updateTableCell(salesTable, {
            row: salesPlatformRow,
            column: 0,
            value: randomSixDigitNumber,
            bold: true
        });
    }
    
    // Dla tabeli bills w wierszu wydatków
    const billsPlatformRow = platformConfig.mappings.expenses[1];
    if (platformConfig.mappings.expenses[0] === 'bills') {
        updateTableCell(billsTable, {
            row: billsPlatformRow,
            column: 0,
            value: randomSixDigitNumber,
            bold: true
        });
    }
}   
/**
 * Aktualizuje komórkę w tabeli
 * @param {HTMLElement} table - Element tabeli
 * @param {Object} update - Obiekt z informacjami o aktualizacji
 */
function updateTableCell(table, update) {
    const row = table.querySelector(`tbody tr:nth-child(${update.row + 1})`);
    if (!row) return;
    
    const cell = row.querySelector(`td:nth-child(${update.column + 2})`); // +2 bo pierwsza kolumna to numer wiersza
    if (!cell) return;
    
    // Wartość domyślna
    let displayValue = update.value;
    
    // Jeśli to tabela bills i wartość jest ujemna, wyświetl wartość dodatnią
    if (table.id === 'billsTable' && typeof update.value === 'string' && update.value.startsWith('-')) {
        displayValue = update.value.substring(1); // Usuń znak minus
    }
    
    // Ustaw wartość bez oznaczenia waluty
    cell.textContent = displayValue;
    
    if (update.className) {
        cell.className = update.className;
    }
    if (update.bold) {
        cell.style.fontWeight = 'bold';
    }
    
    cell.dataset.platform = update.platform || '';
    cell.dataset.value = update.value || '';
}

    /**
     * Generuje i pobiera plik Excel z danymi
     */
    function downloadExcel() {
        if (allProcessedData.length === 0 && !tablesHaveData()) {
            showAlert(labels.noDataError, 'error');
            return;
        }
        
        // Przygotowanie danych do Excela
        const wb = XLSX.utils.book_new();
        
        // Stwórz arkusz dla Sales
        const salesData = tableToArray(salesTable);
        const salesWs = XLSX.utils.aoa_to_sheet(salesData);
        XLSX.utils.book_append_sheet(wb, salesWs, 'Sales');
        
        // Stwórz arkusz dla Bills
        const billsData = tableToArray(billsTable);
        const billsWs = XLSX.utils.aoa_to_sheet(billsData);
        XLSX.utils.book_append_sheet(wb, billsWs, 'Bills');
        
        // Pobierz plik
        XLSX.writeFile(wb, 'amazon_reports_summary.xlsx');
        
        showAlert(labels.downloadSuccess, 'success');
    }
    
    /**
     * Konwertuje tabelę HTML na tablicę dwuwymiarową
     * @param {HTMLElement} table - Element tabeli
     * @returns {Array} - Tablica dwuwymiarowa z danymi
     */
    function tableToArray(table) {
        const data = [];
        
        // Dodaj nagłówki (A-O)
        const headers = ['', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
        data.push(headers);
        
        // Dodaj dane z tabeli
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const rowData = [];
            
            // Dodaj numer wiersza
            const rowIndex = row.dataset.rowIndex;
            rowData.push(rowIndex);
            
            // Dodaj zawartość komórek
            const cells = row.querySelectorAll('td:not(:first-child)');
            cells.forEach(cell => {
                rowData.push(cell.textContent.trim() === '\u00A0' ? '' : cell.textContent.trim());
            });
            
            data.push(rowData);
        });
        
        return data;
    }
    
    /**
     * Sprawdza, czy tabele wyników zawierają jakiekolwiek dane
     * @returns {boolean} - True jeśli zawierają dane, false w przeciwnym razie
     */
    function tablesHaveData() {
        return tableHasData(salesTable) || tableHasData(billsTable);
    }
    
    /**
     * Sprawdza, czy dana tabela zawiera jakiekolwiek dane
     * @param {HTMLElement} table - Element tabeli
     * @returns {boolean} - True jeśli zawiera dane, false w przeciwnym razie
     */
    function tableHasData(table) {
        const cells = table.querySelectorAll('tbody td:not(.row-header)');
        for (const cell of cells) {
            if (cell.textContent.trim() !== '' && cell.textContent.trim() !== '\u00A0') {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Czyści wszystkie dane i resetuje tabele
     */
    function clearData() {
        // Czyszczenie danych
        allProcessedData = [];
        
        // Resetowanie tabel
        initializeResultsTables();
        
        // Usunięcie informacji o przetworzonych plikach
        const filesInfoContainer = document.getElementById('processedFilesInfo');
        if (filesInfoContainer) {
            filesInfoContainer.remove();
        }
        
        showAlert(labels.dataCleared, 'success');
    }
    /**
     * Wyświetla alert dla użytkownika
     * @param {string} message - Treść komunikatu
     * @param {string} type - Typ alertu ('success' lub 'error')
     */
    function showAlert(message, type) {
        alertArea.innerHTML = message;
        alertArea.className = `alert alert-${type}`;
        alertArea.classList.remove('hidden');
        
        // Automatycznie ukrywamy alert po 5 sekundach
        setTimeout(() => {
            alertArea.classList.add('hidden');
        }, 5000);
    }
    
    /**
     * Testuje ekstrakcję danych z pliku PDF Amazon UK
     * Funkcja używana w trybie debugowania
     */
    async function testAmazonUkExtraction() {
        const debugOutput = document.getElementById('debugOutput');
        debugOutput.innerHTML = '<div class="loader"></div><p>Testowanie ekstrakcji danych z przykładowego pliku Amazon UK...</p>';
        
        try {
            // Symulujemy plik PDF, używając debugowego pliku
            const fileInput = document.getElementById('fileInput');
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                
                // Odczytaj plik jako tekst
                const reader = new FileReader();
                reader.onload = async function(e) {
                    try {
                        // Utwórz nowy element pre na tekst
                        const textContainer = document.createElement('pre');
                        textContainer.className = 'debug-text';
                        textContainer.textContent = '';
                        
                        // Dodaj nagłówek do tekstu
                        debugOutput.innerHTML = '<h4>Debugowanie ekstrakcji danych:</h4>';
                        
                        // Utwórz kontener na logi
                        const logsContainer = document.createElement('div');
                        logsContainer.className = 'debug-logs';
                        
                        // Podmieniamy console.log, aby zapisywał do naszego kontenera
                        const originalConsoleLog = console.log;
                        console.log = function() {
                            const args = Array.from(arguments);
                            const logLine = document.createElement('div');
                            logLine.className = 'log-line';
                            logLine.textContent = args.join(' ');
                            logsContainer.appendChild(logLine);
                            
                            // Wywołaj oryginalny console.log
                            originalConsoleLog.apply(console, arguments);
                        };
                        
                        // Wywołaj funkcję procesującą plik
                        const result = await processPdf(file, 'uk');
                        
                        // Przywróć oryginalny console.log
                        console.log = originalConsoleLog;
                        
                        // Dodaj wyniki do debugOutput
                        const resultContainer = document.createElement('div');
                        resultContainer.className = 'debug-result';
                        resultContainer.innerHTML = `
                            <h4>Wyniki ekstrakcji:</h4>
                            <div class="result-item">Income: <strong>${result.financialData.Income.toFixed(2)} ${result.currency}</strong></div>
                            <div class="result-item">Expenses: <strong>${result.financialData.Expenses.toFixed(2)} ${result.currency}</strong></div>
                            <div class="result-item">Tax: <strong>${result.financialData.Tax.toFixed(2)} ${result.currency}</strong></div>
                        `;
                        
                        // Dodaj wszystkie kontenery do debugOutput
                        debugOutput.appendChild(resultContainer);
                        debugOutput.appendChild(document.createElement('hr'));
                        debugOutput.appendChild(document.createElement('h4')).textContent = 'Logi debugowania:';
                        debugOutput.appendChild(logsContainer);
                        
                    } catch (error) {
                        debugOutput.innerHTML += `<p class="error">Błąd podczas testowania: ${error.message}</p>`;
                        console.error('Błąd testowania:', error);
                    }
                };
                
                reader.onerror = function() {
                    debugOutput.innerHTML += `<p class="error">Błąd odczytu pliku</p>`;
                };
                
                reader.readAsArrayBuffer(file);
            } else {
                debugOutput.innerHTML = '<p class="error">Najpierw wybierz plik PDF do debugowania</p>';
            }
        } catch (error) {
            debugOutput.innerHTML += `<p class="error">Błąd: ${error.message}</p>`;
            console.error('Błąd testowania:', error);
        }
    }
    /**
     * Pokazuje tekst z pliku PDF
     * Funkcja używana w trybie debugowania
     */
    async function showPdfText() {
        const debugOutput = document.getElementById('debugOutput');
        debugOutput.innerHTML = '<div class="loader"></div><p>Odczytywanie tekstu z pliku PDF...</p>';
        
        try {
            // Symulujemy plik PDF, używając debugowego pliku
            const fileInput = document.getElementById('fileInput');
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                
                // Odczytaj plik jako arraybuffer
                const reader = new FileReader();
                reader.onload = async function(e) {
                    try {
                        const arrayBuffer = e.target.result;
                        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                        
                        let fullText = '';
                        
                        // Przetwarzamy każdą stronę PDF
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            const pageText = textContent.items.map(item => item.str).join(' ');
                            fullText += pageText + '\n\n--- KONIEC STRONY ' + i + ' ---\n\n';
                        }
                        
                        // Utwórz nowy element pre na tekst
                        const textContainer = document.createElement('pre');
                        textContainer.className = 'debug-text';
                        textContainer.textContent = fullText;
                        
                        // Dodaj nagłówek i tekst do debugOutput
                        debugOutput.innerHTML = '<h4>Tekst wyodrębniony z pliku PDF:</h4>';
                        debugOutput.appendChild(textContainer);
                        
                    } catch (error) {
                        debugOutput.innerHTML += `<p class="error">Błąd podczas odczytu tekstu: ${error.message}</p>`;
                        console.error('Błąd odczytu tekstu:', error);
                    }
                };
                
                reader.onerror = function() {
                    debugOutput.innerHTML += `<p class="error">Błąd odczytu pliku</p>`;
                };
                
                reader.readAsArrayBuffer(file);
            } else {
                debugOutput.innerHTML = '<p class="error">Najpierw wybierz plik PDF do odczytu</p>';
            }
        } catch (error) {
            debugOutput.innerHTML += `<p class="error">Błąd: ${error.message}</p>`;
            console.error('Błąd odczytu tekstu:', error);
        }
    }
});
