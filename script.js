// Globale Variable, um die geladenen Daten zu speichern
let parsedData = [];
let originalFileName = "Export";

// Event Listener für Datei-Auswahl
document.getElementById('csv-input').addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        originalFileName = file.name.replace(/\.[^/.]+$/, ""); // Name ohne Endung
        const reader = new FileReader();
        reader.onload = function(evt) {
            parseCSV(evt.target.result);
        };
        reader.readAsText(file);
    }
});

// Button 1: Alles in eine CSV
document.getElementById('convert-btn').onclick = function() {
    if (parsedData.length === 0) {
        alert('Bitte wähle zuerst eine CSV-Datei aus.');
        return;
    }
    generateSingleCSV();
};

// Button 2: ZIP pro Straße
document.getElementById('zip-btn').onclick = function() {
    if (parsedData.length === 0) {
        alert('Bitte wähle zuerst eine CSV-Datei aus.');
        return;
    }
    generateZipPerStreet();
};

function parseCSV(csvText) {
    parsedData = [];
    const lines = csvText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // Anführungszeichen entfernen
        if (line.startsWith('"') && line.endsWith('"')) {
            line = line.substring(1, line.length - 1);
        }

        // Trennen (für die neue 2-Spalten-Datei)
        const columns = line.split('","');

        // Mindestens 2 Spalten (Adresse, WE)
        if (columns.length < 2) continue;

        const address = columns[0].trim();
        const weCount = parseInt(columns[1]);

        if (isNaN(weCount) || weCount <= 0) continue;

        // Straßenname extrahieren (Alles vor der letzten Zahl)
        // z.B. "Mohrhennsfeld 17" -> "Mohrhennsfeld"
        // z.B. "Paul-Therstappen-Str. 9" -> "Paul-Therstappen-Str."
        let streetName = address.replace(/\s+\d+[a-zA-Z]*\s*$/, "").trim();
        
        // Fallback, falls Regex nichts findet (z.B. wenn keine Hausnummer da ist)
        if (!streetName) streetName = address;

        parsedData.push({
            fullAddress: address,
            weCount: weCount,
            street: streetName
        });
    }
    console.log("Datei geladen. Anzahl Einträge:", parsedData.length);
}

function generateSingleCSV() {
    let outputRows = [];
    const header = ['Straße Hausnummer', 'Name', 'Kunde ?', 'Angetroffen', 'Vertrag', 'Wohnlage', 'Kommentar'];
    outputRows.push(header.join(';'));

    parsedData.forEach(item => {
        for (let j = 0; j < item.weCount; j++) {
            let row = [`"${item.fullAddress}"`, "", "", "", "", "", ""];
            outputRows.push(row.join(';'));
        }
    });

    downloadFile(outputRows.join('\n'), `${originalFileName} Fertig.csv`, 'text/csv');
}

function generateZipPerStreet() {
    const zip = new JSZip();
    
    // Daten nach Straßen gruppieren
    let streets = {};
    
    parsedData.forEach(item => {
        if (!streets[item.street]) {
            streets[item.street] = [];
        }
        streets[item.street].push(item);
    });

    // Für jede Straße eine CSV bauen
    Object.keys(streets).forEach(streetName => {
        let outputRows = [];
        const header = ['Straße Hausnummer', 'Name', 'Kunde ?', 'Angetroffen', 'Vertrag', 'Wohnlage', 'Kommentar'];
        outputRows.push(header.join(';'));

        streets[streetName].forEach(item => {
            for (let j = 0; j < item.weCount; j++) {
                let row = [`"${item.fullAddress}"`, "", "", "", "", "", ""];
                outputRows.push(row.join(';'));
            }
        });

        // CSV zum ZIP hinzufügen
        // Dateiname bereinigen (keine Sonderzeichen im Dateinamen)
        const safeFileName = streetName.replace(/[^a-z0-9äöüß \.\-]/gi, '_');
        zip.file(`${safeFileName}.csv`, "\ufeff" + outputRows.join('\n'));
    });

    // ZIP generieren und herunterladen
    zip.generateAsync({type:"blob"}).then(function(content) {
        // Wir nutzen hier eine Hilfsfunktion zum Download
        const url = URL.createObjectURL(content);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${originalFileName}_Strassen_Paket.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

function downloadFile(content, fileName, mimeType) {
    const blob = new Blob(["\ufeff" + content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
