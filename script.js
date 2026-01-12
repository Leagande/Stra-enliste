document.getElementById('convert-btn').onclick = function() {
    const fileInput = document.getElementById('csv-input');
    
    if (!fileInput.files.length) {
        alert('Bitte wähle zuerst eine CSV-Datei aus.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const text = e.target.result;
        processCSV(text);
    };

    reader.readAsText(file);
};

function processCSV(csvText) {
    const lines = csvText.split('\n');
    let outputRows = [];
    
    // Kopfzeile für die neue Datei
    // Spalten: Straße Hausnummer, Name, Angetroffen, Vertrag, Wohnlage, Kommentar
    const header = ['Straße Hausnummer', 'Name', 'Angetroffen', 'Vertrag', 'Wohnlage', 'Kommentar'];
    outputRows.push(header.join(';'));

    // Wir überspringen evtl. die erste Zeile, falls es Header sind. 
    // In deiner Datei fangen Daten oft direkt an oder nach dem Header.
    // Wir iterieren durch alle Zeilen.
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // CSV Parser für Zeilen mit Anführungszeichen (wie in deiner Datei)
        const columns = parseCSVLine(line);

        // Sicherheitscheck: Genug Spalten vorhanden?
        if (columns.length < 5) continue;

        // Basierend auf deiner Datei "Nettetal Pyür.csv":
        // Spalte Index 3: Adresse (z.B. "Breyeller Str. 5")
        // Spalte Index 4: Anzahl WE (z.B. "5")
        // Hinweis: Arrays starten bei 0.
        
        let address = columns[3]; 
        let weCount = parseInt(columns[4]);

        // Falls die Header-Zeile erwischt wird (keine Zahl), überspringen
        if (isNaN(weCount)) continue;

        // Zeilen vervielfachen basierend auf WE Anzahl
        for (let j = 0; j < weCount; j++) {
            // Erstelle eine Zeile: Adresse;;;;;
            // Semikolon-getrennt für Excel/CSV Öffnung in Deutschland
            let row = [
                `"${address}"`, // Adresse in Anführungszeichen zur Sicherheit
                "", // Name leer
                "", // Angetroffen leer
                "", // Vertrag leer
                "", // Wohnlage leer
                ""  // Kommentar leer
            ];
            outputRows.push(row.join(';'));
        }
    }

    downloadCSV(outputRows.join('\n'));
}

// Hilfsfunktion: CSV Zeile korrekt splitten (ignoriert Kommas innerhalb von Anführungszeichen)
function parseCSVLine(text) {
    let result = [];
    let curValue = "";
    let inQuote = false;
    
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            result.push(curValue.replace(/^"|"$/g, '').trim()); // Anführungszeichen entfernen
            curValue = "";
        } else {
            curValue += char;
        }
    }
    result.push(curValue.replace(/^"|"$/g, '').trim());
    return result;
}

function downloadCSV(content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "D2D_Liste_Fertig.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
