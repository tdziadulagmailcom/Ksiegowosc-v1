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
    const resultsTable = document.getElementById('resultsTable');
    
    // Bieżący język interfejsu (na razie tylko polski)
    const currentLanguage = 'pl';
    const labels = TRANSLATIONS[currentLanguage];
    
    // Tablica na wszystkie przetworzone dane
    let allProcessedData = [];
    
    // Inicjalizacja tabeli wyników z 30 wierszami i predefiniowanymi danymi
    initializeResultsTable();
    
    // Od razu pokazujemy obszar wyników
    resultArea.classList.remove('hidden');
    
    // Przypisanie event listenerów
    processBtn.addEventListener('click', processFile);
    downloadBtn.addEventListener('click', downloadExcel);
    clearBtn.addEventListener('click', clearData);
    
    /**
     * Inicjalizuje tabelę wyników z 30 wierszami i predefiniowanymi danymi
     */
    function initializeResultsTable() {
        const tbody = resultsTable.querySelector('tbody');
        tbody.innerHTML = ''; // Wyczyść tabelę
        
        // Dane predefiniowane dla tabeli
        const prefilledData = [
            // Wiersz 1 - Nagłówki
            { cells: [{ text: "Platforma", col: 0 }, { text: "Przychody", col: 3 }, { text: "Wydatki", col: 9 }, { text: "Podatek", col: 12 }] },
            // Wiersz 2 - Podtytuł
            { cells: [{ text: "Amazon UK", col: 0 }] },
            // Wiersz 3-6 - Puste
            {}, {}, {}, {},
            // Wiersz 7 - Data dla Amazon UK (Wiersz 8 w tabeli)
            { cells: [
                { text: "Amazon UK", col: 0, bold: true }, 
                { text: "18877.68 GBP", col: 10, class: "value-cell income" },
                { text: "3775.67 GBP", col: 12, class: "value-cell tax" }
            ] },
            // Wiersz 8-19 - Puste lub dodatkowe dane
            {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
            // Wiersz 20 - Wydatki Amazon UK (Wiersz 21 w tabeli)
            { cells: [
                { text: "Amazon UK", col: 0, bold: true },
                { text: "-4681.52 GBP", col: 9, class: "value-cell expense" }
            ] },
            // Wiersz 21-29 - Puste lub dodatkowe dane
            {}, {}, {}, {}, {}, {}, {}, {}, {}
        ];
        
        // Utworzenie 30 wierszy
        for (let i = 1; i <= 30; i++) {
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
            
            // Wypełnij komórki predefiniowanymi danymi (jeśli istnieją)
            const rowData = prefilledData[i-1];
            if (rowData && rowData.cells) {
                rowData.cells.forEach(cellData => {
                    const cell = row.querySelector(`td[data-column-index="${cellData.col}"]`);
                    if (cell) {
                        cell.textContent = cellData.text;
                        if (cellData.class) {
                            cell.className = cellData.class;
                        }
                        if (cellData.bold) {
                            cell.style.fontWeight = 'bold';
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
            
            // Dodajemy dane do istniejących danych
            allProcessedData.push(extractedData);
            
            // Resetujemy pole wyboru pliku po przetworzeniu
            fileInput.value = '';
            
            // Aktualizujemy tabelę wyników
            updateResultsTable(extractedData);
            
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
     * Aktualizuje tabelę wyników na podstawie przetworzonych danych
     * @param {Object} data - Przetworzone dane z pliku
     */
    function updateResultsTable(data) {
        const platform = data.platform;
        const currency = data.currency;
        const financialData = data.financialData;
        const platformConfig = Object.values(CONFIG).find(config => config.name === platform) || CONFIG.uk;
        
        // Tworzymy mapę komórek do aktualizacji
        const cellUpdates = [
            // Przychody
            {
                row: platformConfig.mappings.income[0],
                column: platformConfig.mappings.income[1],
                value: financialData.Income.toFixed(2),
                className: 'value-cell income',
                suffix: ` ${currency}`
            },
            // Wydatki
            {
                row: platformConfig.mappings.expenses[0],
                column: platformConfig.mappings.expenses[1],
                value: financialData.Expenses.toFixed(2),
                className: 'value-cell expense',
                suffix: ` ${currency}`
            },
            // Podatek
            {
                row: platformConfig.mappings.tax[0],
                column: platformConfig.mappings.tax[1],
                value: financialData.Tax.toFixed(2),
                className: 'value-cell tax',
                suffix: ` ${currency}`
            }
        ];
        
        // Aktualizujemy komórki w tabeli
        cellUpdates.forEach(update => {
            const cell = getTableCell(update.row, update.column);
            if (cell) {
                cell.textContent = update.value + (update.suffix || '');
                cell.className = update.className || '';
                cell.dataset.platform = platform;
                cell.dataset.value = update.value;
            }
        });
        
        // Dodatkowy krok: wypełnij komórkę z nazwą platformy
        // Zwykle w kolumnie A (0) w tym samym wierszu co przychody
        const platformRow = platformConfig.mappings.income[0];
        const platformCell = getTableCell(platformRow, 0); // Kolumna B (indeks 0)
        if (platformCell) {
            platformCell.textContent = platform;
            platformCell.style.fontWeight = 'bold';
        }
    }
    
    /**
     * Pobiera komórkę z tabeli o określonym wierszu i kolumnie
     * @param {number} rowIndex - Indeks wiersza (0-29)
     * @param {number} colIndex - Indeks kolumny (0-13, odpowiada B-O)
     * @returns {HTMLElement|null} - Element komórki lub null
     */
    function getTableCell(rowIndex, colIndex) {
        // Wiersz w tabeli ma indeks +1 (wiersz 0 w danych to wiersz 1 w tabeli)
        const row = resultsTable.querySelector(`tbody tr[data-row-index="${rowIndex + 1}"]`);
        if (!row) return null;
        
        // Kolumna w tabeli ma indeks +1 (kolumna 0 to numer wiersza, 1-14 to kolumny B-O)
        return row.querySelector(`td[data-column-index="${colIndex}"]`);
    }
    
    /**
     * Generuje i pobiera plik Excel z danymi
     */
    function downloadExcel() {
        if (allProcessedData.length === 0 && !resultsHaveData()) {
            showAlert(labels.noDataError, 'error');
            return;
        }
        
        // Przygotowanie danych do Excela
        const wb = XLSX.utils.book_new();
        
        // Stwórz arkusz na podstawie danych z tabeli
        const tableData = [];
        
        // Dodaj nagłówki (A-O)
        const headers = ['', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
        tableData.push(headers);
        
        // Dodaj dane z tabeli
        const rows = resultsTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const rowData = [];
            
            // Dodaj numer wiersza
            const rowIndex = row.dataset.rowIndex;
            rowData.push(rowIndex);
            
            // Dodaj zawartość komórek
            const cells = row.querySelectorAll('td:not(:first-child)');
            cells.forEach(cell => {
                rowData.push(cell.textContent.trim());
            });
            
            tableData.push(rowData);
        });
        
        // Utwórz arkusz
        const ws = XLSX.utils.aoa_to_sheet(tableData);
        
        // Dodaj do workbooka
        XLSX.utils.book_append_sheet(wb, ws, 'Amazon Reports');
        
        // Pobierz plik
        XLSX.writeFile(wb, 'amazon_reports_summary.xlsx');
        
        showAlert(labels.downloadSuccess, 'success');
    }
    
    /**
     * Sprawdza, czy tabela wyników zawiera jakiekolwiek dane
     * @returns {boolean} - True jeśli zawiera dane, false w przeciwnym razie
     */
    function resultsHaveData() {
        const cells = resultsTable.querySelectorAll('tbody td:not(.row-header)');
        for (const cell of cells) {
            if (cell.textContent.trim() !== '' && cell.textContent.trim() !== '\u00A0') {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Czyści wszystkie dane i resetuje tabelę
     */
    function clearData() {
        // Czyszczenie danych
        allProcessedData = [];
        
        // Resetowanie tabeli
        initializeResultsTable();
        
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
});