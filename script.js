document.getElementById('convert-btn').onclick = function() {
    const fileInput = document.getElementById('csv-input');
    
    if (!fileInput.files.length) {
        alert('Bitte wähle zuerst eine CSV-Datei aus.');
        return;
    }

    const file = fileInput.files[0];
    
    // Dateiname anpassen: .csv entfernen und " Fertig.csv" anhängen
    const originalName = file.name.replace(/\.[^/.]+$/, "");
    const newFileName = `${originalName} Fertig.csv`;

    const reader = new FileReader();

    reader.onload = function(e) {
        const text = e.target.result;
        processCSV(text, newFileName);
    };

    reader.readAsText(file);
};

function processCSV(csvText, fileName) {
    const lines = csvText.split('\n');
    let outputRows = [];
    
    // NEU: "Kunde ?" wurde hier eingefügt
    const header = ['Straße Hausnummer', 'Name', 'Kunde ?', 'Angetroffen', 'Vertrag', 'Wohnlage', 'Kommentar'];
    outputRows.push(header.join(';'));

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // Anführungszeichen bereinigen
        if (line.startsWith('"') && line.endsWith('"')) {
            line = line.substring(1, line.length - 1);
        }

        // Trennung am ","
        const columns = line.split('","');

        // Sicherheitscheck
        if (columns.length < 5) continue;

        const address = columns[3].trim();
        let weCount = parseInt(columns[4]);

        if (isNaN(weCount) || weCount <= 0) continue;

        // Zeilen vervielfachen
        for (let j = 0; j < weCount; j++) {
            let row = [
                `"${address}"`, 
                "", // Name
                "", // Kunde ? (NEU: Leeres Feld)
                "", // Angetroffen
                "", // Vertrag
                "", // Wohnlage
                ""  // Kommentar
            ];
            outputRows.push(row.join(';'));
        }
    }

    downloadCSV(outputRows.join('\n'), fileName);
}

function downloadCSV(content, fileName) {
    // BOM hinzufügen, damit Excel Umlaute richtig erkennt
    const blob = new Blob(["\ufeff" + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
