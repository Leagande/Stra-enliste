document.getElementById('convert-btn').onclick = function() {
    const fileInput = document.getElementById('csv-input');
    
    if (!fileInput.files.length) {
        alert('Bitte wähle zuerst eine CSV-Datei aus.');
        return;
    }

    const file = fileInput.files[0];
    
    // Original-Dateinamen holen und Endung entfernen
    // z.B. "Nettetal.csv" -> "Nettetal"
    const originalName = file.name.replace(/\.[^/.]+$/, "");
    const newFileName = `${originalName} Fertig.xlsx`;

    const reader = new FileReader();

    reader.onload = function(e) {
        const text = e.target.result;
        processCSVtoExcel(text, newFileName);
    };

    reader.readAsText(file);
};

function processCSVtoExcel(csvText, fileName) {
    const lines = csvText.split('\n');
    
    // Header-Zeile definieren
    let excelData = [['Straße Hausnummer', 'Name', 'Angetroffen', 'Vertrag', 'Wohnlage', 'Kommentar']];
    
    let lastAddress = "";
    let isGray = false; 
    let rowStyles = []; 
    
    // Style für Header vormerken (Index 0)
    rowStyles.push("HEADER"); 

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('"') && line.endsWith('"')) {
            line = line.substring(1, line.length - 1);
        }
        const columns = line.split('","');

        if (columns.length < 5) continue;

        const address = columns[3].trim();
        let weCount = parseInt(columns[4]);

        if (isNaN(weCount) || weCount <= 0) continue;

        if (address !== lastAddress) {
            isGray = !isGray;
            lastAddress = address;
        }

        for (let j = 0; j < weCount; j++) {
            excelData.push([address, "", "", "", "", ""]);
            // Speichern, ob Zeile grau oder weiß sein soll
            rowStyles.push(isGray ? "GRAY" : "WHITE");
        }
    }

    createAndDownloadExcel(excelData, rowStyles, fileName);
}

function createAndDownloadExcel(data, styles, fileName) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Spaltenbreiten definieren
    ws['!cols'] = [
        { wch: 30 }, // Straße
        { wch: 20 }, // Name
        { wch: 15 }, // Angetroffen
        { wch: 15 }, // Vertrag
        { wch: 15 }, // Wohnlage
        { wch: 40 }  // Kommentar
    ];

    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Pyur Farben
    const pyurRed = "E60000"; 
    const pyurGray = "F5F5F5"; // Sehr helles Grau
    const white = "FFFFFF";

    for (let R = range.s.r; R <= range.e.r; ++R) {
        const styleType = styles[R]; // "HEADER", "GRAY" oder "WHITE"

        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_ref = XLSX.utils.encode_cell({c: C, r: R});
            if (!ws[cell_ref]) ws[cell_ref] = { t: 's', v: '' };

            let cellStyle = {
                border: {
                    top: { style: "thin", color: { auto: 1 } },
                    bottom: { style: "thin", color: { auto: 1 } },
                    left: { style: "thin", color: { auto: 1 } },
                    right: { style: "thin", color: { auto: 1 } }
                },
                font: { name: "Arial", sz: 11 }
            };

            if (styleType === "HEADER") {
                // Header: Pyur Rot, Weiße Schrift, Fett
                cellStyle.fill = { fgColor: { rgb: pyurRed } };
                cellStyle.font = { name: "Arial", sz: 12, bold: true, color: { rgb: white } };
                cellStyle.alignment = { horizontal: "center", vertical: "center" };
            } else if (styleType === "GRAY") {
                // Graue Zeile
                cellStyle.fill = { fgColor: { rgb: pyurGray } };
            } else {
                // Weiße Zeile (kein Fill nötig, aber explizit weiß ist sicherer)
                cellStyle.fill = { fgColor: { rgb: white } };
            }

            ws[cell_ref].s = cellStyle;
        }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Adressliste");
    XLSX.writeFile(wb, fileName);
}
