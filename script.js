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
        processCSVtoExcel(text);
    };

    reader.readAsText(file);
};

function processCSVtoExcel(csvText) {
    const lines = csvText.split('\n');
    
    // Wir sammeln die Daten für Excel
    // Header-Zeile
    let excelData = [['Straße Hausnummer', 'Name', 'Angetroffen', 'Vertrag', 'Wohnlage', 'Kommentar']];
    
    // Variablen für die Farb-Logik
    let lastAddress = "";
    let isGray = false; // Startet mit Weiß
    
    // Array um zu speichern, welche Zeilen welche Farbe bekommen sollen
    let rowStyles = []; 
    // Header ist Zeile 0, hat keine spezielle Hintergrundfarbe (oder man könnte sie fett machen)
    rowStyles.push(null); 

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // Anführungszeichen entfernen und splitten
        if (line.startsWith('"') && line.endsWith('"')) {
            line = line.substring(1, line.length - 1);
        }
        const columns = line.split('","');

        if (columns.length < 5) continue;

        const address = columns[3].trim();
        let weCount = parseInt(columns[4]);

        if (isNaN(weCount) || weCount <= 0) continue;

        // --- Farbwechsel-Logik ---
        // Wenn die Adresse anders ist als die vorherige, Farbe umschalten
        if (address !== lastAddress) {
            isGray = !isGray; // Umschalten: Wahr -> Falsch -> Wahr...
            lastAddress = address;
        }

        // --- Zeilen erstellen ---
        for (let j = 0; j < weCount; j++) {
            // Datenzeile hinzufügen
            excelData.push([address, "", "", "", "", ""]);
            
            // Merken, ob diese Zeile grau sein soll
            rowStyles.push(isGray);
        }
    }

    createAndDownloadExcel(excelData, rowStyles);
}

function createAndDownloadExcel(data, styles) {
    // Ein neues Workbook erstellen
    const wb = XLSX.utils.book_new();
    
    // Daten in ein Sheet umwandeln
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Spaltenbreite etwas anpassen (optisch schöner)
    ws['!cols'] = [
        { wch: 30 }, // Straße
        { wch: 20 }, // Name
        { wch: 15 }, // Angetroffen
        { wch: 15 }, // Vertrag
        { wch: 15 }, // Wohnlage
        { wch: 40 }  // Kommentar
    ];

    // Styles anwenden
    // Wir iterieren über alle Zellen im Sheet
    // range decodieren gibt uns den Bereich (z.B. A1 bis F100)
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    for (let R = range.s.r; R <= range.e.r; ++R) {
        // Überspringe Header (Zeile 0), falls gewünscht
        if (R === 0) {
            // Optional: Header fett machen
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_ref = XLSX.utils.encode_cell({c: C, r: R});
                if (!ws[cell_ref]) ws[cell_ref] = { t: 's', v: '' }; // Leere Zellen absichern
                ws[cell_ref].s = { 
                    font: { bold: true },
                    fill: { fgColor: { rgb: "CCCCCC" } } // Dunkleres Grau für Header
                }; 
            }
            continue;
        }

        // Prüfen ob diese Zeile grau sein soll (basierend auf unserem styles Array)
        // styles[R] enthält true oder false
        if (styles[R] === true) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_ref = XLSX.utils.encode_cell({c: C, r: R});
                // Falls Zelle leer ist, initialisieren wir sie, damit wir Style anwenden können
                if (!ws[cell_ref]) ws[cell_ref] = { t: 's', v: '' };
                
                // Style Objekt hinzufügen
                ws[cell_ref].s = {
                    fill: { fgColor: { rgb: "EEEEEE" } }, // Hellgrau (Hex-Code ohne #)
                    border: {
                        top: { style: "thin", color: { auto: 1 } },
                        bottom: { style: "thin", color: { auto: 1 } },
                        left: { style: "thin", color: { auto: 1 } },
                        right: { style: "thin", color: { auto: 1 } }
                    }
                };
            }
        } else {
            // Auch für weiße Zellen Ränder hinzufügen (sieht sauberer aus)
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_ref = XLSX.utils.encode_cell({c: C, r: R});
                if (!ws[cell_ref]) ws[cell_ref] = { t: 's', v: '' };
                
                ws[cell_ref].s = {
                     border: {
                        top: { style: "thin", color: { auto: 1 } },
                        bottom: { style: "thin", color: { auto: 1 } },
                        left: { style: "thin", color: { auto: 1 } },
                        right: { style: "thin", color: { auto: 1 } }
                    }
                };
            }
        }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Adressliste");
    XLSX.writeFile(wb, "D2D_Liste_Farbig.xlsx");
}
