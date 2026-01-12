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
    
    // Kopfzeile
    const header = ['Straße Hausnummer', 'Name', 'Angetroffen', 'Vertrag', 'Wohnlage', 'Kommentar'];
    outputRows.push(header.join(';'));

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // Wir entfernen die äußeren Anführungszeichen, damit wir sauber trennen können
        if (line.startsWith('"') && line.endsWith('"')) {
            line = line.substring(1, line.length - 1);
        }

        // Wir trennen am Text "," (Anführungszeichen-Komma-Anführungszeichen)
        // Das ist bei deiner Datei sehr sicher.
        const columns = line.split('","');

        // Sicherheitscheck
        if (columns.length < 5) continue;

        // Spalte 4 ist die Adresse (Index 3)
        const address = columns[3].trim();
        
        // Spalte 5 ist die Anzahl (Index 4)
        let weCount = parseInt(columns[4]);

        // Falls die Zeile keine gültige Anzahl hat (z.B. Überschrift), überspringen
        if (isNaN(weCount) || weCount <= 0) continue;

        // Zeilen vervielfachen
        for (let j = 0; j < weCount; j++) {
            // CSV-Zeile bauen: "Adresse";;;;;
            let row = [
                `"${address}"`, 
                "", 
                "", 
                "", 
                "", 
                ""
            ];
            outputRows.push(row.join(';'));
        }
    }

    downloadCSV(outputRows.join('\n'));
}

function downloadCSV(content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "D2D_Liste_Final.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
