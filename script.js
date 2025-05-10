document.getElementById('ocr-btn').onclick = async function() {
    const fileInput = document.getElementById('image-input');
    const csvAllBtn = document.getElementById('csv-all');
    const csvStrassenBtn = document.getElementById('csv-strassen');
    const progressBar = document.getElementById('progress-bar');
    const progressBarInner = document.getElementById('progress-bar-inner');
    csvAllBtn.style.display = 'none';
    csvStrassenBtn.style.display = 'none';
    progressBar.style.display = 'block';
    progressBarInner.style.width = '0%';

    if (!fileInput.files.length) {
        progressBar.style.display = 'none';
        alert('Bitte wähle mindestens ein Bild aus.');
        return;
    }

    let ocrResults = [];
    for (let i = 0; i < fileInput.files.length; i++) {
        const file = fileInput.files[i];
        progressBarInner.style.width = `${Math.round((i / fileInput.files.length) * 100)}%`;
        const worker = await Tesseract.createWorker('deu');
        const { data: { text } } = await worker.recognize(file);
        await worker.terminate();
        ocrResults.push({file: file.name, text});
    }
    progressBarInner.style.width = '100%';
    setTimeout(() => { progressBar.style.display = 'none'; }, 500);

    // Adressen extrahieren (verbesserte Hausnummern-Logik)
    let adressen = [];
    for (const result of ocrResults) {
        const lines = result.text.split('\n').map(l => l.trim()).filter(l => l);
        for (const line of lines) {
            let adressenteil = line.split(',')[1]?.trim();
            if (adressenteil) {
                // Suche von rechts nach Hausnummer (Zahl mit optionalem Leerzeichen und Buchstabe)
                let hausnummerMatch = adressenteil.match(/(\d{1,4}\s?[a-zA-Z]?)(?=\s*\d*$)/);
                let hausnummer = '';
                let strasse = '';
                let anzahl = '';
                if (hausnummerMatch) {
                    hausnummer = hausnummerMatch[1].replace(/\s+/g, ' ').trim();
                    strasse = adressenteil.slice(0, hausnummerMatch.index).trim();
                    // Anzahl ist das letzte Element (nach der Hausnummer)
                    let parts = adressenteil.slice(hausnummerMatch.index + hausnummer.length).trim().split(/\s+/);
                    anzahl = parts[parts.length - 1];
                }
                if (strasse && hausnummer && anzahl) {
                    for (let i = 0; i < parseInt(anzahl); i++) {
                        adressen.push({strasse, hausnummer});
                    }
                }
            }
        }
    }

    if (adressen.length > 0) {
        csvAllBtn.style.display = '';
        csvStrassenBtn.style.display = '';

        csvAllBtn.onclick = function() {
            let csv = 'Straße;Hausnummer;Name;Angetroffen;Vertrag;Lohnt sich;Grund\n';
            adressen.forEach(a => {
                csv += `${a.strasse};${a.hausnummer};;;;;\n`;
            });
            const blob = new Blob([csv], {type: 'text/csv'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'alle_adressen.csv';
            a.click();
            URL.revokeObjectURL(url);
        };

        csvStrassenBtn.onclick = function() {
            // Für jede Straße alle passenden Einträge aus adressen nehmen und als ZIP packen
            let strassenSet = new Set(adressen.map(a => a.strasse));
            let zip = new JSZip();
            strassenSet.forEach(strasse => {
                let csv = 'Straße;Hausnummer;Name;Angetroffen;Vertrag;Lohnt sich;Grund\n';
                adressen.filter(a => a.strasse === strasse).forEach(a => {
                    csv += `${a.strasse};${a.hausnummer};;;;;\n`;
                });
                zip.file(`${strasse.replace(/\W+/g,'_')}.csv`, csv);
            });
            zip.generateAsync({type: 'blob'}).then(function(content) {
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'strassen_csv.zip';
                a.click();
                URL.revokeObjectURL(url);
            });
        };
    } else {
        csvAllBtn.style.display = 'none';
        csvStrassenBtn.style.display = 'none';
    }
}; 